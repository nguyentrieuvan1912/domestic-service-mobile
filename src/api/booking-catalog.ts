import { catalogGet } from './catalog';
import type { CatalogDetail, CatalogPage } from './catalog-types';
import type { Promotion } from '../types/service';

export async function loadBookingCatalog(signal: AbortSignal) {
  const [first, promotions] = await Promise.all([
    catalogGet<CatalogPage>('/services?size=100', signal),
    catalogGet<Promotion[]>('/promotions', signal),
  ]);
  const services = [...first.items];
  for (let page = 1; page < first.totalPages; page++) {
    services.push(...(await catalogGet<CatalogPage>('/services?size=100&page=' + page, signal)).items);
  }
  const details: CatalogDetail[] = [];
  // Avoid filling the native HTTP queue with every service at once.
  for (let offset = 0; offset < services.length; offset += 4) {
    if (signal.aborted) throw new Error('Đã hủy tải dịch vụ.');
    details.push(...await Promise.all(services.slice(offset, offset + 4)
      .map(service => catalogGet<CatalogDetail>('/services/' + service.id, signal))));
  }
  return { details, promotions };
}
