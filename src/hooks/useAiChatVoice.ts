import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Keyboard, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import * as Speech from 'expo-speech';
import { discardVoice, refineVoiceText, transcribePcm, transcribeVoice } from '@/api/ai-voice';
import { useAiVoiceStream } from './useAiVoiceStream';

type Phase = 'starting' | 'recording' | 'stopping' | 'transcribing' | 'refining' | 'canceling';
type LiveCapture = {
  chunks: Int16Array[]; rate: number; samples: number; voiced: number;
  firstVoice: number | null; lastVoice: number;
  lastPreview: number; previewVoiced: number; lastMeter: number; lastText: string; lastTextEnd: number;
  pending?: Promise<void>;
};
type Attempt = {
  phase: Phase; controller: AbortController; uri: string | null; requestingPermission: boolean;
  live?: LiveCapture; timer?: ReturnType<typeof setTimeout>;
};
const RECORDING_OPTIONS = { ...RecordingPresets.HIGH_QUALITY, numberOfChannels: 1, isMeteringEnabled: true };

function speechEnd(live: LiveCapture) {
  return Math.min(live.samples, live.lastVoice + Math.round(live.rate * 0.3));
}

function transcribeSpeech(live: LiveCapture, end: number, signal: AbortSignal) {
  const start = Math.max(0, (live.firstVoice ?? 0) - Math.round(live.rate * 0.3));
  const speech: Int16Array[] = [];
  let offset = 0;
  for (const chunk of live.chunks) {
    const next = offset + chunk.length;
    if (next > start) speech.push(chunk.subarray(Math.max(0, start - offset), end - offset));
    if (next >= end) break;
    offset = next;
  }
  return transcribePcm(speech, live.rate, signal);
}

