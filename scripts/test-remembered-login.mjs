import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url), ts = require('typescript');
const platform = { OS: 'android' }, secure = new Map(), browser = new Map(), tab = new Map();
let failWrite = false;
const storage = map => ({ getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) });
global.localStorage = storage(browser); global.sessionStorage = storage(tab);
const originalLoad = Module._load;
Module._load = function (specifier, ...args) {
  if (specifier === 'react-native') return { Platform: platform };
  if (specifier === 'expo-secure-store') return {
    getItemAsync: async key => secure.get(key) ?? null,
    setItemAsync: async (key, value) => { if (failWrite) throw new Error('Secure storage unavailable'); secure.set(key, value); },
    deleteItemAsync: async key => { secure.delete(key); },
  };
  return originalLoad.call(this, specifier, ...args);
};
Module._extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const { loadRememberedLogin, saveRememberedLogin, clearRememberedLogin, clearPersistedSession } = require('../src/utils/remembered-login.ts');

assert.deepEqual(await loadRememberedLogin(), { role: 'CUSTOMER', identifier: '', password: '', remember: false });
await saveRememberedLogin(' customer@test.invalid ', 'native-customer-password', 'CUSTOMER', true);
await saveRememberedLogin('0900000000', 'native-staff-password', 'STAFF', true);
assert.deepEqual(await loadRememberedLogin(), { role: 'STAFF', identifier: '0900000000', password: 'native-staff-password', remember: true });
assert.equal((await loadRememberedLogin('CUSTOMER')).password, 'native-customer-password', 'Role switching must not overwrite another account');
assert.equal(browser.size, 0, 'Native credentials must go through SecureStore');
secure.set('cleanmaster_identity_session', 'old-bearer-session');
await clearPersistedSession();
assert.equal(secure.has('cleanmaster_identity_session'), false, 'A cold launch must discard the legacy automatic-login token');
assert.equal((await loadRememberedLogin()).remember, true, 'Removing a session must preserve explicitly remembered login details');
await clearRememberedLogin('STAFF');
assert.equal((await loadRememberedLogin('STAFF')).remember, false);
assert.equal((await loadRememberedLogin('CUSTOMER')).remember, true);
await saveRememberedLogin('customer@test.invalid', 'password', 'CUSTOMER', false);
assert.equal((await loadRememberedLogin('CUSTOMER')).identifier, '', 'Unchecked remember must remove saved details');
secure.set('cleanmaster_remembered_login_CUSTOMER', '{invalid');
assert.equal((await loadRememberedLogin('CUSTOMER')).remember, false);
secure.set('cleanmaster_remembered_login_CUSTOMER', JSON.stringify({ role: 'STAFF', identifier: 'different-role', password: 'private' }));
assert.equal((await loadRememberedLogin('CUSTOMER')).identifier, '', 'Stored details must match the selected role');
failWrite = true;
await assert.rejects(saveRememberedLogin('customer@test.invalid', 'password', 'CUSTOMER', true), /Secure storage unavailable/);
failWrite = false;

platform.OS = 'web';
await saveRememberedLogin('customer@test.invalid', 'must-not-be-in-browser-storage', 'CUSTOMER', true);
assert.deepEqual(await loadRememberedLogin(), { role: 'CUSTOMER', identifier: 'customer@test.invalid', password: '', remember: true });
assert.deepEqual(JSON.parse(browser.get('cleanmaster_remembered_login_CUSTOMER')), { role: 'CUSTOMER', identifier: 'customer@test.invalid' });
assert.ok(![...browser.values()].some(value => value.includes('must-not-be-in-browser-storage')));
tab.set('cleanmaster_identity_session', 'old-session'); browser.set('cleanmaster_identity_session', 'old-session');
await clearPersistedSession();
assert.equal(tab.size, 0); assert.equal(browser.has('cleanmaster_identity_session'), false);
assert.equal((await loadRememberedLogin()).remember, true);
await clearRememberedLogin('CUSTOMER');
assert.equal((await loadRememberedLogin()).remember, false);
console.log('Remembered login: cold-launch token removal, secure native storage, role isolation, opt-out, corrupt data, failed storage and no browser password persistence passed.');
