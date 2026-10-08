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
const { mockNotifications } = require('../src/data/notifications.ts');
const { mockUsers } = require('../src/data/users.ts');
const { getNotificationActor, getNotificationGroup, getNotificationTarget, formatNotificationTime } = require('../src/data/notificationAdapter.ts');
const actor = id => getNotificationActor(mockUsers.find(user => user.id === id));
const hoa = actor('user-s01');
const tuan = actor('user-s05');
const customer = actor('user-c01');
const emptyStaff = actor('user-s07');
assert.ok(hoa && tuan && customer && emptyStaff);

// Deliberately corrupt ownership/target data before loading the real store.
// These inputs must never grant cross-account access or a Customer route to Staff.
const adversarial = (id, type, targetId, overrides = {}) => ({
  id, userId: hoa.userId, targetRole: 'STAFF', title: id, content: id,
  type: 'SYSTEM', isRead: false, createdAt: '2026-10-08T06:00:00Z',
  target: { type, id: targetId }, ...overrides,
});
mockNotifications.push(
  adversarial('cross-booking', 'BOOKING', 'bk-042'),
  adversarial('cross-transaction', 'TRANSACTION', 'tx-tuan-001'),
  adversarial('cross-restriction', 'RESTRICTION', 'res-003'),
  adversarial('wrong-role', 'BOOKING', 'bk-031', { targetRole: 'CUSTOMER' }),
  adversarial('staff-id-as-recipient', 'BOOKING', 'bk-031', { userId: 'staff-001' }),
  adversarial('open-booking', 'BOOKING', 'open-101'),
  adversarial('open-opportunity', 'OPPORTUNITY', 'open-101'),
  adversarial('missing-invitation', 'INVITATION', 'deleted'),
  adversarial('missing-withdrawal', 'WITHDRAWAL', 'deleted'),
  adversarial('cross-invitation', 'INVITATION', 'invite-hoa-01', { userId: tuan.userId }),
  adversarial('cross-withdrawal', 'WITHDRAWAL', 'withdraw-hoa-pending', { userId: tuan.userId }),
);
const { NotificationRepository: repo, NOTIFICATION_DEMO_CONFIG: demo } = require('../src/data/notificationRepository.ts');
demo.latencyMs = 1;

assert.deepEqual(repo.list(null), []);
assert.deepEqual(repo.list({ userId: 'staff-001', role: 'STAFF' }), []);
assert.deepEqual(repo.list({ userId: hoa.userId, role: 'CUSTOMER' }), []);
assert.deepEqual(await repo.load(emptyStaff), []);
await assert.rejects(repo.load({ userId: 'unknown', role: 'STAFF' }), /hợp lệ/);
for (const user of mockUsers) {
  const current = getNotificationActor(user);
  const list = repo.list(current);
  assert.ok(list.every(item => item.userId === user.id && item.targetRole === user.role));
  assert.equal(repo.unreadCount(current), list.filter(item => !item.isRead).length);
  assert.ok(list.every((item, index) => index === 0 || Date.parse(list[index - 1].createdAt) >= Date.parse(item.createdAt)));
  for (const item of list) {
    const target = repo.resolveTarget(current, item.id);
    if (target.kind === 'AVAILABLE') {
      assert.ok(target.destination.pathname.startsWith(user.role === 'STAFF' ? '/staff/' : '/booking/'));
    } else assert.ok(target.reason);
  }
}
const own = repo.list(hoa);
assert.ok(!own.some(item => ['wrong-role', 'staff-id-as-recipient', 'notif-001', 'notif-031'].includes(item.id)));
assert.equal(own[0].id, 'notif-hoa-withdraw-pending');
assert.ok(own.findIndex(item => item.id === 'notif-016') < own.findIndex(item => item.id === 'cross-booking'), 'Sort instants, not ISO string offsets');
assert.equal(getNotificationGroup(repo.get(hoa, 'notif-016')), 'WORK');
assert.equal(getNotificationGroup(repo.get(hoa, 'notif-018')), 'SCHEDULE');
assert.equal(getNotificationGroup(repo.get(hoa, 'notif-hoa-withdraw-pending')), 'INCOME');
assert.equal(getNotificationGroup(repo.get(tuan, 'notif-tuan-restriction')), 'SYSTEM');
assert.match(formatNotificationTime('2026-10-08T07:20:00Z'), /14:20/);
assert.equal(getNotificationTarget(repo.get(customer, 'notif-004')).type, 'TRANSACTION');

