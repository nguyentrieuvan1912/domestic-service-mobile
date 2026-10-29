import { operationRequest, operationSession, subscribeSession } from '@/api/operations';
import { reuseSnapshot } from '@/utils/stable-snapshot';
import type { User } from '@/types/user';
import type { ChatMessage, Conversation } from '@/types/chat';
import type { ChatActor } from './chatPolicy';
import { getChatBookingPhase } from './chatPolicy';
import type { ChatAccessResult } from './chatRepository';
type LiveConversation = Conversation & { bookingStatus: string; conversationStatus: string; bookingCode: string };
let conversations: LiveConversation[] = [], owner = '', error = '', loading: Promise<void> | null = null;
let readEpoch = 0, hasLoaded = false;
let watcher: { token: string; clients: Set<() => boolean>; timer: ReturnType<typeof setInterval> } | undefined;
const messageEpoch = new Map<string, number>();
const receiptThrough = new Map<string, number>();
const receiptsInFlight = new Map<string, Promise<void>>();
const emptyMessages: ChatMessage[] = [];
const messages = new Map<string, ChatMessage[]>(), listeners = new Set<() => void>();
function notify() { listeners.forEach(listener => { try { listener(); } catch { /* Role-scoped subscribers can unmount during logout. */ } }); }
subscribeSession(() => { const active = operationSession(), id = active?.token || ''; if (id !== owner) { owner = id; conversations = []; messages.clear(); messageEpoch.clear(); receiptThrough.clear(); receiptsInFlight.clear(); readEpoch++; error = ''; hasLoaded = false; loading = null; if (watcher) clearInterval(watcher.timer); watcher = undefined; notify(); } });
function assertActor(actor: ChatActor | null) { const session = operationSession(); if (!actor || !session || actor.userId !== session.userId || actor.participantId !== session.userId || actor.role !== session.profile.role) throw new Error('Vui lòng đăng nhập đúng tài khoản tham gia hội thoại.'); return session; }
export function getChatActor(user: User | null): ChatActor | null { return user && ['STAFF', 'CUSTOMER'].includes(user.role) ? { userId: user.id, participantId: user.id, role: user.role as ChatActor['role'], name: user.fullName, avatar: user.avatar } : null; }
export function createChatDraft(conversationId: string, actor: ChatActor, content: string): ChatMessage { return { id: 'message-' + Date.now() + '-' + Math.random().toString(36).slice(2), conversationId, senderId: actor.userId, senderType: actor.role, senderName: actor.name, senderAvatar: actor.avatar, contentType: 'TEXT', content, isRead: false, sentAt: new Date().toISOString() }; }
export const ChatRepository = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  list() { return conversations; },
  getError() { return error; },
  getLoaded() { return hasLoaded; },
  watch(actor: ChatActor, visible: () => boolean) {
    const active = assertActor(actor);
    if (watcher?.token !== active.token) {
      if (watcher) clearInterval(watcher.timer);
      const clients = new Set<() => boolean>();
      watcher = { token: active.token, clients, timer: setInterval(() => {
        if ([...clients].some(isVisible => isVisible())) void this.loadList(actor).catch(() => {});
      }, 4000) };
    }
    const resource = watcher; resource.clients.add(visible);
    if (visible()) void this.loadList(actor).catch(() => {});
    return () => { resource.clients.delete(visible); if (!resource.clients.size) { clearInterval(resource.timer); if (watcher === resource) watcher = undefined; } };
  },
  async loadList(actor: ChatActor | null) {
    const active = assertActor(actor); if (loading) return loading;
    const epoch = readEpoch;
    const task = (async () => { try {
      const data = await operationRequest<Record<string, unknown>[]>('booking', '/conversations');
      if (active.token !== operationSession()?.token || epoch !== readEpoch) return;
      const next=reuseSnapshot(conversations,data.map(item => ({ ...item, id: String(item.id), bookingId: String(item.bookingId), customerId: String(item.customerId), staffId: String(item.staffId) } as LiveConversation)));
      let cacheChanged = false;
      for (const [id, previous] of messages) {
        const conversation = next.find(item => item.id === id);
        const cutoff = actor?.role === 'CUSTOMER' ? Number(conversation?.customerDeletedThroughId || 0) : 0;
        const retained = conversation ? (cutoff > 0 ? previous.filter(item => Number(item.id) > cutoff) : previous) : [];
        if (!conversation || retained.length !== previous.length) {
          messageEpoch.set(id, (messageEpoch.get(id) || 0) + 1);
          if (conversation) messages.set(id, retained); else messages.delete(id);
          cacheChanged = true;
        }
      }
      const changed=next !== conversations || !!error || !hasLoaded || cacheChanged;
      conversations=next; error = ''; hasLoaded = true; if(changed) notify();
    } catch (cause) { if (active.token === operationSession()?.token) { error = cause instanceof Error ? cause.message : 'Chưa tải được hội thoại.'; notify(); } throw cause; } })();
    loading = task; try { await task; } finally { if (loading === task) loading = null; }
  },
  async deletePermanently(id: string, actor: ChatActor) {
    const active = assertActor(actor);
    if (actor.role !== 'CUSTOMER') throw new Error('Chỉ khách hàng được quản lý thùng rác này.');
    const conversation = conversations.find(item => item.id === id);
    if (!conversation?.customerTrashedAt) throw new Error('Chỉ được xóa vĩnh viễn hội thoại trong thùng rác.');
    await operationRequest('booking', '/conversations/' + id + '/trash', 'DELETE');
    if (active.token !== operationSession()?.token) throw new Error('Phiên đăng nhập đã thay đổi.');
    // Discard older in-flight list/message reads after the server confirms deletion.
    readEpoch++;
    messageEpoch.set(id, (messageEpoch.get(id) || 0) + 1);
    messages.delete(id); receiptThrough.delete(id);
    conversations = conversations.filter(item => item.id !== id);
    notify();
  },
  access(id: string | undefined, actor: ChatActor | null, snapshot: readonly Conversation[] = conversations): ChatAccessResult {
    if (!actor) return { kind: 'UNAUTHENTICATED', reason: 'Vui lòng đăng nhập.' };
    try { assertActor(actor); } catch { return { kind: 'FORBIDDEN', reason: 'Tài khoản không khớp hội thoại.' }; }
    const conversation = snapshot.find(c => c.id === id) as LiveConversation | undefined;
    if (!conversation) return { kind: 'NOT_FOUND', reason: error || 'Đang tải hoặc hội thoại không thuộc tài khoản này.' };
    return { kind: 'READY', conversation, bookingCode: conversation.bookingCode, phase: conversation.conversationStatus === 'CLOSED' ? 'CLOSED' : getChatBookingPhase(conversation.bookingStatus) };
  },
  resolveForBooking(id: string | undefined, actor: ChatActor | null, staffId?: string, snapshot: readonly Conversation[] = conversations) { const found = snapshot.find(c => c.bookingId === id && (!staffId || c.staffId === staffId)); return this.access(found?.id, actor, snapshot); },
  getMessages(id: string, actor: ChatActor) { if (this.access(id, actor).kind !== 'READY') throw new Error('Bạn không có quyền đọc hội thoại.'); return messages.get(id) || emptyMessages; },
  async load(id: string, actor: ChatActor, signal?: AbortSignal) {
    const active = assertActor(actor); const access = this.access(id, actor); if (access.kind !== 'READY') throw new Error(access.reason);
    const epoch = (messageEpoch.get(id) || 0) + 1;
    messageEpoch.set(id, epoch);
    const data = await operationRequest<Record<string, unknown>[]>('booking', '/conversations/' + id + '/messages', 'GET', undefined, signal);
    const list: ChatMessage[] = data.map(item => ({ ...item, id: String(item.id), conversationId: String(item.conversationId), senderId: item.senderId == null ? '' : String(item.senderId), senderName: item.senderType === 'SYSTEM' ? 'Hệ thống' : item.senderType === 'STAFF' ? access.conversation.staffName : access.conversation.customerName, senderAvatar: item.senderType === 'STAFF' ? access.conversation.staffAvatar : access.conversation.customerAvatar } as ChatMessage));
    if (active.token !== operationSession()?.token || signal?.aborted) return emptyMessages;
    if (messageEpoch.get(id) !== epoch) return messages.get(id) || emptyMessages;
    const previous = messages.get(id) || emptyMessages;
    const byId = new Map(previous.map(item => [item.id, item]));
    const next = reuseSnapshot(previous, list.map(item => reuseSnapshot(byId.get(item.id), item)!));
    if (next !== previous) { messages.set(id, next); notify(); }
    const throughMessageId = list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
    if (!receiptsInFlight.has(id) && list.some(item => item.senderType !== actor.role && !item.isRead && Number(item.id) > (receiptThrough.get(id) || 0))) {
      const receipt = (async () => { try {
      const result = await operationRequest<{ unreadCount: number }>('booking', '/conversations/' + id + '/read', 'PATCH', { throughMessageId }, signal);
      if (active.token === operationSession()?.token && !signal?.aborted) {
        receiptThrough.set(id, Math.max(receiptThrough.get(id) || 0, throughMessageId));
        readEpoch++;
        const field = actor.role === 'CUSTOMER' ? 'unreadCountCustomer' : 'unreadCountStaff';
        const updated = reuseSnapshot(conversations, conversations.map(item => item.id !== id ? item : { ...item, [field]: result.unreadCount }));
        if (updated !== conversations) { conversations = updated; notify(); }
      }
      } catch { /* Reading succeeded; retry the receipt on the next focused poll. */ } })();
      receiptsInFlight.set(id, receipt);
      void receipt.finally(() => { if (receiptsInFlight.get(id) === receipt) receiptsInFlight.delete(id); });
    }
    return messages.get(id) || next;
  },
  async send(id: string, actor: ChatActor, content: string, key: string, signal?: AbortSignal) {
    const active = assertActor(actor);
    if (this.access(id, actor).kind !== 'READY') throw new Error('Bạn không có quyền gửi tin trong hội thoại.');
    const saved = await operationRequest<{ id: number | string }>('booking', '/conversations/' + id + '/messages', 'POST', { content, clientKey: key }, signal);
    if (active.token !== operationSession()?.token) throw new Error('Phiên đăng nhập đã thay đổi.');
    if (!saved?.id) throw new Error('Backend chưa xác nhận lưu tin nhắn.');
    // The POST commits before returning its database ID. Refresh failure cannot undo that success.
    messageEpoch.set(id, (messageEpoch.get(id) || 0) + 1);
    readEpoch++;
    const previous = messages.get(id) || emptyMessages;
    if (!previous.some(item => item.id === String(saved.id))) {
      messages.set(id, [...previous, { ...createChatDraft(id, actor, content), id: String(saved.id), clientKey: key }]);
      conversations = conversations.map(item => item.id !== id ? item : { ...item, lastMessage: content, lastMessageTime: new Date().toISOString() });
      notify();
    }
    void this.loadList(actor).catch(() => {});
    return String(saved.id);
  },
};
