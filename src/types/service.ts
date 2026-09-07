export type ServiceCategory = 'HOURLY' | 'PERIODIC' | 'DEEP_CLEAN';

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  shortDescription: string;
  basePrice: number;
  unit: string; // e.g. "giờ", "gói", "buổi"
  image: string;
  rating: number;
  reviewCount: number;
  isPopular: boolean;
  isActive: boolean;
  highlightBadges: string[]; // e.g. ["An toàn", "Chuyên nghiệp", "Linh hoạt"]
  detailedDescription?: string;
  benefits?: string[];
  workflow?: string[];
}

export interface ServicePackage {
  id: string;
  serviceId: string;
  name: string; // e.g. "Gói 2 giờ", "Gói 2.5 giờ", "Gói 3 giờ"
  description: string;
  price: number;
  originalPrice?: number;
  durationMinutes: number; // e.g. 120, 150, 180, 210, 240
  durationHours: number; // e.g. 2, 2.5, 3, 3.5, 4
  maxArea?: string; // e.g. "Tối đa 55–60m²", "Tối đa 85–90m²", "Tối đa 105m²"
  isPopular?: boolean;
  recommendedFor: string;
  isActive: boolean;
}

export interface AddOn {
  id: string;
  serviceId: string;
  name: string; // e.g. "Vệ sinh cửa kính", "Vệ sinh tủ lạnh"
  description: string;
  image: string; // illustration photo
  price: number;
  estimatedMinutes: number;
  durationMinutes: number;
  icon?: string;
  isActive: boolean;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Promotion {
  id: string;
  code: string; // e.g. "SUMMER20", "WELCOME10"
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number; // 20 (percent) or 50000 (VND)
  maxDiscountAmount?: number;
  minimumBookingAmount: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}
