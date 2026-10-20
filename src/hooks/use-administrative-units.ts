import { useEffect, useState } from 'react';
import { AdministrativeDirectory, loadHcmAdministrativeUnits } from '@/api/administrative-units';

export function useAdministrativeUnits() {
  const [directory, setDirectory] = useState<AdministrativeDirectory | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true);
    void loadHcmAdministrativeUnits().then(data => { if (active) { setDirectory(data); setError(''); } })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Chưa tải được danh sách phường/xã.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  return { units: directory?.items || [], loading, error, retry: () => setAttempt(value => value + 1) };
}
