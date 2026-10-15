import type { ImageURISource } from 'react-native';
import { API_BASE_URL } from '@/api/catalog';

/** Missing API images keep their layout without requesting an empty native URI. */
export function remoteImageSource(uri: string | null | undefined): ImageURISource | undefined {
  const value = uri?.trim();
  return value ? { uri: value.startsWith('/') ? API_BASE_URL + value : value } : undefined;
}
