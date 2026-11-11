import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { operationRequest } from './operations';

export function refineVoiceText(text: string, signal: AbortSignal) {
  return operationRequest<{ text: string; originalText: string; corrected: boolean }>(
    'ai-assistant', '/voice/refinements', 'POST', { text }, signal);
}

export async function transcribeVoice(uri: string, signal: AbortSignal) {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const audio = await fetch(uri, { signal }).then(response => response.blob());
    form.append('audio', audio, 'recording.webm');
  } else {
    const audio = new File(uri);
    if (!audio.exists) throw new Error('Không tìm thấy bản thu âm. Bạn thử thu lại nhé.');
    form.append('audio', audio);
  }
  return operationRequest<{ text: string }>('ai-assistant', '/voice/transcriptions', 'POST', form, signal);
}

export async function transcribePcm(chunks: readonly Int16Array[], sampleRate: number, signal: AbortSignal) {
  const samples = chunks.reduce((size, chunk) => size + chunk.length, 0);
  const stride = Math.max(1, Math.ceil(sampleRate / 16000));
  const outputRate = Math.round(sampleRate / stride);
  const dataSize = Math.floor(samples / stride) * 2;
  const wav = new Uint8Array(44 + dataSize);
  const header = new DataView(wav.buffer);
  wav.set([82, 73, 70, 70], 0); // RIFF
  header.setUint32(4, 36 + dataSize, true);
  wav.set([87, 65, 86, 69, 102, 109, 116, 32], 8); // WAVEfmt
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true);
  header.setUint16(22, 1, true);
  header.setUint32(24, outputRate, true);
  header.setUint32(28, outputRate * 2, true);
  header.setUint16(32, 2, true);
  header.setUint16(34, 16, true);
  wav.set([100, 97, 116, 97], 36); // data
  header.setUint32(40, dataSize, true);
  let offset = 44;
  let total = 0;
  let count = 0;
  for (const chunk of chunks) {
    for (const sample of chunk) {
      total += sample;
      count++;
      if (count === stride) {
        header.setInt16(offset, Math.round(total / stride), true);
        offset += 2;
        total = 0;
        count = 0;
      }
    }
  }
  if (Platform.OS === 'web') {
    const form = new FormData();
    form.append('audio', new Blob([wav.buffer], { type: 'audio/wav' }), 'recording.wav');
    return operationRequest<{ text: string }>('ai-assistant', '/voice/transcriptions', 'POST', form, signal);
  }
  const file = new File(Paths.cache, `ai-voice-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`);
  try {
    file.create();
    file.write(wav);
    return await transcribeVoice(file.uri, signal);
  } finally {
    discardVoice(file.uri);
  }
}

export function discardVoice(uri: string | null) {
  if (!uri) return;
  if (Platform.OS === 'web') {
    if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
  } else {
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // Recording files are in the application's temporary cache.
    }
  }
}
