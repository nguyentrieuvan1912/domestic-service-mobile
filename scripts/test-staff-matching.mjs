import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { readFileSync } from 'node:fs';
// Domain fixtures include a restriction expiring on 15/10/2026.
// Keep their clock inside that interval instead of depending on the test run date.
Date.now = () => Date.parse('2026-10-08T07:00:00+07:00');
const require = createRequire(import.meta.url);
const ts = require('typescript');
Module._extensions['.ts'] = (module, filename) => {
  const result = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  module._compile(result.outputText, filename);
};
const { StaffRepository: staff } = require('../src/data/staffRepository.ts');
// This suite covers the existing pure domain fixtures and facade delegation.
// Backend ownership, persistence and concurrency are checked separately against PostgreSQL.
const originalLoad = Module._load;
Module._load = function(specifier, parent, isMain) {
  if(parent?.filename.endsWith('staffService.ts') && specifier === './connectedStaffRepository') return {StaffRepository:staff};
  if(parent?.filename.endsWith('staffService.ts') && specifier === '@/api/operations') return {operationSession:()=>null};
  return originalLoad.call(this,specifier,parent,isMain);
};
const { StaffService: service } = require('../src/data/staffService.ts');
Module._load = originalLoad;
const { StaffMatchingRepository: repo, MATCHING_DEMO_CONFIG: demo } = require('../src/data/staffMatchingRepository.ts');
const { evaluateOpportunity, selectMatchingItems, matchingEmptyKind, normalizeSearch } = require('../src/data/staffMatchingRules.ts');
const { mockStaffCapabilities, mockCapabilityRestrictions } = require('../src/data/staffCapabilities.ts');
const { mockUsers } = require('../src/data/users.ts');
const { mockStaffs } = require('../src/data/staffs.ts');
const { intervalFor, localDate, addCalendarDays } = require('../src/data/staffAvailabilityRules.ts');
const { areaIdsForNames } = require('../src/data/staffAreas.ts');
demo.latencyMs = 0;
const hoa = { userId: 'user-s01', staffId: 'staff-001' }, tuan = { userId: 'user-s05', staffId: 'staff-005' };
const filter = { query: '', district: 'Tất cả', sort: 'START_TIME' };
const copy = value => JSON.parse(JSON.stringify(value));
const now = Date.now();
const initial = repo.read(hoa, now), context = initial.context;
const find = id => initial.items.find(item => item.opportunity.id === id);
const codes = result => result.reasons.map(reason => reason.code);
const candidate = find('open-buffer-2').opportunity;
assert.equal(find('open-buffer-1').eligibility.allowed, false);
assert.ok(codes(find('open-buffer-1').eligibility).includes('BOOKING_CONFLICT'));
assert.equal(find('open-buffer-2').eligibility.allowed, true, '08–10 then 11–12 has exactly 60 minutes buffer');
assert.ok(codes(find('open-outside-area').eligibility).includes('AREA_OUTSIDE'));
assert.ok(codes(find('open-outside-time').eligibility).includes('OUTSIDE_AVAILABILITY'));
assert.ok(codes(find('open-laundry-restricted').eligibility).includes('RESTRICTION'));
assert.ok(codes(find('open-103').eligibility).includes('CAPABILITY_INVALID'));
assert.equal(evaluateOpportunity(context, candidate, now).allowed, true);
assert.deepEqual(initial, repo.read(hoa, now), 'Pure evaluation must not mutate context/pool');
assert.ok(evaluateOpportunity(context, candidate, now).checks.every(check => check.passed));
assert.ok(codes(evaluateOpportunity({ ...context, isOnline: false }, candidate, now)).includes('OFFLINE'));
assert.ok(codes(evaluateOpportunity({ ...context, userActive: false }, candidate, now)).includes('INACTIVE'));
assert.ok(codes(evaluateOpportunity({ ...context, staffStatus: 'SUSPENDED' }, candidate, now)).includes('RESTRICTION'));
assert.ok(codes(evaluateOpportunity(context, { ...candidate, positionsRemaining: 0 }, now)).includes('POSITION_FULL'));
assert.ok(codes(evaluateOpportunity(context, { ...candidate, positionsRemaining: 3, positionsRequired: 2 }, now)).includes('POSITION_FULL'));
assert.ok(codes(evaluateOpportunity(context, { ...candidate, startsAt: 'invalid' }, now)).includes('TIME_INVALID'));
assert.ok(codes(evaluateOpportunity(context, { ...candidate, ...intervalFor(addCalendarDays(localDate(now), 8), '11:00', '12:00') }, now)).includes('OUTSIDE_WINDOW'));
assert.ok(codes(evaluateOpportunity(context, { ...candidate, ...intervalFor(localDate(now), '08:00', '10:00') }, Date.parse(`${localDate(now)}T10:00:00+07:00`))).includes('PAST_START'));
assert.ok(codes(evaluateOpportunity(context, { ...candidate, requiredCapabilities: ['srv-004'] }, now)).includes('CAPABILITY_MISSING'));
const soonExpired = copy(context);
soonExpired.capabilities.capabilities.find(cap => cap.serviceId === candidate.serviceId).validUntil = new Date(Date.parse(candidate.endsAt) - 60000).toISOString();
assert.ok(codes(evaluateOpportunity(soonExpired, candidate, now)).includes('CAPABILITY_INVALID'), 'Approval must cover the entire future job, not just the preview instant');
const futureRestriction = copy(context);
futureRestriction.capabilities.restrictions.push({ id: 'future', staffId: hoa.staffId, type: 'SUSPENSION', status: 'ACTIVE', startsAt: candidate.startsAt, endsAt: candidate.endsAt, blocksReceiving: false, reason: 'Hạn chế trong giờ ca.' });
assert.ok(codes(evaluateOpportunity(futureRestriction, candidate, now)).includes('RESTRICTION'));
assert.equal(evaluateOpportunity(context, { ...candidate, mode: 'A', invitedStaffId: hoa.staffId }, now).allowed, true);
assert.ok(codes(evaluateOpportunity(context, { ...candidate, mode: 'A', invitedStaffId: tuan.staffId }, now)).includes('NOT_INVITED'));
for (const actor of [{ userId: 'user-c01', staffId: hoa.staffId }, { ...hoa, staffId: tuan.staffId }]) {
  assert.throws(() => repo.read(actor));
  await assert.rejects(repo.claim(actor, candidate.id));
}

