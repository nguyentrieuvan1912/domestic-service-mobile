import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getCapabilityActor } from '@/data/staffCapabilityAdapter';
import { StaffRepository } from '@/data/staffRepository';
import { StaffMatchingRepository } from '@/data/staffMatchingRepository';

export function useStaffMatching() {
  const { currentUser, currentStaff } = useAuth();
  const actor = useMemo(() => getCapabilityActor(currentUser, currentStaff), [currentUser, currentStaff]);
  const key = actor ? `${actor.userId}:${actor.staffId}` : '';
  const [attempt, setAttempt] = useState(0);
  const [clock, setClock] = useState(Date.now);
  const subscribe = useCallback((listener: () => void) => StaffRepository.subscribe(() => { setClock(Date.now()); listener(); }), []);
  const revision = useSyncExternalStore(subscribe, StaffRepository.getStoreRevision, StaffRepository.getStoreRevision);
  const [state, setState] = useState<{ key: string; status: 'LOADING' | 'READY' | 'ERROR'; error?: string }>({ key: '', status: 'LOADING' });
  const query = useMemo(() => ({ actor, key, attempt }), [actor, key, attempt]);
  useFocusEffect(useCallback(() => {
    if (!query.actor) return;
    const controller = new AbortController();
    const timer = setInterval(() => setClock(Date.now()), 30000); // Local expiry/clock refresh; no push subscription.
    void StaffMatchingRepository.load(query.actor, controller.signal).then(() => {
      if (!controller.signal.aborted) { setClock(Date.now()); setState({ key: query.key, status: 'READY' }); }
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ key: query.key, status: 'ERROR', error: error instanceof Error ? error.message : 'Chưa tải được việc phù hợp.' });
    });
    return () => { controller.abort(); clearInterval(timer); };
  }, [query]));
  const scoped = state.key === key ? state : { key, status: 'LOADING' as const };
  const data = useMemo(() => actor && scoped.status === 'READY'
    ? { ...StaffMatchingRepository.read(actor, clock), revision } : undefined, [actor, scoped.status, clock, revision]);
  const retry = () => { setState({ key, status: 'LOADING' }); setAttempt(value => value + 1); };
  return { actor, ...scoped, data, retry };
}
