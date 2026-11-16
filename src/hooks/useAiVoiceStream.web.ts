import { useEffect, useMemo, useRef } from 'react';
import type { AudioStreamBuffer } from 'expo-audio';

const PROCESSOR = `
class CleanMasterVoiceInput extends AudioWorkletProcessor {
  pcm = new Int16Array(2048);
  offset = 0;

  process(inputs) {
    for (const sample of inputs[0]?.[0] ?? []) {
      this.pcm[this.offset++] = Math.round(Math.max(-1, Math.min(1, sample)) * 32767);
      if (this.offset === this.pcm.length) {
        this.port.postMessage(this.pcm.buffer, [this.pcm.buffer]);
        this.pcm = new Int16Array(2048);
        this.offset = 0;
      }
    }
    return true;
  }
}
registerProcessor('cleanmaster-voice-input', CleanMasterVoiceInput);
`;

export function useAiVoiceStream(onBuffer: (buffer: AudioStreamBuffer) => void) {
  const receive = useRef(onBuffer);
  useEffect(() => { receive.current = onBuffer; }, [onBuffer]);

  const stream = useMemo(() => {
    if (typeof AudioContext === 'undefined' || typeof AudioWorkletNode === 'undefined') return null;
    let active: { context: AudioContext; mic?: MediaStream; node?: AudioWorkletNode } | null = null;
    const stop = () => {
      const capture = active;
      active = null;
      if (!capture) return;
      if (capture.node) {
        capture.node.port.onmessage = null;
        capture.node.disconnect();
      }
      capture.mic?.getTracks().forEach(track => track.stop());
      void capture.context.close().catch(() => {});
    };
    return {
      stop,
      async start() {
        const capture: NonNullable<typeof active> = { context: new AudioContext() };
        active = capture;
        const { context } = capture;
        const moduleUrl = URL.createObjectURL(new Blob([PROCESSOR], { type: 'application/javascript' }));
        try {
          const mic = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
          if (active !== capture) { mic.getTracks().forEach(track => track.stop()); return; }
          capture.mic = mic;
          await context.audioWorklet.addModule(moduleUrl);
          if (active !== capture) return;
          const node = new AudioWorkletNode(context, 'cleanmaster-voice-input');
          capture.node = node;
          node.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
            if (active === capture) receive.current({ data: event.data, sampleRate: context.sampleRate, channels: 1, timestamp: context.currentTime });
          };
          // The processor only reads its input and outputs silence.
          context.createMediaStreamSource(mic).connect(node);
          node.connect(context.destination);
          await context.resume();
        } catch (error) {
          if (active === capture) stop();
          throw error;
        } finally {
          URL.revokeObjectURL(moduleUrl);
        }
      },
    };
  }, []);

  useEffect(() => () => stream?.stop(), [stream]);
  return stream;
}