// Neither public card/detail nor legacy facade leaks private fixture contact/address/notes/distance.
for (const row of staff.getOpenOpportunities()) {
  assert.equal(row.customerPhone, ''); assert.equal(row.address, ''); assert.equal(row.customerName, '');
  assert.equal(row.customerAvatar, ''); assert.equal(row.notes, undefined); assert.equal(row.distanceKm, undefined);
}
const publicDetail = staff.getJobDetail(hoa.staffId, 'open-104');
assert.equal(publicDetail.kind, 'OPEN_OPPORTUNITY'); assert.equal(publicDetail.opportunity.customerPhone, '');
for (const { opportunity } of initial.items) {
  for (const privateField of ['customerPhone', 'customerName', 'customerAvatar', 'address', 'notes', 'distanceKm', 'claimedStaffIds']) assert.ok(!(privateField in opportunity));
  assert.equal(opportunity.distance, undefined, 'No verified coordinates/source means no distance, zero or ETA');
}
const allowed = selectMatchingItems(initial, filter);
assert.deepEqual(service.getOpenShifts(hoa.staffId).map(job => job.id), allowed.map(item => item.opportunity.id), 'Legacy facade uses the same owned eligibility as homepage/jobs');
assert.deepEqual(service.getOpenShifts('unknown'), []);
assert.deepEqual(allowed.map(item => item.opportunity.id), ['open-101', 'open-buffer-2', 'open-104', 'open-105', 'open-team']);
assert.equal(allowed.slice(0, 3).length, 3);
assert.equal(selectMatchingItems(initial, { ...filter, district: 'Quận 7' }).length, 0, 'Filters cannot resurrect ineligible jobs');
assert.deepEqual(selectMatchingItems(initial, { ...filter, query: 'DEMO-105' }).map(item => item.opportunity.id), ['open-105']);
assert.equal(selectMatchingItems(initial, { ...filter, query: 'Pham Ngoc Mai' }).length, 0, 'Searching cannot infer hidden customer name');
assert.ok(selectMatchingItems(initial, { ...filter, query: 'binh thanh' }).length > 0);
assert.equal(normalizeSearch('ĐẶNG'), 'dang');
const income = selectMatchingItems(initial, { ...filter, sort: 'INCOME' }).map(item => item.opportunity.netIncome);
assert.deepEqual(income, [...income].sort((a, b) => b - a));
assert.equal(matchingEmptyKind({ ...initial, context: { ...context, isOnline: false } }, false), 'OFFLINE');
assert.equal(matchingEmptyKind({ ...initial, context: { ...context, capabilities: { ...context.capabilities, eligibleCount: 0 } } }, false), 'NO_CAPABILITY');
assert.equal(matchingEmptyKind({ ...initial, context: { ...context, schedule: { ...context.schedule, saved: { ...context.schedule.saved, days: context.schedule.saved.days.map(day => ({ ...day, intervals: [] })) } } } }, false), 'NO_SCHEDULE');
assert.equal(matchingEmptyKind({ ...initial, items: [] }, false), 'NO_JOBS');
assert.equal(matchingEmptyKind(initial, true), 'FILTERED');
assert.equal(matchingEmptyKind({ ...initial, items: initial.items.filter(item => !item.eligibility.allowed) }, false), 'NO_MATCH');
const noCapability = repo.read({ userId: 'user-s06', staffId: 'staff-006' });
assert.equal(matchingEmptyKind(noCapability, false), 'NO_CAPABILITY');
assert.equal(selectMatchingItems(noCapability, filter).length, 0, 'Specialties/ratings must never substitute for Admin approval');

