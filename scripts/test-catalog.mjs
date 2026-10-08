import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
Module._extensions['.ts'] = (module, filename) => {
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(compiled.outputText, filename);
};
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  return request === 'react-native' ? { Platform: { OS: 'android' } } : originalLoad.call(this, request, ...args);
};
process.env.EXPO_PUBLIC_API_BASE_URL = 'http://10.0.2.2:8080/';
const { catalogGet } = require('../src/api/catalog.ts');
const controller = new AbortController();
const payload = { service: { id: 2, name: 'Vệ sinh nhà theo giờ' } };
global.fetch = async (url, options) => {
  assert.equal(url, 'http://10.0.2.2:8080/api/v1/catalog/services/2');
  assert.equal(options.signal, controller.signal);
  return { ok: true, json: async () => payload };
};
assert.deepEqual(await catalogGet('/services/2', controller.signal), payload);

// Android may reject with a plain Error containing a Java exception.
for (const failure of [new Error('fetch failed: java.net.ConnectException: Failed to connect to /10.0.2.2:8080'), new TypeError('Network request failed')]) {
  global.fetch = async () => { throw failure; };
  await assert.rejects(catalogGet('/services/2', controller.signal), error => {
    assert.match(error.message, /Chưa kết nối được hệ thống dịch vụ/);
    assert.doesNotMatch(error.message, /java\.|10\.0\.2\.2|TypeError/);
    return true;
  });
}
for (const [status, expected] of [[404, /Không tìm thấy dịch vụ/], [400, /không hợp lệ/], [503, /Chưa tải được dịch vụ/]]) {
  global.fetch = async () => ({ ok: false, status });
  await assert.rejects(catalogGet('/services/2', controller.signal), expected);
}
const aborted = new AbortController();
const abortError = new Error('Aborted');
aborted.abort();
global.fetch = async () => { throw abortError; };
await assert.rejects(catalogGet('/services/2', aborted.signal), error => error === abortError);
global.fetch = async () => ({ ok: true, json: async () => payload });
assert.deepEqual(await catalogGet('/services/2', controller.signal), payload, 'Retry after a connection failure succeeds');
console.log('Catalog: Gateway URL, native network errors, HTTP states, cancellation and retry passed.');
