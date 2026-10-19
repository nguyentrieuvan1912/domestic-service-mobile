import { AppState } from 'react-native';
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getCapabilityActor } from '@/data/staffCapabilityAdapter';
import { StaffRepository } from '@/data/connectedStaffRepository';
import { StaffMatchingRepository } from '@/data/connectedStaffRepository';

export function useStaffMatching() {
  const { currentUser, currentStaff } = useAuth();
  const actor = useMemo(() => getCapabilityActor(currentUser, currentStaff), [currentUser, currentStaff]);
  const key = actor ? `${actor.userId}:${actor.staffId}` : '';
  const [attempt, setAttempt] = useState(0);
  const revision = useSyncExternalStore(StaffRepository.subscribe, StaffRepository.getStoreRevision, StaffRepository.getStoreRevision);
  const [state, setState] = useState<{ key: string; status: 'LOADING' | 'READY' | 'ERROR'; error?: string }>({ key: '', status: 'LOADING' });
  const query = useMemo(() => ({ actor, key, attempt }), [actor, key, attempt]);
  useFocusEffect(useCallback(() => {
    if (!query.actor) return;
    const controller = new AbortController();
    let ready=false;
    const refresh = () => { if (ready && !controller.signal.aborted && AppState.currentState === 'active') void StaffMatchingRepository.refresh(query.actor!, controller.signal).catch(() => {}); };
    const timer = setInterval(refresh, 5000);
    const foreground = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    void StaffMatchingRepository.load(query.actor, controller.signal).then(() => {
      if (!controller.signal.aborted) { ready=true; setState({ key: query.key, status: 'READY' }); }
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ key: query.key, status: 'ERROR', error: error instanceof Error ? error.message : 'Chưa tải được việc phù hợp.' });
    });
    return () => { controller.abort(); clearInterval(timer); foreground.remove(); };
  }, [query]));
  const scoped = state.key === key ? state : { key, status: 'LOADING' as const };
  const data = useMemo(() => actor && scoped.status === 'READY'
    ? { ...StaffMatchingRepository.read(actor), revision } : undefined, [actor, scoped.status, revision]);
  const retry = () => { setState({ key, status: 'LOADING' }); setAttempt(value => value + 1); };
  return { actor, ...scoped, data, retry };
}
