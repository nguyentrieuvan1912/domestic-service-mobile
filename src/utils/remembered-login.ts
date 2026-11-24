import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const legacySessionKey = 'cleanmaster_identity_session';
const rememberedSessionKey = 'cleanmaster_remembered_session_v1';
const storageOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

type RememberedSession = { accessToken: string; expiresAt: string };

export const supportsRememberedLogin = Platform.OS === 'android' || Platform.OS === 'ios';

let pendingWrite = Promise.resolve();

export function storeRememberedSession(session: RememberedSession | null): Promise<void> {
  if (!supportsRememberedLogin) return Promise.resolve();
  const write = pendingWrite.then(() => session
    ? SecureStore.setItemAsync(rememberedSessionKey, JSON.stringify({ accessToken: session.accessToken, expiresAt: session.expiresAt }), storageOptions)
    : SecureStore.deleteItemAsync(rememberedSessionKey, storageOptions));
  pendingWrite = write.catch(() => {});
  return write;
}

export async function readRememberedSession(): Promise<RememberedSession | null> {
  if (!supportsRememberedLogin) return null;
  await pendingWrite;
  const saved = await SecureStore.getItemAsync(rememberedSessionKey, storageOptions);
  if (saved === null) return null;
  let session: Partial<RememberedSession> | null = null;
  try { session = JSON.parse(saved); } catch { /* Remove obsolete or corrupted local data. */ }
  if (typeof session?.accessToken === 'string' && session.accessToken
    && typeof session.expiresAt === 'string' && Date.parse(session.expiresAt) > Date.now()) {
    return { accessToken: session.accessToken, expiresAt: session.expiresAt };
  }
  await storeRememberedSession(null);
  return null;
}

const legacyLoginKeys = [
  legacySessionKey,
  'cleanmaster_remembered_login_role',
  'cleanmaster_remembered_login_CUSTOMER',
  'cleanmaster_remembered_login_STAFF',
];

export async function clearLegacyLoginStorage(): Promise<void> {
  const cleanup = legacyLoginKeys.map(async key => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  });
  if (Platform.OS === 'web') {
    cleanup.push(Promise.resolve().then(() => sessionStorage.removeItem(legacySessionKey)));
  }
  await Promise.allSettled(cleanup);
}
