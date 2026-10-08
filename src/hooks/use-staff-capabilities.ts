import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getCapabilityActor } from '@/data/staffCapabilityAdapter';
import { StaffCapabilityRepository } from '@/data/staffCapabilityRepository';
import type { StaffCapabilitySnapshot } from '@/types/staff-capability';

type CapabilityLoadState = { key: string; status: 'LOADING' | 'ERROR' | 'READY'; data?: StaffCapabilitySnapshot; error?: string };
export function useStaffCapabilities() {
  const { currentUser, currentStaff } = useAuth();
  const actor = useMemo(() => getCapabilityActor(currentUser, currentStaff), [currentUser, currentStaff]);
  const key = actor ? actor.userId + ':' + actor.staffId : '';
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<CapabilityLoadState>({ key: '', status: 'LOADING' });
  const query = useMemo(() => ({ actor, key, attempt }), [actor, key, attempt]);
  useFocusEffect(useCallback(() => {
    if (!query.actor) return;
    const controller = new AbortController();
    void StaffCapabilityRepository.load(query.actor, controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ key: query.key, status: 'READY', data });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ key: query.key, status: 'ERROR', error: error instanceof Error ? error.message : 'Chưa tải được năng lực.' });
    });
    return () => controller.abort();
  }, [query]));
  const retry = () => { setState({ key, status: 'LOADING' }); setAttempt((value) => value + 1); };
  const scopedState = state.key === key ? state : { key, status: 'LOADING' as const };
  return { actor, ...scopedState, retry };
}