export function useAiChatVoice(customerId: string | undefined, onTranscript: (text: string) => void) {
  const attempt = useRef<Attempt | null>(null);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState('');
  const [level, setLevel] = useState(0);
  const [refinement, setRefinement] = useState<{ text: string; original: string; showOriginal: boolean } | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const playback = useRef({ version: 0, id: null as string | null });
  const receive = useRef(onTranscript);
  useEffect(() => { receive.current = onTranscript; }, [onTranscript]);

  const stopSpeaking = useCallback(async () => {
    if (playback.current.id === null) return;
    playback.current = { version: playback.current.version + 1, id: null };
    setSpeakingId(null);
    await Speech.stop().catch(() => {});
  }, []);

  const resetAudioMode = useCallback(async () => {
    if (Platform.OS === 'ios') await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
  }, []);

  const stream = useAiVoiceStream(buffer => {
    const active = attempt.current;
    const live = active?.live;
    if (!active || !live || !['starting', 'recording'].includes(active.phase) || buffer.channels !== 1) return;
    if (live.rate && live.rate !== buffer.sampleRate) return;
    live.rate = buffer.sampleRate;
    const pcm = new Int16Array(buffer.data);
    live.chunks.push(pcm);
    live.samples += pcm.length;
    let squared = 0;
    for (const sample of pcm) squared += sample * sample;
    const rms = Math.sqrt(squared / Math.max(1, pcm.length)) / 32768;
    if (rms >= 0.003) {
      live.firstVoice ??= live.samples - pcm.length;
      live.lastVoice = live.samples;
      live.voiced += pcm.length;
    }
    if (live.samples - live.lastMeter >= live.rate * 0.1) {
      live.lastMeter = live.samples;
      setLevel(Math.max(0, Math.min(1, (20 * Math.log10(Math.max(rms, 0.00001)) + 54) / 42)));
    }
    const secondsSincePreview = (live.samples - live.lastPreview) / live.rate;
    const paused = live.samples - live.lastVoice >= live.rate * 0.35;
    const previewDue = secondsSincePreview >= 3 || (paused && secondsSincePreview >= 1.25);
    if (active.phase !== 'recording' || live.pending || !previewDue || live.voiced - live.previewVoiced < live.rate * 0.25) return;
    live.lastPreview = live.samples;
    live.previewVoiced = live.voiced;
    const end = speechEnd(live);
    live.pending = transcribeSpeech(live, end, active.controller.signal).then(({ text }) => {
      if (attempt.current === active && !active.controller.signal.aborted) {
        live.lastText = text;
        live.lastTextEnd = end;
        if (active.phase === 'recording') setPreview(text);
      }
    }).catch(() => { /* The final pass reports errors and uses the full recording. */ })
      .finally(() => { live.pending = undefined; });
  });

  const finish = useCallback(async (uri: string | null, failed = false) => {
    const active = attempt.current;
    if (!active || active.phase === 'canceling') {
      discardVoice(uri);
      return;
    }
    if (active.phase !== 'recording' && active.phase !== 'stopping') return;
    clearTimeout(active.timer);
    active.phase = 'transcribing';
    setPhase('transcribing');
    try {
      await resetAudioMode();
      if (failed || (!active.live && !uri)) throw new Error('Chưa thu được âm thanh. Bạn thử lại nhé.');
      const live = active.live;
      if (live && (!live.rate || live.voiced < live.rate * 0.25)) {
        throw new Error('Chưa nhận được giọng nói. Hãy kiểm tra micro rồi thử lại.');
      }
      await live?.pending;
      if (active.controller.signal.aborted) return;
      let text: string;
      if (!live) {
        text = (await transcribeVoice(uri!, active.controller.signal)).text;
      } else if (live.lastText && live.lastTextEnd >= live.lastVoice) {
        // Extra silence after the last recognized sample does not need another request.
        text = live.lastText;
      } else {
        text = (await transcribeSpeech(live, speechEnd(live), active.controller.signal)).text;
      }
      if (active.controller.signal.aborted) return;
      active.phase = 'refining';
      setPhase('refining');
      setPreview(text);
      let corrected = false;
      const original = text;
      try {
        const result = await refineVoiceText(text, active.controller.signal);
        text = result.text;
        corrected = result.corrected;
      } catch { /* Keep the completed transcript if refinement is unavailable. */ }
      if (attempt.current === active && !active.controller.signal.aborted) {
        receive.current(text);
        setRefinement(corrected ? { text, original, showOriginal: false } : null);
        setNotice(corrected ? 'Đã hiệu chỉnh từ nghe nhầm. Bạn kiểm tra trước khi gửi nhé.'
          : 'Bạn có thể kiểm tra và sửa nội dung trước khi gửi.');
      }
    } catch (cause) {
      if (!active.controller.signal.aborted) {
        setNotice(cause instanceof Error ? cause.message : 'Chưa chuyển được giọng nói thành chữ.');
      }
    } finally {
      discardVoice(uri ?? active.uri);
      if (attempt.current === active) {
        attempt.current = null;
        setPhase(null);
        setPreview('');
      }
    }
  }, [resetAudioMode]);

  const recorder = useAudioRecorder(RECORDING_OPTIONS, event => {
    if (event.isFinished) void finish(event.url, event.hasError);
  });

  useEffect(() => {
    if (stream || phase !== 'recording') return;
    const timer = setInterval(() => {
      const { metering } = recorder.getStatus();
      setLevel(Math.max(0, Math.min(1, ((metering ?? -100) + 54) / 42)));
    }, 100);
    return () => clearInterval(timer);
  }, [phase, recorder, stream]);

  const cancelRecording = useCallback(async () => {
    const active = attempt.current;
    if (!active || active.phase === 'canceling') return;
    active.controller.abort();
    clearTimeout(active.timer);
    if (active.phase === 'starting' || active.phase === 'stopping' || active.phase === 'transcribing' || active.phase === 'refining') return;
    active.phase = 'canceling';
    setPhase('canceling');
    try { if (active.live) stream.stop(); else await recorder.stop(); } catch { /* Capture may already have stopped. */ }
    discardVoice(active.uri);
    await resetAudioMode();
    if (attempt.current === active) {
      attempt.current = null;
      setPhase(null);
      setPreview('');
    }
  }, [recorder, resetAudioMode, stream]);

  useFocusEffect(useCallback(() => () => {
    void cancelRecording();
    void stopSpeaking();
  }, [customerId, cancelRecording, stopSpeaking]));

  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state === 'background') {
        // The system permission dialog can briefly put the app in the background.
        if (!attempt.current?.requestingPermission) void cancelRecording();
        void stopSpeaking();
      }
    });
    return () => listener.remove();
  }, [cancelRecording, stopSpeaking]);

  async function startRecording() {
    if (!customerId || attempt.current) return;
    const active: Attempt = { phase: 'starting', controller: new AbortController(), uri: null, requestingPermission: false };
    attempt.current = active;
    setPhase('starting');
    setNotice('');
    setRefinement(null);
    setPreview('');
    setLevel(0);
    Keyboard.dismiss();
    let prepared = false;
    try {
      await stopSpeaking();
      if (active.controller.signal.aborted) return;
      active.requestingPermission = true;
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      active.requestingPermission = false;
      if (active.controller.signal.aborted) return;
      if (!permission.granted) {
        setNotice('Bạn có thể bật quyền micro trong cài đặt hoặc nhập bằng bàn phím.');
        return;
      }
      if (AppState.currentState === 'background') {
        setNotice('Đã cấp quyền micro. Bấm nút micro để bắt đầu thu âm.');
        return;
      }
      if (Platform.OS === 'ios') await setAudioModeAsync({ allowsRecording: true });
      if (stream) {
        active.live = {
          chunks: [], rate: 0, samples: 0, voiced: 0, firstVoice: null, lastVoice: 0,
          lastPreview: 0, previewVoiced: 0, lastMeter: 0, lastText: '', lastTextEnd: 0,
        };
        await stream.start();
        prepared = true;
        if (active.controller.signal.aborted) return;
        active.phase = 'recording';
        setPhase('recording');
        active.timer = setTimeout(() => { void stopRecording(); }, 30000);
        return;
      }
      await recorder.prepareToRecordAsync();
      prepared = true;
      // Keep the native file path before unmount releases the recorder.
      if (Platform.OS !== 'web') active.uri = recorder.uri;
      if (active.controller.signal.aborted) return;
      recorder.record({ forDuration: 30 });
      active.phase = 'recording';
      setPhase('recording');
    } catch {
      if (!active.controller.signal.aborted) {
        setNotice('Micro chưa sẵn sàng. Bạn vẫn có thể nhập tin nhắn.');
      }
    } finally {
      if (active.phase === 'starting') {
        active.phase = 'canceling';
        if (prepared) {
          try { if (active.live) stream.stop(); else await recorder.stop(); } catch { /* Capture did not start. */ }
          discardVoice(active.uri);
        }
        await resetAudioMode();
        if (attempt.current === active) {
          attempt.current = null;
          setPhase(null);
        }
      }
    }
  }

  async function stopRecording() {
    const active = attempt.current;
    if (active?.phase !== 'recording') return;
    active.phase = 'stopping';
    setPhase('stopping');
    try {
      if (active.live) {
        stream.stop();
        void finish(null);
        return;
      }
      await recorder.stop();
      if (attempt.current === active) void finish(recorder.uri);
    } catch {
      if (attempt.current === active) void finish(null, true);
    }
  }

  async function toggleSpeaking(id: string, content: string) {
    if (attempt.current) return;
    if (playback.current.id === id) { await stopSpeaking(); return; }
    const hadSpeech = playback.current.id !== null;
    const version = playback.current.version + 1;
    playback.current = { version, id };
    setSpeakingId(id);
    setNotice('');
    const ended = () => { if (playback.current.version === version) void stopSpeaking(); };
    const failed = (message: string) => {
      if (playback.current.version === version) { setNotice(message); ended(); }
    };
    try {
      if (hadSpeech) await Speech.stop();
      const voices = await Speech.getAvailableVoicesAsync();
      if (playback.current.version !== version) return;
      const vietnameseVoices = voices.filter(item => /^vi(?:[-_]|$)/i.test(item.language));
      const voice = vietnameseVoices.find(item => /-local$/i.test(item.identifier)) ?? vietnameseVoices[0];
      if (!voice) { failed('Thiết bị chưa có giọng đọc tiếng Việt. Bạn có thể bật giọng tiếng Việt trong cài đặt.'); return; }
      const cleaned = content.replace(/\*\*|^\s*#{1,6}\s+/gm, '').replace(/\s+/g, ' ').trim();
      const chunks = cleaned.match(/.{1,1500}(?:\s|$)|.{1,1500}/gu) ?? [];
      const speakNext = (index: number) => {
        if (playback.current.version !== version) return;
        if (index === chunks.length) { ended(); return; }
        try {
          // Android's speech module passes this value to Locale.Builder.setLanguage.
          Speech.speak(chunks[index], { language: Platform.OS === 'android' ? 'vi' : 'vi-VN', voice: voice.identifier, volume: 1,
            onDone: () => speakNext(index + 1), onStopped: ended,
            onError: () => failed('Chưa phát được giọng đọc. Bạn thử lại nhé.'),
          });
        } catch { failed('Chưa phát được giọng đọc. Bạn thử lại nhé.'); }
      };
      speakNext(0);
    } catch { failed('Chưa phát được giọng đọc. Bạn thử lại nhé.'); }
  }

  return { phase, busy: phase !== null, isBusy: () => attempt.current !== null,
    notice, preview, level, clearNotice: () => { setNotice(''); setRefinement(null); }, startRecording, stopRecording, cancelRecording,
    canCompare: refinement !== null, showingOriginal: refinement?.showOriginal ?? false,
    toggleOriginal: () => {
      if (!refinement || attempt.current) return;
      const showOriginal = !refinement.showOriginal;
      receive.current(showOriginal ? refinement.original : refinement.text);
      setRefinement({ ...refinement, showOriginal });
    },
    speakingId, toggleSpeaking, stopSpeaking };
}
