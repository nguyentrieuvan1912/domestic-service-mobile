import { operationRequest, operationSession, subscribeSession } from '@/api/operations';
import type { User } from '@/types/user';
import type { ChatMessage, Conversation } from '@/types/chat';
import type { ChatActor } from './chatPolicy';
import { getChatBookingPhase } from './chatPolicy';
import type { ChatAccessResult } from './chatRepository';
type LiveConversation = Conversation & { bookingStatus: string; conversationStatus: string; bookingCode: string };
let conversations: LiveConversation[] = [], owner = '', error = '', loading: Promise<void> | null = null;
let readEpoch = 0;
let watcher: { token: string; count: number; timer: ReturnType<typeof setInterval> } | undefined;
const messages = new Map<string, ChatMessage[]>(), listeners = new Set<() => void>();
function notify() { listeners.forEach(listener => { try { listener(); } catch { /* Role-scoped subscribers can unmount during logout. */ } }); }
subscribeSession(() => { const active = operationSession(), id = active?.userId || ''; if (id !== owner) { owner = id; conversations = []; messages.clear(); error = ''; loading = null; notify(); } });
function assertActor(actor: ChatActor | null) { const session = operationSession(); if (!actor || !session || actor.userId !== session.userId || actor.participantId !== session.userId || actor.role !== session.profile.role) throw new Error('Vui lòng đăng nhập đúng tài khoản tham gia hội thoại.'); return session; }
export function getChatActor(user: User | null): ChatActor | null { return user && ['STAFF', 'CUSTOMER'].includes(user.role) ? { userId: user.id, participantId: user.id, role: user.role as ChatActor['role'], name: user.fullName, avatar: user.avatar } : null; }
export function createChatDraft(conversationId: string, actor: ChatActor, content: string): ChatMessage { return { id: 'message-' + Date.now() + '-' + Math.random().toString(36).slice(2), conversationId, senderId: actor.userId, senderType: actor.role, senderName: actor.name, senderAvatar: actor.avatar, contentType: 'TEXT', content, isRead: false, sentAt: new Date().toISOString() }; }
export const ChatRepository = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  list() { return conversations; },
  watch(actor: ChatActor, visible: () => boolean) {
    const active = assertActor(actor);
    const refresh = () => { if (visible()) void this.loadList(actor).catch(() => {}); };
    if (watcher?.token !== active.token) {
      if (watcher) clearInterval(watcher.timer);
      watcher = { token: active.token, count: 0, timer: setInterval(refresh, 4000) };
    }
    const resource = watcher; resource.count++; refresh();
    return () => { resource.count--; if (!resource.count) { clearInterval(resource.timer); if (watcher === resource) watcher = undefined; } };
  },
  async loadList(actor: ChatActor | null) {
    const active = assertActor(actor); if (loading) return loading;
    const epoch = readEpoch;
    const task = (async () => { try {
      const data = await operationRequest<Record<string, unknown>[]>('booking', '/conversations');
      if (active.token !== operationSession()?.token || epoch !== readEpoch) return;
      conversations = data.map(item => ({ ...item, id: String(item.id), bookingId: String(item.bookingId), customerId: String(item.customerId), staffId: String(item.staffId) } as LiveConversation)); error = ''; notify();
    } catch (cause) { if (active.token === operationSession()?.token) { error = cause instanceof Error ? cause.message : 'Chưa tải được hội thoại.'; notify(); } throw cause; } })();
    loading = task; try { await task; } finally { if (loading === task) loading = null; }
  },
  access(id: string | undefined, actor: ChatActor | null): ChatAccessResult {
    if (!actor) return { kind: 'UNAUTHENTICATED', reason: 'Vui lòng đăng nhập.' };
    try { assertActor(actor); } catch { return { kind: 'FORBIDDEN', reason: 'Tài khoản không khớp hội thoại.' }; }
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) return { kind: 'NOT_FOUND', reason: error || 'Đang tải hoặc hội thoại không thuộc tài khoản này.' };
    return { kind: 'READY', conversation, bookingCode: conversation.bookingCode, phase: conversation.conversationStatus === 'CLOSED' ? 'CLOSED' : getChatBookingPhase(conversation.bookingStatus) };
  },
  resolveForBooking(id: string | undefined, actor: ChatActor | null, staffId?: string) { const found = conversations.find(c => c.bookingId === id && (!staffId || c.staffId === staffId)); return this.access(found?.id, actor); },
  getMessages(id: string, actor: ChatActor) { if (this.access(id, actor).kind !== 'READY') throw new Error('Bạn không có quyền đọc hội thoại.'); return messages.get(id) || []; },
  async load(id: string, actor: ChatActor, signal?: AbortSignal) {
    const active = assertActor(actor); const access = this.access(id, actor); if (access.kind !== 'READY') throw new Error(access.reason);
    const data = await operationRequest<Record<string, unknown>[]>('booking', '/conversations/' + id + '/messages', 'GET', undefined, signal);
    const list: ChatMessage[] = data.map(item => ({ ...item, id: String(item.id), conversationId: String(item.conversationId), senderId: item.senderId == null ? '' : String(item.senderId), senderName: item.senderType === 'SYSTEM' ? 'Hệ thống' : item.senderType === 'STAFF' ? access.conversation.staffName : access.conversation.customerName, senderAvatar: item.senderType === 'STAFF' ? access.conversation.staffAvatar : access.conversation.customerAvatar } as ChatMessage));
    if (active.token !== operationSession()?.token || signal?.aborted) return [];
    messages.set(id, list); notify();
    const throughMessageId = list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
    if (throughMessageId) {
      const result = await operationRequest<{ unreadCount: number }>('booking', '/conversations/' + id + '/read', 'PATCH', { throughMessageId }, signal);
      if (active.token === operationSession()?.token && !signal?.aborted) {
        readEpoch++;
        conversations = conversations.map(item => item.id !== id ? item : { ...item, [actor.role === 'CUSTOMER' ? 'unreadCountCustomer' : 'unreadCountStaff']: result.unreadCount });
        notify();
      }
    }
    return list;
  },
  async send(id: string, actor: ChatActor, content: string, key: string, signal?: AbortSignal) { assertActor(actor); await operationRequest('booking', '/conversations/' + id + '/messages', 'POST', { content, clientKey: key }, signal); await this.load(id, actor, signal); await this.loadList(actor); },
};
