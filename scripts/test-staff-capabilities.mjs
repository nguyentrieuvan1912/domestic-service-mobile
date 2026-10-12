import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
Module._extensions['.ts'] = (module, filename) => {
  const result = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(result.outputText, filename);
};
const { StaffCapabilityRepository: repo, CAPABILITY_DEMO_CONFIG: demo } = require('../src/data/staffCapabilityRepository.ts');
const { adaptStaffCapability, adaptCapabilityRestriction, getCapabilityActor, formatCapabilityDate } = require('../src/data/staffCapabilityAdapter.ts');
const { mockStaffCapabilities, mockCapabilityRestrictions } = require('../src/data/staffCapabilities.ts');
const { mockUsers } = require('../src/data/users.ts');
const { mockStaffs } = require('../src/data/staffs.ts');
const { StaffRepository: staffRepo } = require('../src/data/staffRepository.ts');
const now = Date.parse('2026-10-08T12:00:00+07:00');
const actor = staffId => getCapabilityActor(mockUsers.find(user => user.id === mockStaffs.find(item => item.id === staffId)?.userId), mockStaffs.find(item => item.id === staffId));
const hoa = actor('staff-001');
const tuan = actor('staff-005');
const empty = actor('staff-010');
assert.ok(hoa && tuan && empty);
assert.equal(getCapabilityActor(null, mockStaffs[0]), null);
assert.equal(getCapabilityActor(mockUsers.find(user => user.id === 'user-c01'), mockStaffs[0]), null);
assert.equal(getCapabilityActor(mockUsers.find(user => user.id === tuan.userId), mockStaffs[0]), null);
assert.throws(() => repo.getSnapshot({ userId: tuan.userId, staffId: hoa.staffId }, now), /hợp lệ/);
assert.throws(() => repo.getDetail(hoa, 'cap-tuan-ac-cleaning', now), /hồ sơ của bạn/);
assert.throws(() => repo.getDetail(tuan, 'cap-hoa-hourly', now), /hồ sơ của bạn/);
assert.throws(() => repo.getDetail(hoa, 'deleted', now), /hồ sơ của bạn/);
assert.deepEqual(repo.getSnapshot(empty, now).capabilities, []);
assert.equal(repo.getSnapshot(empty, now).eligibleCount, 0);
assert.equal(repo.canReceiveService(empty.staffId, 'srv-001', now).allowed, false);
assert.equal(repo.canReceiveService('unknown-staff', 'srv-001', now).allowed, false);
assert.equal(repo.canReceiveService(hoa.userId, 'srv-001', now).allowed, false, 'Account ID cannot be used as domain Staff ID');

const hoaSnapshot = repo.getSnapshot(hoa, now);
const tuanSnapshot = repo.getSnapshot(tuan, now);
assert.equal(hoaSnapshot.eligibleCount, 1);
assert.equal(tuanSnapshot.eligibleCount, 2);
assert.deepEqual(tuanSnapshot.capabilities.map(item => item.serviceId), ['srv-004', 'srv-005']);
assert.equal(repo.getDetail(hoa, 'cap-hoa-hourly', now).state, 'VALID');
assert.equal(repo.getDetail(hoa, 'cap-hoa-deep', now).state, 'EXPIRED');
assert.equal(repo.getDetail(hoa, 'cap-hoa-laundry', now).state, 'SUSPENDED');
assert.equal(repo.getDetail(hoa, 'cap-hoa-cooking', now).state, 'PENDING');
assert.ok(!JSON.stringify(hoaSnapshot).includes('Thông tin nội bộ'));
assert.ok(!JSON.stringify(hoaSnapshot).includes('Ghi chú nội bộ'));
assert.equal(repo.getDetail(hoa, 'cap-hoa-laundry', now).approvedAt, undefined);
assert.equal(repo.getDetail(hoa, 'cap-hoa-hourly', now).approvedByName, 'Bộ phận xác minh năng lực');
assert.ok(tuanSnapshot.restrictions.every(item => !item.blocksReceiving), 'Historical restriction is not active');
assert.match(formatCapabilityDate('2026-09-01T02:00:00Z'), /09:00/);
assert.equal(formatCapabilityDate('invalid'), 'Cần kiểm tra lại');
const detached = repo.getDetail(hoa, 'cap-hoa-hourly', now);
detached.scope.push('Caller mutation');
assert.ok(!repo.getDetail(hoa, detached.id, now).scope.includes('Caller mutation'));

