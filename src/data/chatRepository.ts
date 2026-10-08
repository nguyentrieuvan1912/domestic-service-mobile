import type { ChatMessage, Conversation } from '../types/chat';
import type { User } from '../types/user';
import { mockConversations } from './conversations';
import { mockMessages } from './messages';
import { mockCustomers } from './customers';
import { mockStaffs } from './staffs';
import { mockBookings } from './bookings';
import { mockBookingAssignments } from './bookingAssignments';
import { StaffRepository } from './staffRepository';
import { canSendChat, getChatBookingPhase } from './chatPolicy';
import type { ChatActor, ChatBookingPhase, ChatPolicy } from './chatPolicy';

export type ChatAccessResult =
  | { kind: 'READY'; conversation: Conversation; phase: ChatBookingPhase; bookingCode: string }
  | { kind: 'UNAUTHENTICATED' | 'NOT_FOUND' | 'MISSING_MAPPING' | 'FORBIDDEN'; reason: string };

export function getChatActor(user: User | null): ChatActor | null {
  if (!user) return null;
  const participant = user.role === 'STAFF'
    ? mockStaffs.find((staff) => staff.userId === user.id)
    : user.role === 'CUSTOMER'
      ? mockCustomers.find((customer) => customer.userId === user.id)
      : undefined;
  if (!participant || (user.role !== 'STAFF' && user.role !== 'CUSTOMER')) return null;
  return { userId: user.id, participantId: participant.id, role: user.role, name: user.fullName, avatar: user.avatar };
}

const messageStore = new Map<string, ChatMessage[]>();
const listeners = new Set<() => void>();

// Local demo controls are opt-in for QA, never an API request or product success claim.
export const CHAT_DEMO_CONFIG = { latencyMs: 350, failNextLoad: false, failNextSend: false };

