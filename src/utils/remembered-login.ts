import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const legacySessionKey = 'cleanmaster_identity_session';
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
