import { useCallback, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { CustomerBookings } from '@/data/connectedBookings';
export function useCustomerBookings() {
  const { currentCustomer, accessToken } = useAuth();
  const bookings = useSyncExternalStore(CustomerBookings.subscribe, CustomerBookings.list, CustomerBookings.list);
  const loaded = useSyncExternalStore(CustomerBookings.subscribe, CustomerBookings.getLoaded, CustomerBookings.getLoaded);
  const [failure, setFailure] = useState<{ token: string; message: string }>();
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(useCallback(() => {
    if (!currentCustomer || !accessToken) return;
    const controller = new AbortController();
    let inFlight = false;
    const load = async () => {
      if (controller.signal.aborted || inFlight || AppState.currentState === 'background') return;
      inFlight = true;
      try {
        await CustomerBookings.load(controller.signal);
        if (!controller.signal.aborted) setFailure(undefined);
      } catch (cause) {
        if (!controller.signal.aborted && !CustomerBookings.getLoaded()) {
          setFailure({ token: accessToken, message: cause instanceof Error ? cause.message : 'Chưa tải được đơn.' });
        }
      }
      finally { inFlight = false; }
    };
    void load(); const timer = setInterval(() => void load(), 5000);
    const listener = AppState.addEventListener('change', state => { if(state === 'active') void load(); });
    return () => { controller.abort(); clearInterval(timer); listener.remove(); };
  }, [currentCustomer?.id, accessToken, attempt]));
  const error = !loaded && failure?.token === accessToken ? failure?.message || '' : '';
  return {
    bookings: currentCustomer ? bookings : [],
    loading: !!currentCustomer && !loaded && !error,
    error,
    retry: () => { setFailure(undefined); setAttempt(value => value + 1); },
  };
}
