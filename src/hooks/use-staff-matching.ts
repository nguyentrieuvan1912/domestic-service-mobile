import { AppState } from 'react-native';
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { useStaffActor } from '@/hooks/use-staff-actor';
import { StaffRepository } from '@/data/connectedStaffRepository';
import { StaffMatchingRepository } from '@/data/connectedStaffRepository';

export function useStaffMatching() {
  const actor = useStaffActor();
  const key = actor ? `${actor.userId}:${actor.staffId}` : '';
  const [attempt, setAttempt] = useState(0);
  const revision = useSyncExternalStore(StaffRepository.subscribe, StaffRepository.getStoreRevision, StaffRepository.getStoreRevision);
  const [failure, setFailure] = useState<{ key: string; status: 'ERROR'; error: string }>();
  const query = useMemo(() => ({ actor, key, attempt }), [actor, key, attempt]);
  useFocusEffect(useCallback(() => {
    if (!query.actor) return;
    const activeActor = query.actor;
    const controller = new AbortController();
    let inFlight = false;
    const refresh = async () => {
      if (inFlight || controller.signal.aborted || AppState.currentState !== 'active') return;
      inFlight = true;
      try {
        await (StaffRepository.getLoadState().loaded
          ? StaffMatchingRepository.refresh(activeActor, controller.signal)
          : StaffMatchingRepository.load(activeActor, controller.signal));
      } catch (error) {
        if (!controller.signal.aborted && !StaffRepository.getLoadState().loaded) setFailure({ key: query.key, status: 'ERROR', error: error instanceof Error ? error.message : 'Chưa tải được việc phù hợp.' });
      } finally { inFlight = false; }
    };
    const timer = setInterval(() => void refresh(), 5000);
    const foreground = AppState.addEventListener('change', next => { if (next === 'active') void refresh(); });
    void refresh();
    return () => { controller.abort(); clearInterval(timer); foreground.remove(); };
  }, [query]));
  const scoped = actor && StaffRepository.getLoadState().loaded
    ? { key, status: 'READY' as const, error: undefined }
    : failure?.key === key ? failure : { key, status: 'LOADING' as const, error: undefined };
  const data = useMemo(() => actor && scoped.status === 'READY'
    ? { ...StaffMatchingRepository.read(actor), revision } : undefined, [actor, scoped.status, revision]);
  const retry = () => { setFailure(undefined); setAttempt(value => value + 1); };
  return { actor, ...scoped, data, retry };
}
