import { useEffect, useState } from 'react';
import { catalogGet } from '@/api/catalog';

export function useCatalogResource<T>(path: string) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ key: string; data: T | null; loading: boolean; error: string }>({ key: '', data: null, loading: true, error: '' });
  const key = `${path}:${attempt}`;
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 12000);
    catalogGet<T>(path, controller.signal).then(
      data => { if (active) setState({ key, data, loading: false, error: '' }); },
      error => { if (active) setState({ key, data: null, loading: false, error: controller.signal.aborted ? 'Tải dịch vụ quá lâu. Vui lòng thử lại.' : error instanceof Error ? error.message : 'Chưa tải được dịch vụ. Vui lòng thử lại.' }); },
    ).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [key, path]);
  return { ...(state.key === key ? state : { data: null, loading: true, error: '' }), retry: () => setAttempt(value => value + 1) };
}