assert.deepEqual(repo.resolveTarget(hoa, 'notif-018').destination, { pathname: '/staff/job-detail', params: { id: 'bk-031' } });
assert.deepEqual(repo.resolveTarget(tuan, 'notif-031').destination, { pathname: '/staff/job-detail', params: { id: 'bk-042' } });
assert.deepEqual(repo.resolveTarget(customer, 'notif-003').destination, { pathname: '/booking/[id]', params: { id: 'bk-001' } });
assert.deepEqual(repo.resolveTarget(customer, 'notif-004').destination, { pathname: '/booking/[id]', params: { id: 'bk-001' } });
assert.equal(repo.resolveTarget(hoa, 'notif-hoa-deleted').kind, 'UNAVAILABLE');
assert.equal(repo.resolveTarget(hoa, 'cross-booking').kind, 'FORBIDDEN');
assert.equal(repo.resolveTarget(hoa, 'cross-transaction').kind, 'UNAVAILABLE');
assert.equal(repo.resolveTarget(hoa, 'cross-restriction').kind, 'FORBIDDEN');
assert.equal(repo.resolveTarget(hoa, 'open-booking').kind, 'UNAVAILABLE');
assert.equal(repo.resolveTarget(hoa, 'open-opportunity').kind, 'AVAILABLE');
assert.equal(repo.resolveTarget(tuan, 'cross-invitation').kind, 'FORBIDDEN');
assert.equal(repo.resolveTarget(tuan, 'cross-withdrawal').kind, 'FORBIDDEN');
assert.equal(repo.resolveTarget(hoa, 'missing-invitation').kind, 'UNAVAILABLE');
assert.equal(repo.resolveTarget(hoa, 'missing-withdrawal').kind, 'UNAVAILABLE');
assert.equal(repo.resolveTarget(hoa, 'notif-031').kind, 'FORBIDDEN');
assert.throws(() => repo.get(hoa, 'notif-001'), /quyền/);
assert.throws(() => repo.get(hoa, 'missing-id'), /tìm thấy/);
for (const id of ['notif-016', 'notif-017', 'notif-hoa-withdraw-pending', 'notif-hoa-withdraw-failed']) {
  assert.equal(repo.resolveTarget(hoa, id).kind, 'DETAIL_ONLY');
}
assert.equal(repo.resolveTarget(tuan, 'notif-tuan-restriction').statusLabel, 'Đã hết hạn');

// Exposing snapshots must not let callers alter another account's read state/target.
const snapshot = repo.get(hoa, 'notif-018');
snapshot.isRead = true;
snapshot.target.id = 'bk-042';
assert.equal(repo.get(hoa, snapshot.id).isRead, false);
assert.equal(repo.resolveTarget(hoa, snapshot.id).destination.params.id, 'bk-031');

demo.failNextLoad = true;
await assert.rejects(repo.load(hoa), /Chưa tải/);
assert.ok((await repo.load(hoa)).length > 0);
const revision = repo.getRevision();
const originalSnapshot = repo.getSnapshot(hoa);
assert.equal(repo.getSnapshot(hoa), originalSnapshot, 'Stable snapshot while unchanged');
assert.throws(() => { originalSnapshot[0].isRead = true; }, TypeError, 'Consumers cannot mutate cached snapshots');
demo.failNextRead = true;
await assert.rejects(repo.markRead(hoa, 'notif-018'), /Chưa cập nhật/);
assert.equal(repo.get(hoa, 'notif-018').isRead, false);
assert.equal(repo.getRevision(), revision);
assert.equal(repo.getSnapshot(hoa), originalSnapshot, 'Failed read cannot invalidate the badge snapshot');
const before = repo.unreadCount(hoa);
let updates = 0;
const unsubscribe = repo.subscribe(() => updates++);
assert.equal(await repo.markRead(hoa, 'notif-018'), 1);
assert.equal(repo.unreadCount(hoa), before - 1);
assert.notEqual(repo.getSnapshot(hoa), originalSnapshot, 'Successful read exposes a new observable snapshot to React');
assert.equal(repo.getSnapshot(hoa).find(item => item.id === 'notif-018').isRead, true);
assert.equal((await repo.load(hoa)).find(item => item.id === 'notif-018').isRead, true);
assert.equal(await repo.markRead(hoa, 'notif-018'), 0);
assert.equal(updates, 1, 'No duplicate badge updates for idempotent reads');
await assert.rejects(repo.markRead(hoa, 'notif-031'), /quyền/);
await assert.rejects(repo.markRead(hoa, ''), /tìm thấy/);
assert.equal(repo.unreadCount(hoa), before - 1, 'Invalid IDs cannot mean read all');

demo.latencyMs = 20;
const controller = new AbortController();
const aborted = repo.markRead(hoa, undefined, controller.signal);
controller.abort();
await assert.rejects(aborted, /Đã hủy/);
assert.equal(repo.unreadCount(hoa), before - 1);
const loadController = new AbortController();
const abortedLoad = repo.load(hoa, loadController.signal);
loadController.abort();
await assert.rejects(abortedLoad, /Đã hủy/);
demo.latencyMs = 1;
const otherAccounts = mockUsers.filter(user => user.id !== hoa.userId).map(user => [getNotificationActor(user), repo.list(getNotificationActor(user))]);
assert.equal(await repo.markRead(hoa), before - 1);
assert.equal(repo.unreadCount(hoa), 0);
assert.equal(updates, 2);
for (const [other, original] of otherAccounts) assert.deepEqual(repo.list(other), original, 'Read all is scoped to the authenticated recipient');
assert.ok(repo.unreadCount(tuan) > 0);
unsubscribe();
console.log('Notifications: account ownership, timestamp/grouping, targets/permissions, deleted targets, persistence, badge subscriptions, scoped read-all, failure/retry and cancellation passed.');
