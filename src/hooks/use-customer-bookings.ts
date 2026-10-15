import { useCallback, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { CustomerBookings } from '@/data/connectedBookings';
export function useCustomerBookings() {
  const { currentCustomer } = useAuth();
  const bookings = useSyncExternalStore(CustomerBookings.subscribe, CustomerBookings.list, CustomerBookings.list);
  const [error, setError] = useState(''), [loading, setLoading] = useState(true), [attempt, setAttempt] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true, inFlight = false; setLoading(true);
    const load = async () => {
      if(inFlight || AppState.currentState === 'background') return;
      inFlight = true;
      try { await CustomerBookings.load(); if(active) { setLoading(false); setError(''); } }
      catch(cause) { if(active) { setLoading(false); setError(cause instanceof Error ? cause.message : 'Chưa tải được đơn.'); } }
      finally { inFlight = false; }
    };
    void load(); const timer = setInterval(() => void load(), 5000);
    const listener = AppState.addEventListener('change', state => { if(state === 'active') void load(); });
    return () => { active = false; clearInterval(timer); listener.remove(); };
  }, [currentCustomer?.id, attempt]));
  return { bookings: currentCustomer ? bookings : [], loading: !!currentCustomer && loading, error, retry: () => setAttempt(value => value + 1) };
}
