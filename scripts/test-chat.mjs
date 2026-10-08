import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { readFileSync } from 'node:fs';

// Run the actual repository and fixtures without adding a runtime/test dependency.
const require = createRequire(import.meta.url);
const ts = require('typescript');
Module._extensions['.ts'] = (module, filename) => {
  const result = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(result.outputText, filename);
};
const { ChatRepository: chat, CHAT_DEMO_CONFIG: demo, getChatActor, createChatDraft } = require('../src/data/chatRepository.ts');
const { canSendChat, getChatBookingPhase, isOwnChatMessage } = require('../src/data/chatPolicy.ts');
const { mockUsers } = require('../src/data/users.ts');
const { mockConversations } = require('../src/data/conversations.ts');
const { StaffRepository: staff } = require('../src/data/staffRepository.ts');
demo.latencyMs = 1;
const hoa = getChatActor(mockUsers.find(user => user.id === 'user-s01'));
const tuan = getChatActor(mockUsers.find(user => user.id === 'user-s05'));
const huy = getChatActor(mockUsers.find(user => user.id === 'user-c04'));
const customerHoa = getChatActor(mockUsers.find(user => user.id === 'user-c01'));
assert.ok(hoa && tuan && huy && customerHoa);

const access = chat.resolveForBooking('bk-023', hoa);
assert.equal(access.kind, 'READY');
assert.equal(access.conversation.id, 'conv-001');
assert.equal(access.conversation.customerName, 'Trần Gia Huy');
assert.equal(access.conversation.staffName, 'Nguyễn Thị Hoa');
assert.equal(access.phase, 'ACTIVE');
assert.equal(chat.access('conv-001', tuan).kind, 'FORBIDDEN');
assert.equal(chat.access('conv-tuan-01', hoa).kind, 'FORBIDDEN');
assert.equal(chat.resolveForBooking('bk-042', hoa).kind, 'FORBIDDEN');
assert.equal(chat.access('conv-001', customerHoa).kind, 'FORBIDDEN');
assert.equal(chat.access('conv-001', null).kind, 'UNAUTHENTICATED');
assert.equal(chat.access('bk-023', hoa).kind, 'NOT_FOUND');
assert.equal(chat.access('bad-id', hoa).kind, 'NOT_FOUND');
assert.equal(chat.access(undefined, hoa).kind, 'NOT_FOUND');
assert.equal(chat.resolveForBooking('missing-booking', hoa).kind, 'MISSING_MAPPING');
assert.equal(chat.access('conv-001', { ...hoa, userId: tuan.userId }).kind, 'FORBIDDEN');

// Being a participant alone must not grant booking access.
const fixture = mockConversations.find(conversation => conversation.id === 'conv-001');
const originalBookingId = fixture.bookingId;
fixture.bookingId = 'bk-031';
assert.equal(chat.access('conv-001', hoa).kind, 'MISSING_MAPPING');
fixture.bookingId = 'bk-042';
assert.equal(chat.access('conv-001', hoa).kind, 'FORBIDDEN');
fixture.bookingId = 'missing-booking';
assert.equal(chat.access('conv-001', hoa).kind, 'MISSING_MAPPING');
fixture.bookingId = originalBookingId;

assert.deepEqual(await chat.load('conv-staff-031', hoa), []);
assert.equal(chat.resolveForBooking('bk-031', hoa).conversation.id, 'conv-staff-031');
assert.equal(chat.access('conv-tuan-01', tuan).phase, 'AWAITING_ACCEPTANCE');
assert.equal(chat.access('conv-002', hoa).phase, 'CLOSED');
assert.equal(chat.access('conv-002', customerHoa).kind, 'READY');
assert.ok(chat.getMessages('conv-002', hoa).length > 0);
assert.equal(canSendChat('ACTIVE'), true);
assert.equal(canSendChat('AWAITING_ACCEPTANCE'), true);
assert.equal(canSendChat('AWAITING_ACCEPTANCE', { allowWhileAwaitingAcceptance: false }), false);
for (const status of ['COMPLETED', 'CANCELLED', 'ABSENT', 'REFUNDING', 'REFUNDED', 'REJECTED']) {
  assert.equal(getChatBookingPhase(status), 'CLOSED');
}
assert.equal(getChatBookingPhase('IN_PROGRESS', true), 'AWAITING_ACCEPTANCE');
assert.equal(getChatBookingPhase('COMPLETED', true), 'CLOSED');
assert.equal(getChatBookingPhase('UNKNOWN_STATUS'), 'CLOSED', 'Unknown booking statuses fail closed');

demo.failNextLoad = true;
await assert.rejects(chat.load('conv-001', hoa), /Chưa tải/);
assert.ok((await chat.load('conv-001', hoa)).length > 0);
const before = chat.getMessages('conv-001', hoa).length;
const draft = createChatDraft('conv-001', hoa, 'Kiểm tra gửi cục bộ');
demo.failNextSend = true;
await assert.rejects(chat.send('conv-001', hoa, draft.content, draft.id), /Chưa gửi/);
assert.equal(chat.getMessages('conv-001', hoa).length, before, 'Failed sends must not persist');
const sent = await chat.send('conv-001', hoa, draft.content, draft.id);
assert.equal(sent.senderType, 'STAFF');
assert.equal(sent.senderId, 'staff-001');
assert.equal(isOwnChatMessage(sent, hoa), true);
assert.equal(isOwnChatMessage(sent, huy), false);
await chat.send('conv-001', hoa, draft.content, draft.id);
assert.equal(chat.getMessages('conv-001', hoa).length, before + 1, 'Retry is idempotent');
assert.equal((await chat.load('conv-001', hoa)).at(-1).id, sent.id, 'Messages survive route reopen');

const customerMessage = await chat.send('conv-001', huy, 'Khách gửi thử cục bộ', 'customer-local');
assert.equal(customerMessage.senderType, 'CUSTOMER');
assert.equal(customerMessage.senderId, 'cust-004');
assert.equal(isOwnChatMessage(customerMessage, huy), true);
assert.equal(isOwnChatMessage(customerMessage, hoa), false);
await assert.rejects(chat.send('conv-001', tuan, 'Không được phép', 'cross-staff'), /không tham gia/);
await assert.rejects(chat.send('conv-002', hoa, 'Ca đã đóng', 'closed'), /khóa/);
await assert.rejects(chat.send('conv-tuan-01', tuan, 'Chờ nghiệm thu', 'await-policy', undefined,
  { allowWhileAwaitingAcceptance: false }), /khóa/);

demo.latencyMs = 20;
const controller = new AbortController();
const cancelled = chat.send('conv-staff-031', hoa, 'Tin đã hủy', 'abort-send', controller.signal);
controller.abort();
await assert.rejects(cancelled, /Đã hủy/);
assert.equal(chat.getMessages('conv-staff-031', hoa).length, 0);
const loadController = new AbortController();
const cancelledLoad = chat.load('conv-001', hoa, loadController.signal);
loadController.abort();
await assert.rejects(cancelledLoad, /Đã hủy/);

const lateSend = chat.send('conv-001', hoa, 'Ca kết thúc khi đang gửi', 'late-send');
assert.equal(staff.updateJobStatus('staff-001', 'bk-023', 'COMPLETED').success, true);
await assert.rejects(lateSend, /khóa/);
assert.equal(chat.access('conv-001', huy).phase, 'CLOSED', 'Both actors see live booking closure');
assert.ok(!chat.getMessages('conv-001', hoa).some(message => message.id === 'late-send'));
console.log('Chat: access, mapping, actors, policy, persistence, failure/retry, cancellation and live closure passed.');
