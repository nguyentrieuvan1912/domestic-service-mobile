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
    deleteItemAsync: async key => {
      if (key === failKey) throw new Error('Secure storage unavailable');
      secure.delete(key);
    },
  };
  return originalLoad.call(this, specifier, ...args);
};
Module._extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const { clearLegacyLoginStorage } = require('../src/utils/remembered-login.ts');

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

platform.OS = 'web';
seed(browser);
tab.set(keys[0], 'legacy-bearer');
await clearLegacyLoginStorage();
assert.equal(browser.size, 0);
assert.equal(tab.size, 0);
console.log('Legacy login storage: account, password, role and bearer cleanup passed for native and browser storage.');
