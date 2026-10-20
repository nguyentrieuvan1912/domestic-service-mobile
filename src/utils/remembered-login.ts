import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type LoginRole = 'CUSTOMER' | 'STAFF';
export type RememberedLogin = { role: LoginRole; identifier: string; password: string; remember: boolean };
const lastRoleKey = 'cleanmaster_remembered_login_role';
const loginKey = (role: LoginRole) => `cleanmaster_remembered_login_${role}`;
const legacySessionKey = 'cleanmaster_identity_session';

async function read(key: string): Promise<string | null> {
  return Platform.OS === 'web' ? localStorage.getItem(key) : SecureStore.getItemAsync(key);
}
async function write(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') localStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}
async function remove(key: string): Promise<void> {
  if (Platform.OS === 'web') localStorage.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
}

/** Old remembered bearer sessions must never sign in a new app launch automatically. */
export async function clearPersistedSession(): Promise<void> {
  if (Platform.OS === 'web') {
    sessionStorage.removeItem(legacySessionKey);
    localStorage.removeItem(legacySessionKey);
  } else await SecureStore.deleteItemAsync(legacySessionKey);
}

export async function loadRememberedLogin(requestedRole?: LoginRole): Promise<RememberedLogin> {
  const lastRole = requestedRole || await read(lastRoleKey);
  const role: LoginRole = lastRole === 'STAFF' ? 'STAFF' : 'CUSTOMER';
  const empty: RememberedLogin = { role, identifier: '', password: '', remember: false };
  const raw = await read(loginKey(role));
  if (!raw) return empty;
  try {
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return empty;
    const record = saved as Record<string, unknown>;
    if (record.role !== role || typeof record.identifier !== 'string' || !record.identifier.trim()) return empty;
    return {
      role, identifier: record.identifier.trim(), remember: true,
      // Browser password managers handle web passwords; never persist them in localStorage.
      password: Platform.OS !== 'web' && typeof record.password === 'string' ? record.password : '',
    };
  } catch { return empty; }
}

export async function clearRememberedLogin(role: LoginRole): Promise<void> {
  await remove(loginKey(role));
  if (await read(lastRoleKey) === role) await remove(lastRoleKey);
}

/** Only call after backend authentication/profile validation has succeeded. */
export async function saveRememberedLogin(identifier: string, password: string, role: LoginRole, remember: boolean): Promise<void> {
  if (!remember) { await clearRememberedLogin(role); return; }
  const saved = Platform.OS === 'web' ? { role, identifier: identifier.trim() } : { role, identifier: identifier.trim(), password };
  await write(loginKey(role), JSON.stringify(saved));
  await write(lastRoleKey, role);
}
