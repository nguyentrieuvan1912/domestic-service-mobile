import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url), ts = require('typescript');
const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
const originalResolve = Module._resolveFilename, originalLoad = Module._load;
let profile = { id: 71003, role: 'STAFF' }, pathname = '/staff';
Module._resolveFilename = function(specifier, parent, ...args) {
  if (specifier.startsWith('@/')) { const base = resolve('src', specifier.slice(2)); specifier = existsSync(base + '.ts') ? base + '.ts' : base + '.tsx'; }
  return originalResolve.call(this, specifier, parent, ...args);
};
Module._load = function(specifier, parent, main) {
  if (specifier === 'react-native') return { Platform: { OS: 'web', select: x => x.web ?? x.default }, StyleSheet: { create: x => x }, Modal: ({ visible, children }) => visible ? React.createElement('section', null, children) : null, View: 'div', Text: 'span', Pressable: ({ accessibilityRole, children, ...props }) => React.createElement('button', { ...props, role: accessibilityRole }, children) };
  if (specifier === 'expo-router') return { usePathname: () => pathname, useRouter: () => ({ push() {} }) };
  if (specifier === '@/context/AuthContext') return { useAuth: () => ({ currentUser: profile && { ...profile, id: String(profile.id) }, currentStaff: profile?.role === 'STAFF' ? { id: String(profile.id), userId: String(profile.id) } : null }) };
  return originalLoad.call(this, specifier, parent, main);
};
for (const ext of ['.ts', '.tsx']) Module._extensions[ext] = (module, file) => module._compile(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, file);
const ops = require('../src/api/operations.ts');
const { StaffRepository: repo } = require('../src/data/connectedStaffRepository.ts');
const { StaffScheduleReminder: Reminder, StaffScheduleNotice: Notice } = require('../src/components/staff/StaffScheduleReminder.tsx');
const { weekStart } = require('../src/data/weeklyAvailability.ts');
const snapshot = (registered = false, revision = 0) => ({ saved: { days: [], areaIds: [], matchNotifications: true, revision, updatedAt: '', registeredWeekStarts: registered ? [weekStart()] : [] }, bookings: [], unknownBookingCodes: [] });
let scheduleError = false, saveError = false, persisted = snapshot(), deferred = null;
const calls = [];
global.fetch = async (url, options = {}) => {
  calls.push(String(url));
  if (String(url).includes('/availability')) {
    if (options.method === 'PUT') { if (saveError) return new Response(JSON.stringify({ detail: 'Save failed' }), { status: 503 }); persisted = snapshot(true, 1); }
    else if (deferred) { const old = persisted; await new Promise(r => deferred.resolve = r); return Response.json(old); }
    if (scheduleError) return new Response(JSON.stringify({ detail: 'Schedule unavailable' }), { status: 503 });
    return Response.json(persisted);
  }
  if (String(url).includes('/finance/')) return new Response(JSON.stringify({ detail: 'Wallet unavailable' }), { status: 503 });
  if (String(url).includes('/administrative-units/')) return Response.json({ items: [] });
  if (String(url).includes('/matching')) return Response.json({ items: [] });
  if (String(url).includes('/capabilities')) return Response.json({ capabilities: [], restrictions: [] });
  return Response.json([]);
};
const render = C => renderToStaticMarkup(React.createElement(C));
ops.connectOperationsSession(profile, 'staff-1');
assert.equal(render(Reminder), '', 'Do not infer registration before reading backend');
await assert.rejects(repo.load(), /Wallet unavailable/);
await repo.loadSchedule();
assert.equal(repo.getLoadState().loaded, false);
assert.equal(repo.getScheduleLoadState().loaded, true);
assert.match(render(Reminder), /Đăng ký lịch làm việc tuần này/, 'Reminder remains available when wallet request fails');
assert.match(render(Notice), /ngày chưa đăng ký/, 'Dashboard keeps an actionable notice');
pathname = '/staff/availability'; assert.equal(render(Reminder), '', 'Do not cover the editor'); pathname = '/staff';
saveError = true;
await assert.rejects(repo.saveSchedule(String(profile.id), { days: [], areaIds: [], matchNotifications: true }, 0), /Save failed/);
assert.match(render(Reminder), /Đăng ký lịch làm việc tuần này/, 'Failed save cannot suppress registration notice');
saveError = false;
await repo.saveSchedule(String(profile.id), { days: [], areaIds: [], matchNotifications: true }, 0);
assert.equal(render(Reminder), '', 'Successful backend confirmation suppresses reminder');
assert.equal(render(Notice), '');
// A delayed response from the prior account cannot populate the new account.
deferred = {}; const oldLoad = repo.loadSchedule();
profile = { id: 71004, role: 'STAFF' }; ops.connectOperationsSession(profile, 'staff-2');
deferred.resolve(); await oldLoad; deferred = null;
assert.equal(repo.getScheduleLoadState().loaded, false);
persisted = snapshot(); scheduleError = true;
await assert.rejects(repo.loadSchedule(), /Schedule unavailable/);
assert.match(render(Reminder), /Chưa kiểm tra được lịch làm việc/);
assert.match(render(Reminder), /Thử lại/);
scheduleError = false; const before = calls.length;
await repo.loadSchedule();
assert.equal(calls.length, before + 1, 'Reminder only requests schedule, without wallet or administrative directory');
assert.match(render(Reminder), /Đăng ký lịch làm việc tuần này/, 'New employee sees own missing registration');
profile = { id: 71005, role: 'CUSTOMER' }; ops.connectOperationsSession(profile, 'customer');
assert.equal(render(Reminder), ''); assert.equal(render(Notice), '');
console.log('Schedule reminder: independent API loading, error/retry, dashboard notice, confirmed-save suppression, account isolation and customer exclusion passed.');
