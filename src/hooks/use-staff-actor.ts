import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getCapabilityActor } from '@/data/staffCapabilityAdapter';

/** Profile edits must not restart reads or discard a schedule draft for the same session. */
export function useStaffActor() {
  const { currentUser, currentStaff, accessToken } = useAuth();
  const candidate = getCapabilityActor(currentUser, currentStaff);
  const userId = candidate?.userId, staffId = candidate?.staffId;
  return useMemo(() => userId && staffId ? { userId, staffId } : null, [userId, staffId, accessToken]);
}
