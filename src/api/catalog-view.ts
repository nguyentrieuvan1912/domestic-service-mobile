import { AddOn, Service, ServiceCategory, ServicePackage } from '@/types/service';
import { CatalogDetail } from './catalog-types';
import { catalogUnit } from './catalog';
import type { DynamicFieldType } from '@/types/service';

const presentation = (item: import('./catalog-types').CatalogService) => {
  const types=['CLEANING_HOURLY','CLEANING_DEEP','AC_CLEANING','AC_MAINTENANCE','WASHING_MACHINE','CHILD_CARE','ELDERLY_CARE','PET_CARE','COOKING'];
  const type=types.includes(item.serviceType)?item.serviceType:types.includes(item.categoryCode)?item.categoryCode:'GENERAL';
  return {dynamicFieldType:type as DynamicFieldType,unit:['AC_CLEANING','AC_MAINTENANCE','WASHING_MACHINE','DRYER_CLEANING','REFRIGERATOR_CLEANING'].includes(item.categoryCode)?'máy':catalogUnit(item.priceUnit)};
};
// Resolve links from the original banners using the code persisted by Catalog, never a business-data fixture.
export const catalogTemplate = (item: import('./catalog-types').CatalogService) => item.code.startsWith('UI-srv-') ? {...presentation(item),id:item.code.slice(3)} : undefined;

// Keep visual/prototype metadata, but always take Catalog business fields from the API.
export function catalogSummaryView(item: import('./catalog-types').CatalogService): Service {
  const template = presentation(item);
  return {
    id: String(item.id), categoryId: item.categoryCode as ServiceCategory,
    category: item.categoryCode as ServiceCategory, name: item.name, serviceName: item.name,
    description: item.description || '', shortDescription: item.shortDescription || '',
    basePrice: item.basePrice, price: item.basePrice, unit: item.priceUnit === 'ITEM' ? template?.unit || catalogUnit(item.priceUnit) : catalogUnit(item.priceUnit),
    duration: `${item.estimatedDurationMinutes} phút`, image: item.imageUrl || '',
    rating: 0, reviewCount: 0,
    isPopular: false, isActive: true, status: 'ACTIVE',
    highlightBadges: item.highlights, dynamicFieldType: template.dynamicFieldType,
  };
}

/** Numeric API IDs with the original screen's presentation model. */
export function catalogDetailView(detail: CatalogDetail): { service: Service; packages: ServicePackage[]; addOns: AddOn[] } {
  const item = detail.service;
  const service: Service = { ...catalogSummaryView(item), benefits: detail.benefits, workflow: detail.workflow };
  return {
    service,
    packages: detail.packages.map(pkg => ({ id: String(pkg.id), serviceId: service.id, name: pkg.name,
      defaultStaffCount: pkg.defaultStaffCount, description: pkg.description || '', price: pkg.basePrice, durationMinutes: pkg.durationMinutes,
      durationHours: pkg.durationMinutes / 60, maxArea: pkg.maxArea == null ? undefined : `${pkg.maxArea} m²`,
      recommendedFor: `${pkg.defaultStaffCount} nhân viên`, isActive: true })),
    addOns: detail.addOns.map(addOn => ({ id: String(addOn.id), serviceId: service.id, name: addOn.name,
      description: addOn.description || '', image: addOn.imageUrl || '', price: addOn.price,
      estimatedMinutes: addOn.extraDurationMinutes, durationMinutes: addOn.extraDurationMinutes, isActive: true })),
  };
}
