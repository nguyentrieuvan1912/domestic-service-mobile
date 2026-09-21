export type ServiceCategory =
  | 'CLEANING_HOURLY'
  | 'CLEANING_DEEP'
  | 'CLEANING_UPHOLSTERY'
  | 'AC_CLEANING'
  | 'AC_MAINTENANCE'
  | 'WASHING_MACHINE'
  | 'DRYER_CLEANING'
  | 'REFRIGERATOR_CLEANING'
  | 'CHILD_CARE'
  | 'ELDERLY_CARE'
  | 'COOKING'
  | 'LAUNDRY'
  | 'GROCERY_SHOPPING'
  | 'PET_CARE'
  | 'PLANT_CARE'
  | 'OTHER_SERVICES'
  // Giữ lại alias cũ để tương thích
  | 'HOURLY'
  | 'PERIODIC'
  | 'DEEP_CLEAN';

export interface CategoryInfo {
  id: ServiceCategory;
  name: string;
  icon: string; // Emoji hoặc Icon name
  description: string;
  group: 'CLEANING' | 'APPLIANCES' | 'CARE' | 'HOME_TASKS';
}

export type DynamicFieldType =
  | 'CLEANING_HOURLY'
  | 'CLEANING_DEEP'
  | 'AC_CLEANING'
  | 'AC_MAINTENANCE'
  | 'WASHING_MACHINE'
  | 'CHILD_CARE'
  | 'ELDERLY_CARE'
  | 'PET_CARE'
  | 'COOKING'
  | 'GENERAL';

export interface Service {
  id: string;
  categoryId?: ServiceCategory;
  category: ServiceCategory;
  name: string;
  serviceName?: string; // alias
  description: string;
  shortDescription: string;
  basePrice: number;
  price?: number; // alias
  unit: string; // e.g. "giờ", "gói", "máy", "buổi"
  duration?: string; // e.g. "2 - 4 giờ"
  image: string;
  rating: number;
  reviewCount: number;
  isPopular: boolean;
  isActive: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  highlightBadges: string[];
  detailedDescription?: string;
  benefits?: string[];
  workflow?: string[];
  serviceRequirements?: string[];
  supportedAreas?: string[];
  requiredStaffSkills?: string[];
  dynamicFieldType?: DynamicFieldType;
}

export interface ServicePackage {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  durationMinutes: number;
  durationHours: number;
  maxArea?: string;
  isPopular?: boolean;
  recommendedFor: string;
  isActive: boolean;
}

export interface AddOn {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  image: string;
  price: number;
  estimatedMinutes: number;
  durationMinutes: number;
  icon?: string;
  isActive: boolean;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minimumBookingAmount: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

