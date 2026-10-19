import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createRequire, Module } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url), ts = require('typescript');
const server = createServer((request, response) => {
  if (request.url.endsWith('/stalled-headers')) return;
  response.setHeader('Content-Type', 'application/json');
  if (request.url.endsWith('/stalled-body')) { response.writeHead(200); response.write('{'); return; }
  if (request.url.endsWith('/denied')) { response.writeHead(401); response.end(JSON.stringify({ detail: 'Thông tin đăng nhập không đúng.' })); return; }
  response.end(JSON.stringify({ reachable: true }));
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;
const originalLoad = Module._load;
Module._load = function (specifier, ...args) {
  if (specifier === 'react-native') return { Platform: { OS: 'android' } };
  return originalLoad.call(this, specifier, ...args);
};
Module._extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, file);
try {
  process.env.EXPO_PUBLIC_API_BASE_URL = base;
  const { catalogGet } = require('../src/api/catalog.ts');
  const identityRequest = path => catalogGet(path, new AbortController().signal);
  assert.deepEqual(await identityRequest('/reachable'), { reachable: true });
  await assert.rejects(identityRequest('/denied'), /Chưa tải được dịch vụ/);
  const start = Date.now();
  await Promise.all(['/stalled-headers', '/stalled-body'].map(path =>
    assert.rejects(identityRequest(path), /Tải dịch vụ quá lâu/)));
  assert.ok(Date.now() - start >= 14000 && Date.now() - start < 20000, 'Both response headers and body must respect the request deadline');
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(catalogGet('/reachable', controller.signal));
  console.log('Catalog transport: real HTTP success, server errors, stalled headers/body deadline and caller cancellation passed.');
} finally {
  Module._load = originalLoad;
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}

