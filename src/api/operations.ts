import { API_BASE_URL } from './catalog';
import type { IdentityProfile } from './identity';
let session: { token: string; userId: string; profile: IdentityProfile } | null = null;
const listeners = new Set<() => void>();
let invalidated: (() => void) | null = null;
export const onOperationSessionInvalidated = (callback: (() => void) | null) => { invalidated = callback; };
export function connectOperationsSession(profile: IdentityProfile | null, token: string | null) {
  session = profile && token ? { profile, token, userId: String(profile.id) } : null;
  listeners.forEach(listener => listener());
}
export const operationSession = () => session;
export const subscribeSession = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export async function operationRequest<T>(service: string, path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const active = session;
  if (!active) throw new Error('Vui lòng đăng nhập lại.');
  if (!API_BASE_URL) throw new Error('Chưa cấu hình địa chỉ backend.');
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 20000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/${service}${path}`, { method, headers: { Authorization: `Bearer ${active.token}`, 'Content-Type': 'application/json' }, signal: controller.signal, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    if (!response.ok) { if(response.status===401 && session?.token===active.token){ connectOperationsSession(null,null); invalidated?.(); } const error = await response.json().catch(() => null); throw new Error(error?.detail || 'Chưa xử lý được yêu cầu.'); }
    if (active !== session && active.token !== session?.token) throw new Error('Phiên đăng nhập đã thay đổi.');
    return response.status === 204 ? undefined as T : response.json();
  } catch (error) { if (controller.signal.aborted) throw new Error(signal?.aborted ? 'Đã hủy thao tác.' : 'Kết nối quá lâu. Vui lòng thử lại.'); if (error instanceof TypeError) throw new Error('Không kết nối được backend. Vui lòng thử lại.'); throw error; }
  finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
