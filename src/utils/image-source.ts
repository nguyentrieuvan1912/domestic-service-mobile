import type { ImageURISource } from 'react-native';

/** Missing API images keep their layout without requesting an empty native URI. */
export function remoteImageSource(uri: string | null | undefined): ImageURISource | undefined {
  const value = uri?.trim();
  return value ? { uri: value } : undefined;
}
