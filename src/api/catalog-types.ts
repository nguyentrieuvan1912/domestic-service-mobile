/** Mirrors the public Catalog contract. No mock fallback. */
export interface CatalogCategory {
  id: number; code: string; name: string; description: string | null; iconUrl: string | null; group: string | null
}
export interface CatalogService {
  id: number; categoryId: number; categoryCode: string; categoryName: string; code: string; name: string
  description: string | null; shortDescription: string | null; serviceType: string; priceUnit: string
  basePrice: number; estimatedDurationMinutes: number; requiresQualification: boolean
  imageUrl: string | null; highlights: string[]
}
export interface CatalogDetail {
  service: CatalogService
  packages: { id: number; name: string; description: string | null; durationMinutes: number; basePrice: number; defaultStaffCount: number; maxArea: number | null }[]
  addOns: { id: number; name: string; description: string | null; price: number; extraDurationMinutes: number; imageUrl: string | null }[]
  requirements: { id: number; fieldKey: string; label: string; fieldType: string; required: boolean; options: unknown[]; validationRules: Record<string, unknown>; displayOrder: number }[]
  workflow: string[]; benefits: string[]
}
export interface CatalogPage { items: CatalogService[]; total: number; page: number; size: number; totalPages: number }
