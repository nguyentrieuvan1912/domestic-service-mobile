import { AddOn, Service, ServiceCategory, ServicePackage } from '@/types/service';
import { CatalogDetail } from './catalog-types';
import { catalogUnit } from './catalog';
import { mockServices } from '@/data/services';
import { mockServicePackages } from '@/data/servicePackages';

export const catalogTemplate = (item: import('./catalog-types').CatalogService) => mockServices.find(service => `UI-${service.id}` === item.code);

// Keep visual/prototype metadata, but always take Catalog business fields from the API.
export function catalogSummaryView(item: import('./catalog-types').CatalogService): Service {
  const template = catalogTemplate(item);
  return {
    ...template, id: String(item.id), categoryId: item.categoryCode as ServiceCategory,
    category: item.categoryCode as ServiceCategory, name: item.name, serviceName: item.name,
    description: item.description || '', shortDescription: item.shortDescription || '',
    basePrice: item.basePrice, price: item.basePrice, unit: item.priceUnit === 'ITEM' ? template?.unit || catalogUnit(item.priceUnit) : catalogUnit(item.priceUnit),
    duration: template?.duration || `${item.estimatedDurationMinutes} phút`, image: item.imageUrl || '',
    rating: template?.rating || 0, reviewCount: template?.reviewCount || 0,
    isPopular: template?.isPopular || false, isActive: true, status: 'ACTIVE',
    highlightBadges: item.highlights, dynamicFieldType: template?.dynamicFieldType || 'GENERAL',
  };
}

/** Numeric API IDs with the original screen's presentation model. */
export function catalogDetailView(detail: CatalogDetail): { service: Service; packages: ServicePackage[]; addOns: AddOn[] } {
  const item = detail.service;
  const service: Service = { ...catalogSummaryView(item), benefits: detail.benefits, workflow: detail.workflow };
  const presentationId = catalogTemplate(item)?.id;
  return {
    service,
    packages: detail.packages.map(pkg => ({ ...mockServicePackages.find(template => template.serviceId === presentationId && template.name === pkg.name), id: String(pkg.id), serviceId: service.id, name: pkg.name,
      description: pkg.description || '', price: pkg.basePrice, durationMinutes: pkg.durationMinutes,
      durationHours: pkg.durationMinutes / 60, maxArea: pkg.maxArea == null ? mockServicePackages.find(template => template.serviceId === presentationId && template.name === pkg.name)?.maxArea : `${pkg.maxArea} m²`,
      recommendedFor: mockServicePackages.find(template => template.serviceId === presentationId && template.name === pkg.name)?.recommendedFor || `${pkg.defaultStaffCount} nhân viên`, isActive: true })),
    addOns: detail.addOns.map(addOn => ({ id: String(addOn.id), serviceId: service.id, name: addOn.name,
      description: addOn.description || '', image: addOn.imageUrl || '', price: addOn.price,
      estimatedMinutes: addOn.extraDurationMinutes, durationMinutes: addOn.extraDurationMinutes, isActive: true })),
  };
}
