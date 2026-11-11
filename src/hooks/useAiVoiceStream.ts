import { useAudioStream, type AudioStreamBuffer } from 'expo-audio';

export function useAiVoiceStream(onBuffer: (buffer: AudioStreamBuffer) => void) {
  return useAudioStream({ sampleRate: 16000, channels: 1, encoding: 'int16', onBuffer }).stream;
}
