import { useEffect, useState } from 'react';
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
  const views = state.details.map(catalogDetailView);
  return { ...state, services: views.map(v => v.service), packages: views.flatMap(v => v.packages), addOns: views.flatMap(v => v.addOns), resolveId: (id?: string) => state.details.find(d => String(d.service.id) === id || catalogTemplate(d.service)?.id === id)?.service.id.toString(), retry: () => setAttempt(x => x + 1) };
}