const base = { ...mockStaffCapabilities[0], validFrom: '2026-10-08T12:00:00+07:00', validUntil: '2026-10-08T13:00:00+07:00' };
assert.equal(adaptStaffCapability(base, [], now - 1).state, 'NOT_YET_VALID');
assert.equal(adaptStaffCapability(base, [], now).canReceive, true);
assert.equal(adaptStaffCapability(base, [], Date.parse(base.validUntil) - 1).canReceive, true);
assert.equal(adaptStaffCapability(base, [], Date.parse(base.validUntil)).state, 'EXPIRED');
for (const status of ['PENDING', 'REJECTED', 'INACTIVE', 'unknown-status']) assert.equal(adaptStaffCapability({ ...base, status }, [], now).canReceive, false);
for (const approvedAt of [undefined, 'invalid', '2027-01-01T00:00:00+07:00']) assert.equal(adaptStaffCapability({ ...base, approvedAt }, [], now).canReceive, false);
for (const bounds of [{ validFrom: 'invalid' }, { validUntil: 'invalid' }, { validUntil: base.validFrom }]) assert.equal(adaptStaffCapability({ ...base, ...bounds }, [], now).canReceive, false);

const restriction = { id: 'test-limit', staffId: hoa.staffId, type: 'SERVICE_LIMIT', serviceId: 'srv-001', reason: 'Test scoped restriction',
  startsAt: base.validFrom, endsAt: base.validUntil, status: 'ACTIVE' };
assert.equal(adaptCapabilityRestriction(restriction, now - 1).blocksReceiving, false);
assert.equal(adaptCapabilityRestriction(restriction, now).blocksReceiving, true);
assert.equal(adaptCapabilityRestriction(restriction, Date.parse(restriction.endsAt)).blocksReceiving, false);
assert.equal(adaptStaffCapability(base, [adaptCapabilityRestriction(restriction, now)], now).state, 'SUSPENDED');
assert.equal(adaptStaffCapability(base, [adaptCapabilityRestriction({ ...restriction, serviceId: 'srv-012' }, now)], now).canReceive, true);
assert.equal(adaptStaffCapability(base, [adaptCapabilityRestriction({ ...restriction, type: 'SUSPENSION', serviceId: undefined }, now)], now).canReceive, false);
assert.equal(adaptStaffCapability(base, [adaptCapabilityRestriction({ ...restriction, type: 'WARNING' }, now)], now).canReceive, true);
for (const status of ['EXPIRED', 'REVOKED']) assert.equal(adaptCapabilityRestriction({ ...restriction, status }, now).blocksReceiving, false);
assert.equal(adaptCapabilityRestriction({ ...restriction, startsAt: 'invalid' }, now).blocksReceiving, true, 'Malformed active restriction fails closed');
assert.equal(adaptCapabilityRestriction({ ...restriction, startsAt: undefined }, now).blocksReceiving, true);
assert.equal(adaptCapabilityRestriction({ ...restriction, endsAt: restriction.startsAt }, now).blocksReceiving, true);
assert.equal(adaptCapabilityRestriction({ ...restriction, endsAt: undefined }, now).blocksReceiving, true);

// A service claimed in specialties/competencies cannot create an approved capability.
const staffHoa = mockStaffs.find(item => item.id === hoa.staffId);
const originalSpecialties = staffHoa.specialties;
staffHoa.specialties = ['Nấu ăn gia đình', 'Tổng vệ sinh'];
assert.equal(repo.canReceiveService(hoa.staffId, 'srv-011', now).allowed, false);
assert.equal(repo.canReceiveService(hoa.staffId, 'srv-002', now).allowed, false);
const originalStatus = staffHoa.status;
staffHoa.status = 'SUSPENDED';
assert.equal(repo.getSnapshot(hoa, now).eligibleCount, 0);
assert.equal(repo.canReceiveService(hoa.staffId, 'srv-001', now).allowed, false);
staffHoa.status = originalStatus;
staffHoa.specialties = originalSpecialties;

demo.latencyMs = 1;
demo.failNextLoad = true;
await assert.rejects(repo.load(hoa), /Chưa tải/);
assert.equal((await repo.load(hoa)).capabilities.length, 4);
assert.equal((await repo.load(empty)).capabilities.length, 0);
await assert.rejects(repo.load({ userId: 'user-c01', staffId: hoa.staffId }), /hợp lệ/);
demo.latencyMs = 20;
const controller = new AbortController();
const request = repo.load(hoa, controller.signal);
controller.abort();
await assert.rejects(request, /Đã hủy/);

