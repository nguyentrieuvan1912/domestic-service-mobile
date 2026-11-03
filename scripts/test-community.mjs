import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url), ts = require('typescript');
const originalResolve = Module._resolveFilename, originalLoad = Module._load;
Module._resolveFilename = function (specifier, parent, ...args) { if (specifier.startsWith('@/')) { const base = resolve('src', specifier.slice(2)); specifier = existsSync(base + '.ts') ? base + '.ts' : base + '.tsx'; } return originalResolve.call(this, specifier, parent, ...args); };
Module._load = function (specifier, parent, main) { if (specifier === 'react-native') return { Platform: { OS: 'web' } }; return originalLoad.call(this, specifier, parent, main); };
Module._extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const { validateAttachment, mergeComments, uploadAttachment, applyCommentDeletions } = require('../src/api/community.ts');
const operations = require('../src/api/operations.ts');
validateAttachment({ type: 'image', fileSize: 100 });
assert.throws(() => validateAttachment({ type: 'image', fileSize: 11 * 1024 * 1024 }), /10 MB/);
assert.throws(() => validateAttachment({ type: 'video', fileSize: 51 * 1024 * 1024 }), /50 MB/);
assert.throws(() => validateAttachment({ type: 'video', duration: 121000 }), /2 phút/);
assert.throws(() => validateAttachment({ type: 'audio' }), /Chỉ hỗ trợ/);
assert.deepEqual(mergeComments([{ id: 1, content: 'A' }, { id: 2, content: 'B' }], [{ id: 2, content: 'Updated' }, { id: 3, parentId: 1 }]), [{ id: 1, content: 'A' }, { id: 2, content: 'Updated' }, { id: 3, parentId: 1 }]);
const removed = applyCommentDeletions([{ id: 10, content: 'Removed spam', media: [{ uri: 'https://res.cloudinary.com/private.jpg' }], myReaction: 'LIKE', reactions: { LIKE: 1 } }, { id: 11, content: 'Legitimate reply', parentId: 10, parentContent: 'Removed spam' }], [10]);
assert.equal(removed[0].deleted, true);
assert.deepEqual(removed[0].media, []);
assert.deepEqual(removed[0].reactions, {});
assert.equal(removed[0].myReaction, null);
assert(!JSON.stringify(removed).includes('Removed spam'), 'Incremental polling must scrub both old comments and their reply quotes');
assert.equal(removed[1].content, 'Legitimate reply');
operations.connectOperationsSession({ id: 9001, role: 'STAFF' }, 'community-test-session');
const ticket = { id: 42, apiKey: 'public-key', signature: 'signed', uploadUrl: 'https://api.cloudinary.com/v1_1/test/image/upload', params: { public_id: 'scoped-id', timestamp: '123', overwrite: 'false' } };
let uploadedForm, completeCalls = 0, lost = false;
global.XMLHttpRequest = class {
  upload = {}; status = 200;
  open(method, url) { assert.equal(method, 'POST'); assert.equal(url, ticket.uploadUrl); }
  send(form) { uploadedForm = form; queueMicrotask(() => { if (lost) this.onerror(); else this.onload(); }); }
  abort() { this.onabort(); }
};
global.fetch = async (url, init) => { assert.match(url, /community\/media\/42\/complete$/); assert.equal(init.method, 'POST'); completeCalls++; return Response.json({ id: 42, uri: 'https://res.cloudinary.com/test/image/upload/scoped-id.jpg', type: 'image' }); };
const controller = new AbortController(), asset = { type: 'image', uri: 'file:///private-local.jpg', fileSize: 100, file: new File(['real-upload-bytes-fixture'], 'test.jpg', { type: 'image/jpeg' }) };
const saved = await uploadAttachment(asset, ticket, () => {}, controller.signal);
assert(saved.uri.startsWith('https://res.cloudinary.com/'));
assert.equal(uploadedForm.get('public_id'), 'scoped-id');
assert.equal(uploadedForm.get('api_secret'), null, 'Secret must never enter client upload form');
assert.equal(completeCalls, 1);
lost = true;
assert.equal((await uploadAttachment(asset, ticket, () => {}, controller.signal)).id, 42, 'Lost upload response is accepted only through verified backend metadata');
global.fetch = async () => Response.json({ detail: 'Asset not verified' }, { status: 400 });
await assert.rejects(uploadAttachment(asset, ticket, () => {}, controller.signal), /gián đoạn/);
await assert.rejects(uploadAttachment(asset, { ...ticket, uploadUrl: 'https://attacker.invalid/upload' }, () => {}, controller.signal), /không hợp lệ/);
console.log('Community: media limits, server confirmation, interrupted-upload recovery, secret exclusion, provider host and threaded comment deduplication passed.');

const { createCommunityPost } = require('../src/api/community.ts');
const draft = { content: 'Kept draft', mediaIds: [], requestKey: 'stable-post-key' };
let writes = 0, confirmations = 0;
global.fetch = async (url, init) => {
  if (init.method === 'POST') { writes++; return new Response('', { status: 201 }); }
  confirmations++; assert(url.endsWith('/community/posts/requests/stable-post-key'));
  return Response.json({ id: 73, status: 'PENDING' });
};
assert.deepEqual(await createCommunityPost(draft), { id: 73, status: 'PENDING' });
assert.equal(writes, 1, 'A lost POST response must never replay the write');
assert.equal(confirmations, 1, 'Only a persisted, scoped lookup confirms success');
// Missing persisted confirmation must retain the original failure and the caller’s draft.
global.fetch = async (_url, init) => init.method === 'POST' ? new Response('', { status: 201 }) : Response.json({ detail: 'Not persisted' }, { status: 404 });
await assert.rejects(createCommunityPost(draft), /Phản hồi từ máy chủ/);
assert.equal(draft.content, 'Kept draft');
let businessCalls = 0;
global.fetch = async () => { businessCalls++; return Response.json({ detail: 'Invalid content' }, { status: 400 }); };
await assert.rejects(createCommunityPost(draft), /Invalid content/);assert.equal(businessCalls, 1);
// Valid JSON without an ID/status is also insufficient proof of a successful save.
global.fetch = async (_url, init) => init.method === 'POST' ? Response.json({}) : Response.json({ id: 74, status: 'PENDING' });
assert.equal((await createCommunityPost(draft)).id, 74);
let reads = 0;
global.fetch = async () => ++reads === 1 ? new Response('{', { status: 200 }) : Response.json([]);
assert.deepEqual(await operations.operationRequest('identity', '/community/posts'), []);
assert.equal(reads, 2, 'Malformed reads retry once; mutations are never replayed');
console.log('Community publishing: empty/truncated JSON recovery, persisted-ID confirmation, missing-save rejection, retained draft, no duplicate POST, business-error preservation and bounded read retry passed.');
