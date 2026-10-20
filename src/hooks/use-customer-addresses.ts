import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { identityRequest } from '@/api/identity';
import type { CustomerAddress } from '@/types/user';

export function useCustomerAddresses() {
  const { currentCustomer, accessToken, refreshProfile } = useAuth();
  const owner = currentCustomer?.id;
  const scope = `${owner || ''}:${accessToken || ''}`;
  const currentScope = useRef(scope); currentScope.current = scope;
  const mounted = useRef(true), generation = useRef(0);
  const pending = useRef<{ scope: string; controller: AbortController; task: Promise<CustomerAddress[]> } | null>(null);
  const [state, setState] = useState<{ scope: string; data: CustomerAddress[]; loaded: boolean; loading: boolean; error: string; refreshError: string }>({
    scope: '', data: [], loaded: false, loading: true, error: '', refreshError: '',
  });
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; pending.current?.controller.abort(); };
  }, []);

  const fetchAddresses = useCallback((force = false): Promise<CustomerAddress[]> => {
    if (!force && pending.current?.scope === scope && !pending.current.controller.signal.aborted) return pending.current.task;
    pending.current?.controller.abort();
    const controller = new AbortController(), request = ++generation.current;
    const valid = () => mounted.current && currentScope.current === scope && request === generation.current && !controller.signal.aborted;
    const task = (async () => {
      if (!owner || !accessToken) {
        if (valid()) setState({ scope, data: [], loaded: true, loading: false, error: '', refreshError: '' });
        return [];
      }
      // Keep the booking mounted while checking previously loaded addresses.
      setState(previous => previous.scope === scope && previous.loaded
        ? { ...previous, error: '', refreshError: '' }
        : { scope, data: [], loaded: false, loading: true, error: '', refreshError: '' });
      try {
        const data = await identityRequest<any>('/customer/addresses', undefined, accessToken, 'GET', controller.signal);
        const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.addresses) ? data.addresses : null;
        if (!raw) throw new Error('Danh sách địa chỉ trả về không hợp lệ. Vui lòng thử lại.');
        const list: CustomerAddress[] = raw.map((item: any) => ({ ...item, id: String(item.id), customerId: String(item.customerId || owner) }));
        if (valid()) setState({ scope, data: list, loaded: true, loading: false, error: '', refreshError: '' });
        return valid() ? list : [];
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Chưa tải được danh sách địa chỉ.';
        if (valid()) setState(previous => previous.scope === scope && previous.loaded
          ? { ...previous, loading: false, refreshError: message }
          : { scope, data: [], loaded: false, loading: false, error: message, refreshError: '' });
        return [];
      }
    })();
    pending.current = { scope, controller, task };
    void task.finally(() => { if (pending.current?.task === task) pending.current = null; });
    return task;
  }, [owner, accessToken, scope]);

  useFocusEffect(useCallback(() => {
    void fetchAddresses();
    let previous = AppState.currentState;
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active' && previous !== 'active') void fetchAddresses();
      else if (next !== 'active') pending.current?.controller.abort();
      previous = next;
    });
    return () => { subscription.remove(); pending.current?.controller.abort(); };
  }, [fetchAddresses]));

  const mutate = async (path: string, method: string, body?: object) => {
    if (!owner || !accessToken) throw new Error('Vui lòng đăng nhập tài khoản khách hàng.');
    const result = await identityRequest<any>(path, body, accessToken, method);
    await fetchAddresses(true);
    void refreshProfile().catch(() => {});
    return result;
  };
  return {
    addresses: state.scope === scope ? state.data : [],
    loading: state.scope === scope ? state.loading : !!owner,
    error: state.scope === scope ? state.error : '',
    refreshError: state.scope === scope ? state.refreshError : '',
    retry: () => void fetchAddresses(), refresh: () => void fetchAddresses(), mutate,
  };
}
