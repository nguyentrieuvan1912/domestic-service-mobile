import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { identityRequest } from '@/api/identity';
import type { CustomerAddress } from '@/types/user';

export function useCustomerAddresses() {
  const { currentCustomer, accessToken, refreshProfile } = useAuth();
  const owner = currentCustomer?.id;
  const [state, setState] = useState<{ owner?: string; data: CustomerAddress[]; loading: boolean; error: string }>({ data: [], loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    if (!owner || !accessToken) { setState({ owner, data: [], loading: false, error: '' }); return; }
    setState({ owner, data: [], loading: true, error: '' });
    void identityRequest<(Omit<CustomerAddress, 'id' | 'customerId'> & { id: number; customerId: number })[]>('/customer/addresses', undefined, accessToken, 'GET', controller.signal)
      .then(data => { if (!controller.signal.aborted) setState({ owner, data: data.map(item => ({ ...item, id: String(item.id), customerId: String(item.customerId) })), loading: false, error: '' }); })
      .catch(error => { if (!controller.signal.aborted) setState({ owner, data: [], loading: false, error: error.message }); });
    return () => controller.abort();
  }, [owner, accessToken, attempt]));
  const mutate = async (path: string, method: string, body?: object) => {
    if (!owner || !accessToken) throw new Error('Vui lòng đăng nhập tài khoản khách hàng.');
    await identityRequest(path, body, accessToken, method);
    setAttempt(value => value + 1);
    // An address has already been committed even if refreshing profile fails.
    void refreshProfile().catch(() => {});
  };
  return { addresses: state.owner === owner ? state.data : [], loading: state.owner === owner ? state.loading : !!owner,
    error: state.owner === owner ? state.error : '', retry: () => setAttempt(value => value + 1), mutate };
}