export function createChatDraft(conversationId: string, actor: ChatActor, content: string): ChatMessage {
  return { id: `local-${actor.userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    conversationId, senderId: actor.participantId, senderName: actor.name, senderAvatar: actor.avatar,
    senderType: actor.role, content: content.trim(), contentType: 'TEXT', isRead: false,
    sentAt: new Date().toISOString() };
}

function notify() { listeners.forEach((listener) => listener()); }

function waitForDemo(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      reject(new Error('Đã hủy thao tác.'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, CHAT_DEMO_CONFIG.latencyMs);
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
  });
}

export const ChatRepository = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },

  access(conversationId: string | undefined, actor: ChatActor | null): ChatAccessResult {
    if (!actor) return { kind: 'UNAUTHENTICATED', reason: 'Vui lòng đăng nhập để xem tin nhắn.' };
    // Recheck account/domain mapping at the boundary; do not trust a route or caller-supplied actor.
    const person = actor.role === 'STAFF'
      ? mockStaffs.find((staff) => staff.id === actor.participantId && staff.userId === actor.userId)
      : mockCustomers.find((customer) => customer.id === actor.participantId && customer.userId === actor.userId);
    if (!person) return { kind: 'FORBIDDEN', reason: 'Tài khoản không khớp người tham gia cuộc trò chuyện.' };
    const conversation = mockConversations.find((item) => item.id === conversationId);
    if (!conversation) return { kind: 'NOT_FOUND', reason: 'Không tìm thấy cuộc trò chuyện này.' };
    const participantId = actor.role === 'STAFF' ? conversation.staffId : conversation.customerId;
    if (participantId !== actor.participantId) return { kind: 'FORBIDDEN', reason: 'Bạn không tham gia cuộc trò chuyện của ca này.' };

    const detail = StaffRepository.getJobDetail(conversation.staffId, conversation.bookingId);
    if (detail.kind === 'ASSIGNMENT') {
      const assignment = detail.assignment;
      if (assignment.conversationId !== conversation.id || !assignment.customerId) {
        return { kind: 'MISSING_MAPPING', reason: 'Ca chưa có thông tin liên kết cuộc trò chuyện hợp lệ.' };
      }
      if (assignment.staffId !== conversation.staffId || assignment.customerId !== conversation.customerId) {
        return { kind: 'FORBIDDEN', reason: 'Người tham gia không có quyền với ca làm việc này.' };
      }
      return { kind: 'READY', conversation: { ...conversation, customerName: assignment.customerName, customerAvatar: assignment.customerAvatar, serviceName: assignment.serviceName },
        bookingCode: assignment.bookingCode, phase: getChatBookingPhase(assignment.status, assignment.chatAwaitingAcceptance) };
    }

    if (detail.kind === 'FORBIDDEN') return { kind: 'FORBIDDEN', reason: detail.reason };
    // Existing Customer bookings retain their own accepted assignments and DTO statuses.
    const booking = mockBookings.find((item) => item.id === conversation.bookingId);
    if (!booking) return { kind: 'MISSING_MAPPING', reason: 'Không tìm thấy ca liên kết với cuộc trò chuyện.' };
    const accepted = mockBookingAssignments.some((assignment) => assignment.bookingId === booking.id &&
      assignment.staffId === conversation.staffId && assignment.status === 'ACCEPTED');
    if (booking.customerId !== conversation.customerId || !accepted) {
      return { kind: 'FORBIDDEN', reason: 'Người tham gia không có quyền với ca làm việc này.' };
    }
    return { kind: 'READY', conversation: { ...conversation }, bookingCode: booking.bookingCode, phase: getChatBookingPhase(booking.status) };
  },

  resolveForBooking(bookingId: string | undefined, actor: ChatActor | null, staffId?: string): ChatAccessResult {
    if (!actor) return this.access(undefined, actor);
    const bookingConversations = mockConversations.filter((conversation) => conversation.bookingId === bookingId);
    const candidates = bookingConversations.filter((conversation) =>
      (actor.role === 'STAFF' ? conversation.staffId === actor.participantId : conversation.customerId === actor.participantId) &&
      (!staffId || conversation.staffId === staffId));
    if (bookingConversations.length > 0 && candidates.length === 0) {
      return { kind: 'FORBIDDEN', reason: 'Bạn không có quyền nhắn tin trong ca làm việc này.' };
    }
    if (candidates.length !== 1) return { kind: 'MISSING_MAPPING', reason: 'Ca chưa có cuộc trò chuyện riêng được liên kết.' };
    return this.access(candidates[0].id, actor);
  },

  getMessages(conversationId: string, actor: ChatActor): ChatMessage[] {
    const access = this.access(conversationId, actor);
    if (access.kind !== 'READY') throw new Error(access.reason);
    const conversation = access.conversation;
    const messages = messageStore.get(conversationId) ?? mockMessages.filter((message) => message.conversationId === conversationId);
    return messages.map((message) => ({ ...message,
      ...(message.senderType === 'STAFF' ? { senderName: conversation.staffName, senderAvatar: conversation.staffAvatar } :
        message.senderType === 'CUSTOMER' ? { senderName: conversation.customerName, senderAvatar: conversation.customerAvatar } : {}),
    })).sort((a, b) => Date.parse(a.sentAt) - Date.parse(b.sentAt));
  },

  async load(conversationId: string, actor: ChatActor, signal?: AbortSignal): Promise<ChatMessage[]> {
    await waitForDemo(signal);
    if (CHAT_DEMO_CONFIG.failNextLoad) {
      CHAT_DEMO_CONFIG.failNextLoad = false;
      throw new Error('Chưa tải được tin nhắn. Vui lòng thử lại.');
    }
    return this.getMessages(conversationId, actor);
  },

  async send(conversationId: string, actor: ChatActor, content: string, clientMessageId: string,
    signal?: AbortSignal, policy?: ChatPolicy): Promise<ChatMessage> {
    await waitForDemo(signal);
    // Permission and booking policy are checked again after processing, including retries.
    const access = this.access(conversationId, actor);
    if (access.kind !== 'READY') throw new Error(access.reason);
    if (!canSendChat(access.phase, policy)) throw new Error('Ca đã khóa gửi tin nhắn theo chính sách liên lạc.');
    if (!content.trim()) throw new Error('Vui lòng nhập nội dung tin nhắn.');
    const messages = this.getMessages(conversationId, actor);
    const existing = messages.find((message) => message.id === clientMessageId);
    if (existing) {
      if (existing.senderId !== actor.participantId) throw new Error('Mã tin nhắn không hợp lệ.');
      return existing;
    }
    if (CHAT_DEMO_CONFIG.failNextSend) {
      CHAT_DEMO_CONFIG.failNextSend = false;
      throw new Error('Chưa gửi được tin nhắn. Nội dung đã được giữ để thử lại.');
    }
    const message: ChatMessage = { id: clientMessageId, conversationId, senderId: actor.participantId,
      senderType: actor.role, senderName: actor.name, senderAvatar: actor.avatar, content: content.trim(),
      contentType: 'TEXT', isRead: false, sentAt: new Date().toISOString() };
    messageStore.set(conversationId, [...messages, message]);
    const fixture = mockConversations.find((conversation) => conversation.id === conversationId);
    if (fixture) {
      fixture.lastMessage = message.content;
      fixture.lastMessageTime = message.sentAt;
      if (actor.role === 'STAFF') fixture.unreadCountCustomer += 1;
      else fixture.unreadCountStaff += 1;
    }
    notify();
    return { ...message };
  },
};
