import { useCallback, useEffect, useReducer, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { CustomerBookings } from '@/data/connectedBookings';
export function useCustomerBookings() {
  const { currentCustomer } = useAuth(), [, refresh] = useReducer(value => value + 1, 0);
  const [error, setError] = useState(''), [loading, setLoading] = useState(true), [attempt, setAttempt] = useState(0);
  useEffect(() => CustomerBookings.subscribe(refresh), []);
  useFocusEffect(useCallback(() => { let active = true; setLoading(true); const load = () => { void CustomerBookings.load().then(() => { if (active) { setLoading(false); setError(''); } }).catch(cause => { if (active) { setLoading(false); setError(cause.message); } }); }; load(); const timer = setInterval(load, 5000); return () => { active = false; clearInterval(timer); }; }, [currentCustomer?.id, attempt]));
  return { bookings: currentCustomer ? CustomerBookings.list() : [], loading: !!currentCustomer && loading, error, retry: () => setAttempt(value => value + 1) };
}
