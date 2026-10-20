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
class OperationError extends Error {
  readRetried = false;
  constructor(message: string, readonly retryable = false) { super(message); }
}
function retryDelay(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const cancel = () => { clearTimeout(timer); signal?.removeEventListener('abort', cancel); reject(new Error('Đã hủy thao tác.')); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve(); }, 500);
    signal?.addEventListener('abort', cancel, { once: true });
    if (signal?.aborted) cancel();
  });
}
export async function operationRequest<T>(service: string, path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const active = session;
  if (!active) throw new Error('Vui lòng đăng nhập lại.');
  if (!API_BASE_URL) throw new Error('Chưa cấu hình địa chỉ backend.');
  const execute = async (): Promise<T> => {
    if (active.token !== session?.token) throw new Error('Phiên đăng nhập đã thay đổi.');
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timeout = setTimeout(abort, 20000);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/${service}${path}`, { method, headers: { Authorization: `Bearer ${active.token}`, 'Content-Type': 'application/json' }, signal: controller.signal, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      if (!response.ok) {
        if (response.status === 401 && session?.token === active.token) { connectOperationsSession(null, null); invalidated?.(); }
        const error = await response.json().catch(() => null);
        throw new OperationError(error?.detail || 'Chưa xử lý được yêu cầu.', [502, 503, 504].includes(response.status));
      }
      // Keep the deadline and account guard active until the complete body has arrived.
      const result = response.status === 204 ? undefined as T : await response.json() as T;
      if (active.token !== session?.token) throw new Error('Phiên đăng nhập đã thay đổi.');
      if (controller.signal.aborted) throw new Error('Đã hủy thao tác.');
      return result;
    } catch (error) {
      if (controller.signal.aborted) throw new OperationError(signal?.aborted ? 'Đã hủy thao tác.' : 'Kết nối quá lâu. Vui lòng thử lại.', !signal?.aborted);
      if (error instanceof TypeError) throw new OperationError('Không kết nối được backend. Vui lòng thử lại.', true);
      throw error;
    } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
  };
  try { return await execute(); }
  catch (error) {
    // Never replay booking creation, cancellation, messages, payments or other mutations.
    if (method !== 'GET' || !(error instanceof OperationError) || !error.retryable || signal?.aborted || active.token !== session?.token) throw error;
    await retryDelay(signal);
    try { return await execute(); }
    catch (lastError) { if (lastError instanceof OperationError) lastError.readRetried = true; throw lastError; }
  }
}
