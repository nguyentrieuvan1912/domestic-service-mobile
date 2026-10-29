import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url), ts = require('typescript');
const originalResolve = Module._resolveFilename, originalLoad = Module._load;
Module._resolveFilename = function(specifier, parent, ...args) {
  if (specifier.startsWith('@/')) { const base = resolve('src', specifier.slice(2)); specifier = existsSync(base + '.ts') ? base + '.ts' : base + '.tsx'; }
  return originalResolve.call(this, specifier, parent, ...args);
};
Module._load = function(specifier, parent, main) {
  if (specifier === 'react-native') return { Platform: { OS: 'web' } };
  return originalLoad.call(this, specifier, parent, main);
};
Module._extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const ops = require('../src/api/operations.ts');
const { StaffRepository: repo, StaffCapabilityRepository: capabilities, StaffMatchingRepository: matching } = require('../src/data/connectedStaffRepository.ts');
const profile = { id: 71003, role: 'STAFF', fullName: 'Staff' };
const actor = { userId: '71003', staffId: '71003' };
const saved = { saved: { days: [], areaIds: [], matchNotifications: true, revision: 4, updatedAt: '2026-10-29T00:00:00Z' }, bookings: [], unknownBookingCodes: [] };
const wallet = { balance: { available: 0, pending: 0, totalEarned: 0, withdrawn: 0 }, incomes: [], transactions: [], withdrawals: [] };
let release, gate, requests = [], scheduleReads = 0;
global.fetch = async (url, options = {}) => {
  requests.push(options.signal);
  if (url.includes('/administrative-units/')) return Response.json({ items: [] });
  if (url.endsWith('/availability')) {
    scheduleReads++;
    await gate;
    if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    return Response.json(saved);
  }
  if (url.endsWith('/capabilities')) return Response.json({ capabilities: [], restrictions: [] });
  if (url.endsWith('/matching')) return Response.json({ items: [] });
  if (url.endsWith('/wallet')) return Response.json(wallet);
  return Response.json([]);
};
ops.connectOperationsSession(profile, 'schedule-session');
gate = new Promise(resolve => release = resolve);
const first = new AbortController();
const oldScreen = repo.loadSchedule(first.signal);
const currentScreen = repo.loadSchedule(new AbortController().signal);
first.abort(); release();
await Promise.all([oldScreen, currentScreen]);
assert.equal(scheduleReads, 1, 'Concurrent screens share one read');
assert.equal(repo.getScheduleLoadState().loaded, true, 'Leaving the first screen must not cancel the other screen’s schedule read');
assert.equal(repo.getScheduleSnapshot(actor.staffId).saved.revision, 4);
assert(requests.every(signal => !signal?.aborted));
// Profile/avatar refreshes notify consumers but must preserve the loaded schedule.
ops.connectOperationsSession({ ...profile, avatar: 'https://res.cloudinary.com/example/image/upload/photo.png' }, 'schedule-session');
assert.equal(repo.getScheduleLoadState().loaded, true);
// A renewed token for the same staff must clear data from the preceding session.
ops.connectOperationsSession(profile, 'renewed-session');
assert.equal(repo.getScheduleLoadState().loaded, false);
// Initial capability/matching reads also share work after the first screen unmounts.
gate = new Promise(resolve => release = resolve);
const oldController = new AbortController();
const oldProfile = capabilities.load(actor, oldController.signal);
await new Promise(resolve => setImmediate(resolve));
const dashboard = matching.load(actor, new AbortController().signal);
oldController.abort(); release();
await Promise.all([oldProfile, dashboard]);
assert.equal(repo.getLoadState().loaded, true, 'Shared staff information must finish after the first consumer leaves');
assert.equal(repo.getScheduleLoadState().loaded, true);
assert(requests.every(signal => !signal?.aborted));
// Existing cancellation and session isolation protections remain in place.
const cancelled = new AbortController(); cancelled.abort();
await assert.rejects(repo.loadSchedule(cancelled.signal), /Đã hủy/);
await assert.rejects(repo.load(cancelled.signal), /Đã hủy/);
ops.connectOperationsSession({ id: 71004, role: 'STAFF' }, 'different-staff');
assert.equal(repo.getLoadState().loaded, false);
assert.equal(repo.getScheduleLoadState().loaded, false);
console.log('Staff loading lifecycle: shared schedule/profile loads survive consumer cancellation, same-session avatar refresh preserves data, renewed sessions reset data, pre-cancelled loads reject and account isolation passes.');