// Persisted online preference scopes to account; claim rechecks after a previously allowed read.
const otherBefore = staff.getOperationalProfile(tuan.staffId), walletBefore = staff.getWallet(hoa.staffId);
repo.setOnline(hoa, false);
assert.equal(selectMatchingItems(repo.read(hoa), filter).length, 0);
assert.ok(staff.getAssignments(hoa.staffId).some(job => job.id === 'bk-023'), 'Offline never hides or cancels accepted jobs');
assert.equal((await repo.claim(hoa, candidate.id)).reasons[0].code, 'OFFLINE');
assert.deepEqual(staff.getOperationalProfile(tuan.staffId), otherBefore);
repo.setOnline(hoa, true);
const approval = mockStaffCapabilities.find(item => item.id === 'cap-hoa-hourly');
const oldUntil = approval.validUntil;
approval.validUntil = new Date(now - 1000).toISOString();
assert.ok((await repo.claim(hoa, candidate.id)).reasons.some(reason => reason.code === 'CAPABILITY_INVALID'));
approval.validUntil = oldUntil;
const restriction = { id: 'matching-test', staffId: hoa.staffId, type: 'SUSPENSION', status: 'ACTIVE', startsAt: new Date(now - 1000).toISOString(), reason: 'Đang xác minh hồ sơ.' };
mockCapabilityRestrictions.push(restriction);
assert.ok((await repo.claim(hoa, candidate.id)).reasons.some(reason => reason.code === 'RESTRICTION'));
mockCapabilityRestrictions.pop();
const account = mockUsers.find(user => user.id === hoa.userId), oldStatus = account.status;
account.status = 'BLOCKED';
assert.ok((await repo.claim(hoa, candidate.id)).reasons.some(reason => reason.code === 'INACTIVE'));
account.status = oldStatus;
assert.deepEqual(staff.getWallet(hoa.staffId), walletBefore);
assert.equal(staff.getJobDetail(hoa.staffId, candidate.id).kind, 'OPEN_OPPORTUNITY');

demo.failNextLoad = true;
await assert.rejects(repo.load(hoa), /Chưa tải/);
assert.ok((await repo.load(hoa)).items.length);
const abort = new AbortController(); abort.abort();
await assert.rejects(repo.claim(hoa, candidate.id, abort.signal));
assert.equal(staff.getJobDetail(hoa.staffId, candidate.id).kind, 'OPEN_OPPORTUNITY');

// A saved availability change between preview and claim must reject without consuming a slot.
const saved = staff.getScheduleSnapshot(hoa.staffId).saved;
const draft = copy(saved);
draft.days.find(day => day.date === localDate(candidate.startsAt)).intervals = [intervalFor(localDate(candidate.startsAt), '08:00', '10:00')];
staff.saveSchedule(hoa.staffId, draft, saved.revision);
assert.ok((await repo.claim(hoa, candidate.id)).reasons.some(reason => reason.code === 'OUTSIDE_AVAILABILITY'));
staff.saveSchedule(hoa.staffId, saved, saved.revision + 1);

