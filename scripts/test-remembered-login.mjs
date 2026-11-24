import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url), ts = require('typescript');
const platform = { OS: 'android' };
const secure = new Map(), browser = new Map(), tab = new Map();
const keys = [
  'cleanmaster_identity_session',
  'cleanmaster_remembered_login_role',
  'cleanmaster_remembered_login_CUSTOMER',
  'cleanmaster_remembered_login_STAFF',
];
const seed = map => keys.forEach(key => map.set(key, 'legacy-credential'));
global.localStorage = { removeItem: key => browser.delete(key) };
global.sessionStorage = { removeItem: key => tab.delete(key) };
let failKey;
const originalLoad = Module._load;
Module._load = function (specifier, ...args) {
  if (specifier === 'react-native') return { Platform: platform };
  if (specifier === 'expo-secure-store') return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only',
    getItemAsync: async key => secure.get(key) ?? null,
    setItemAsync: async (key, value, options) => {
      assert.equal(options.keychainAccessible, 'device-only');
      secure.set(key, value);
    },
    deleteItemAsync: async key => {
      if (key === failKey) throw new Error('Secure storage unavailable');
      secure.delete(key);
    },
  };
  return originalLoad.call(this, specifier, ...args);
};
Module._extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const storageModule = require.resolve('../src/utils/remembered-login.ts');
const { clearLegacyLoginStorage, readRememberedSession, storeRememberedSession } = require(storageModule);

seed(secure);
await clearLegacyLoginStorage();
assert.equal(secure.size, 0);
seed(secure);
failKey = keys[2];
await clearLegacyLoginStorage();
assert.deepEqual([...secure.keys()], [failKey], 'A failed deletion must not block cleanup of the other keys');
failKey = undefined;
await clearLegacyLoginStorage();
assert.equal(secure.size, 0);

const session = { accessToken: 'test-session-token', expiresAt: new Date(Date.now() + 60000).toISOString() };
await storeRememberedSession({ ...session, user: { email: 'test@example.com' }, password: 'not-for-storage' });
const [rememberedKey] = secure.keys();
assert.deepEqual(JSON.parse(secure.get(rememberedKey)), session);
await clearLegacyLoginStorage();
assert.deepEqual(await readRememberedSession(), session, 'Startup removes legacy credentials while preserving the opted-in session');
await Promise.all([storeRememberedSession(null), storeRememberedSession(session)]);
assert.deepEqual(await readRememberedSession(), session, 'Logout followed by a new login preserves the latest write');
await storeRememberedSession(null);
assert.equal(await readRememberedSession(), null);
await storeRememberedSession({ ...session, expiresAt: new Date(0).toISOString() });
assert.equal(await readRememberedSession(), null);
assert.equal(secure.size, 0, 'Expired sessions must be removed');
secure.set(rememberedKey, '{');
assert.equal(await readRememberedSession(), null);
assert.equal(secure.size, 0, 'Malformed sessions must be removed');

platform.OS = 'web';
delete require.cache[storageModule];
const webStorage = require(storageModule);
seed(browser);
tab.set(keys[0], 'legacy-bearer');
await webStorage.clearLegacyLoginStorage();
await webStorage.storeRememberedSession(session);
assert.equal(await webStorage.readRememberedSession(), null);
assert.equal(secure.size, 0);
assert.equal(browser.size, 0);
assert.equal(tab.size, 0);
console.log('Remembered login: opted-in token only, legacy cleanup, ordered writes, expiry, logout, malformed data, and no web persistence passed.');
