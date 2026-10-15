import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { identityRequest } from '@/api/identity';
import type { CustomerAddress } from '@/types/user';

export function useCustomerAddresses() {
  const { currentCustomer, accessToken, refreshProfile } = useAuth();
  const owner = currentCustomer?.id;
  const [state, setState] = useState<{ owner?: string; data: CustomerAddress[]; loading: boolean; error: string }>({
    data: [],
    loading: true,
    error: '',
  });

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchAddresses = useCallback(async (): Promise<CustomerAddress[]> => {
    if (!owner || !accessToken) {
      if (isMountedRef.current) {
        setState({ owner, data: [], loading: false, error: '' });
      }
      return [];
    }

    if (isMountedRef.current) {
      setState(prev => ({ ...prev, loading: true, error: '' }));
    }

    try {
      const data = await identityRequest<any>(
        '/customer/addresses',
        undefined,
        accessToken,
        'GET'
      );

      const rawList = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && Array.isArray(data.data)
        ? data.data
        : data && typeof data === 'object' && Array.isArray(data.addresses)
        ? data.addresses
        : [];

      const list: CustomerAddress[] = rawList.map((item: any) => ({
        ...item,
        id: String(item.id),
        customerId: String(item.customerId || owner),
      }));

      if (isMountedRef.current) {
        setState({ owner, data: list, loading: false, error: '' });
      }
      return list;
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Chưa tải được danh sách địa chỉ.',
        }));
      }
      return [];
    }
  }, [owner, accessToken]);

  // Load when owner or token changes
  useEffect(() => {
    void fetchAddresses();
  }, [fetchAddresses]);

  // Re-fetch whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      void fetchAddresses();
    }, [fetchAddresses])
  );

  const mutate = async (path: string, method: string, body?: object) => {
    if (!owner || !accessToken) throw new Error('Vui lòng đăng nhập tài khoản khách hàng.');
    const result = await identityRequest<any>(path, body, accessToken, method);
    // Reload addresses immediately so state is updated before mutate resolves
    await fetchAddresses();
    void refreshProfile().catch(() => {});
    return result;
  };

  return {
    addresses: state.owner === owner ? state.data : [],
    loading: state.owner === owner ? state.loading : !!owner,
    error: state.owner === owner ? state.error : '',
    retry: () => void fetchAddresses(),
    refresh: () => void fetchAddresses(),
    mutate,
  };
}
