import { useCallback, useEffect, useMemo, useState } from 'react';
import { catalogGet } from '@/api/catalog';
import { catalogDetailView, catalogTemplate } from '@/api/catalog-view';
import type { CatalogDetail, CatalogPage } from '@/api/catalog-types';
import type { Promotion } from '@/types/service';
export function useBookingCatalog() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ details: CatalogDetail[]; promotions: Promotion[]; loading: boolean; error: string }>({ details: [], promotions: [], loading: true, error: '' });
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const [first, promotions] = await Promise.all([catalogGet<CatalogPage>('/services?size=100', controller.signal), catalogGet<Promotion[]>('/promotions', controller.signal)]);
        const pages = await Promise.all(Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) => catalogGet<CatalogPage>('/services?size=100&page=' + (i + 1), controller.signal)));
        const details = await Promise.all([...first.items, ...pages.flatMap(p => p.items)].map(s => catalogGet<CatalogDetail>('/services/' + s.id, controller.signal)));
        if (!controller.signal.aborted) setState({ details, promotions, loading: false, error: '' });
      } catch (error) { if (!controller.signal.aborted) setState({ details: [], promotions: [], loading: false, error: error instanceof Error ? error.message : 'Chưa tải được dịch vụ.' }); }
    };
    void load(); return () => controller.abort();
  }, [attempt]);
  // Keep derived references stable across parent refreshes so package/extras
  // calculations can keep their memoized results.
  const views = useMemo(() => {
    const details=state.details.map(catalogDetailView);
    return { services: details.map(v => v.service), packages: details.flatMap(v => v.packages), addOns: details.flatMap(v => v.addOns) };
  }, [state.details]);
  const resolveId=useCallback((id?: string) => state.details.find(d => String(d.service.id) === id || catalogTemplate(d.service)?.id === id)?.service.id.toString(), [state.details]);
  const retry=useCallback(() => setAttempt(x => x + 1), []);
  return { ...state, ...views, resolveId, retry };
}
