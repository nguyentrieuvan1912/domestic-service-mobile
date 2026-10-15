import { identityRequest } from '@/api/identity';
import type { AppNotification } from '@/types/notification';
import { getNotificationTarget } from './notificationAdapter';
import type { NotificationActor } from './notificationAdapter';
import type { NotificationTargetResult } from './notificationRepository';

const empty: readonly AppNotification[] = Object.freeze([]);
let session: { userId: string; token: string } | null = null;
let items: readonly AppNotification[] = empty;
let revision = 0;
const listeners = new Set<() => void>();
function changed() { revision++; listeners.forEach(listener => listener()); }
export function setCustomerNotificationSession(userId: string | null, token: string | null) {
  if (session?.userId === userId && session?.token === token) return;
  session = userId && token ? { userId, token } : null;
  items = empty; changed();
}
function authenticate(actor: NotificationActor | null) {
  if (!actor || !session || session.userId !== actor.userId) throw new Error('Vui lòng đăng nhập lại để xem thông báo.');
  return session;
}
export const NotificationRepository = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  getRevision() { return revision; },
  getSnapshot(actor: NotificationActor | null): readonly AppNotification[] {
    return actor?.userId === session?.userId ? items : empty;
  },
  get(actor: NotificationActor | null, id: string): AppNotification {
    authenticate(actor);
    const value = items.find(item => item.id === id);
    if (!value) throw new Error('Không tìm thấy thông báo của bạn.');
    return value;
  },
  async load(actor: NotificationActor | null, signal?: AbortSignal) {
    const active = authenticate(actor);
    const raw = await identityRequest<(Omit<AppNotification, 'id' | 'userId' | 'referenceId'> & { id: number; userId: number; referenceId: number | null })[]>('/notifications', undefined, active.token, 'GET', signal);
    const data: AppNotification[] = raw.map(item => ({ ...item, id: String(item.id), userId: String(item.userId), referenceId: item.referenceId == null ? undefined : String(item.referenceId) }));
    if (!signal?.aborted && active === session) { items = Object.freeze(data.map(item => Object.freeze(item))); changed(); }
    return data;
  },
  async markRead(actor: NotificationActor, id?: string, signal?: AbortSignal) {
    const active = authenticate(actor);
    const result = await identityRequest<{ changed: number }>(id ? '/notifications/' + id + '/read' : '/notifications/read-all', undefined, active.token, 'PATCH', signal);
    if (!signal?.aborted && active === session) {
      items = Object.freeze(items.map(item => !id || item.id === id ? Object.freeze({ ...item, isRead: true }) : item));
      changed();
    }
    return result.changed;
  },
  resolveTarget(actor: NotificationActor | null, id: string): NotificationTargetResult {
    try { this.get(actor, id); }
    catch (error) { return { kind: 'FORBIDDEN', reason: error instanceof Error ? error.message : 'Không thể mở thông báo.' }; }
    const item=this.get(actor,id);
    if (item.type === 'CHAT_MESSAGE' && /^\d+$/.test(String(item.data?.conversationId))) return { kind: 'AVAILABLE', actionLabel: 'Mở cuộc trò chuyện', destination: { pathname: '/chat/[id]', params: { id: String(item.data!.conversationId) } } };
    if(actor?.role==='STAFF' && item.type==='INCOME_UPDATE')return {kind:'AVAILABLE',actionLabel:'Xem ví thu nhập',destination:{pathname:'/staff/wallet'}};const target=getNotificationTarget(item);
    if(target && /^\d+$/.test(String(target.id)) && ['BOOKING','INVITATION','OPPORTUNITY'].includes(target.type)) return {kind:'AVAILABLE',actionLabel:'Xem đơn dịch vụ',destination:{pathname:actor?.role==='STAFF'?'/staff/job-detail':'/booking/[id]',params:{id:String(target.id)}}};
    return {kind:'DETAIL_ONLY',reason:'Thông tin cập nhật từ hệ thống. Xem chi tiết tài chính tại ví hoặc màn hình liên quan.'};
  },
};