// Test the real claim mutation: rejection must not consume a position or credit money.
const openBefore = staffRepo.getOpenOpportunities();
const assignmentsBefore = staffRepo.getAssignments(tuan.staffId);
const walletBefore = staffRepo.getWallet(tuan.staffId);
assert.equal(staffRepo.claimOpportunity(tuan.staffId, 'open-101').errorCode, 'NOT_ELIGIBLE');
assert.equal(staffRepo.claimOpportunity(hoa.staffId, 'open-102').errorCode, 'NOT_ELIGIBLE');
assert.equal(staffRepo.claimOpportunity(hoa.staffId, 'open-103').errorCode, 'NOT_ELIGIBLE');
assert.deepEqual(staffRepo.getOpenOpportunities(), openBefore);
assert.deepEqual(staffRepo.getAssignments(tuan.staffId), assignmentsBefore);
assert.deepEqual(staffRepo.getWallet(tuan.staffId), walletBefore);
assert.equal(staffRepo.getJobDetail(hoa.staffId, 'bk-031').kind, 'ASSIGNMENT', 'Capability expiry does not silently cancel an existing assignment');

const hourly = mockStaffCapabilities.find(item => item.id === 'cap-hoa-hourly');
const originalUntil = hourly.validUntil;
assert.equal(repo.canReceiveService(hoa.staffId, 'srv-001').allowed, true);
hourly.validUntil = new Date(Date.now() - 1000).toISOString();
assert.equal(staffRepo.claimOpportunity(hoa.staffId, 'open-101').errorCode, 'NOT_ELIGIBLE', 'Recheck expiry at mutation after a prior allowed read');
assert.deepEqual(staffRepo.getOpenOpportunities(), openBefore);
hourly.validUntil = originalUntil;
const addedRestriction = { ...restriction, startsAt: '2026-01-01T00:00:00+07:00', endsAt: undefined };
mockCapabilityRestrictions.push(addedRestriction);
assert.equal(staffRepo.claimOpportunity(hoa.staffId, 'open-101').errorCode, 'NOT_ELIGIBLE', 'Recheck restrictions at mutation');
mockCapabilityRestrictions.pop();
assert.equal(staffRepo.claimOpportunity(hoa.staffId, 'open-101').success, true);
assert.ok(staffRepo.getAssignments(hoa.staffId).some(item => item.id === 'open-101'));
assert.equal(staffRepo.claimOpportunity(tuan.staffId, 'open-101').success, false);
// The added demo opportunities stay consistent when moving from the shared pool to Hoa's assignments.
const demoOpportunities = ['open-104', 'open-105'].map(id => staffRepo.getOpenOpportunities().find(item => item.id === id));
assert.ok(demoOpportunities.every(item => item?.serviceId === 'srv-001' && item.district === 'Bình Thạnh'));
assert.ok(Date.parse(demoOpportunities[1].startsAt) - Date.parse(demoOpportunities[0].endsAt) >= 60 * 60 * 1000);
const hoaWalletBeforeClaim = staffRepo.getWallet(hoa.staffId);
for (const opportunity of demoOpportunities) {
  assert.match(opportunity.startsAt, /T\d\d:[03]0:00\+07:00$/);
  assert.match(opportunity.endsAt, /T\d\d:[03]0:00\+07:00$/);
  assert.equal(opportunity.netIncome, opportunity.totalCustomerPaid - opportunity.platformFee);
  const claimed = staffRepo.claimOpportunity(hoa.staffId, opportunity.id);
  assert.equal(claimed.success, true);
  assert.equal(claimed.assignment.startsAt, opportunity.startsAt);
  assert.equal(claimed.assignment.endsAt, opportunity.endsAt);
  assert.equal(staffRepo.getJobDetail(tuan.staffId, opportunity.id).kind, 'FORBIDDEN');
  assert.equal(staffRepo.getOpenOpportunities().some(item => item.id === opportunity.id), false);
}
assert.deepEqual(staffRepo.getWallet(hoa.staffId), hoaWalletBeforeClaim, 'Accepting a demo opportunity does not credit income');
console.log('Capabilities: actor/ownership, empty, redaction, approval/validity boundaries, restrictions, failure/retry/cancellation and claim revalidation without side effects passed.');