// Mode B requires two staff: one claim leaves one position; duplicate cannot take both.
const addedCapability = { ...approval, id: 'test-tuan-hourly', staffId: tuan.staffId };
mockStaffCapabilities.push(addedCapability);
const team = repo.detail(hoa, 'open-team');
assert.equal(team.opportunity.positionsRemaining, 2);
assert.equal((await repo.claim(tuan, 'open-team')).success, true);
assert.equal(repo.detail(hoa, 'open-team').opportunity.positionsRemaining, 1);
assert.equal(staff.getJobDetail(tuan.staffId, 'open-team').kind, 'ASSIGNMENT');
assert.ok((await repo.claim(tuan, 'open-team')).reasons.some(reason => reason.code === 'ALREADY_ASSIGNED'));
assert.equal((await repo.claim(hoa, 'open-team')).success, true);
assert.equal(repo.detail(hoa, 'open-team').opportunity.positionsRemaining, 0);
assert.ok(!selectMatchingItems(repo.read(hoa), filter).some(item => item.opportunity.id === 'open-team'));
assert.equal(staff.getJobDetail(hoa.staffId, 'open-team').kind, 'ASSIGNMENT');
assert.ok((await repo.claim(hoa, 'open-team')).reasons.some(reason => reason.code === 'POSITION_FULL'));
mockStaffCapabilities.pop();
// Separate one-slot race: Staff 2 obtains the last slot after Staff 1's allowed read.
mockStaffCapabilities.push(addedCapability);
assert.equal(repo.detail(hoa, candidate.id).eligibility.allowed, true);
assert.equal((await repo.claim(tuan, candidate.id)).success, true);
assert.equal(repo.detail(hoa, candidate.id).eligibility.allowed, false);
assert.ok((await repo.claim(hoa, candidate.id)).reasons.some(reason => reason.code === 'POSITION_FULL'));
assert.equal(staff.getJobDetail(hoa.staffId, candidate.id).kind, 'FORBIDDEN');
mockStaffCapabilities.pop();
assert.deepEqual(staff.getWallet(hoa.staffId), walletBefore, 'Claiming never credits a wallet');
assert.equal(staff.getJobDetail(hoa.staffId, 'open-team').assignment.address, 'Địa chỉ riêng của ca demo', 'Owned assignment unlocks contact/location');
assert.equal(staff.getJobDetail('unknown', 'open-104').kind, 'FORBIDDEN');
const privateClaim = await repo.claim(hoa, 'open-104');
assert.equal(privateClaim.success, true);
assert.equal(privateClaim.assignment.customerPhone, '0900000104');
assert.equal(staff.getJobDetail(hoa.staffId, 'open-104').assignment.customerPhone, '0900000104');
assert.equal(repo.read(tuan).context.actor.staffId, tuan.staffId);
assert.ok(mockStaffs.some(staff => staff.id === tuan.staffId));
assert.ok(areaIdsForNames(['Bình Thạnh']).length);
console.log('Matching: owned pure eligibility/reasons, capability/restriction/online, schedule/buffer boundaries, privacy, filters/sorts/empty states, abort/retry, stale claims and multi-position races passed.');

const {matchingModeCounts}=require('../src/utils/staff-matching-mode.ts');
const splitSnapshot={context:{actor:{staffId:'42'}},items:[
 {opportunity:{id:'a',mode:'A',invitedStaffId:'42',startsAt:'2026-10-16T02:00:00Z',serviceName:'Dọn nhà',packageTitle:'2 giờ',district:'Phường Sài Gòn',bookingCode:'A'},eligibility:{allowed:true}},
 {opportunity:{id:'a-offline',mode:'A',invitedStaffId:'42',startsAt:'2026-10-16T06:00:00Z',serviceName:'Dọn nhà',packageTitle:'2 giờ',district:'Phường Sài Gòn',bookingCode:'A2'},eligibility:{allowed:false}},
 {opportunity:{id:'foreign',mode:'A',invitedStaffId:'99',startsAt:'2026-10-16T02:00:00Z',serviceName:'Dọn nhà',packageTitle:'2 giờ',district:'Phường Sài Gòn',bookingCode:'OTHER'},eligibility:{allowed:true}},
 {opportunity:{id:'b',mode:'B',startsAt:'2026-10-16T02:00:00Z',serviceName:'Dọn nhà',packageTitle:'2 giờ',district:'Phường Sài Gòn',bookingCode:'B'},eligibility:{allowed:true}},
 {opportunity:{id:'b-blocked',mode:'B',startsAt:'2026-10-16T02:00:00Z',serviceName:'Dọn nhà',packageTitle:'2 giờ',district:'Phường Sài Gòn',bookingCode:'B2'},eligibility:{allowed:false}},
]};
assert.deepEqual(matchingModeCounts(splitSnapshot),{A:2,B:1});assert.deepEqual(matchingModeCounts(),{A:0,B:0});
assert.deepEqual(selectMatchingItems(splitSnapshot,{...filter,mode:'A'}).map(item=>item.opportunity.id),['a','a-offline']);
assert.deepEqual(selectMatchingItems(splitSnapshot,{...filter,mode:'B'}).map(item=>item.opportunity.id),['b']);
assert.deepEqual(selectMatchingItems(splitSnapshot,{...filter,mode:'A',query:'không có'}),[]);
console.log('Matching modes: own invitations counted even while ineligible; foreign invitations excluded; open jobs require eligibility; search remains scoped.');
