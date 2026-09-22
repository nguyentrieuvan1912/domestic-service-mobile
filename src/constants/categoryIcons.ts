import { ServiceCategory } from '@/types/service';

export const CATEGORY_ICONS: Record<string, any> = {
  CLEANING_HOURLY: require('@/assets/images/categories/cleaning_hourly.png'),
  CLEANING_DEEP: require('@/assets/images/categories/cleaning_deep.png'),
  CLEANING_UPHOLSTERY: require('@/assets/images/categories/cleaning_upholstery.png'),
  AC_CLEANING: require('@/assets/images/categories/ac_cleaning.png'),
  AC_MAINTENANCE: require('@/assets/images/categories/ac_maintenance.png'),
  WASHING_MACHINE: require('@/assets/images/categories/washing_machine.png'),
  DRYER_CLEANING: require('@/assets/images/categories/dryer_cleaning.png'),
  REFRIGERATOR_CLEANING: require('@/assets/images/categories/refrigerator_cleaning.png'),
  CHILD_CARE: require('@/assets/images/categories/child_care.png'),
  ELDERLY_CARE: require('@/assets/images/categories/elderly_care.png'),
  COOKING: require('@/assets/images/categories/cooking.png'),
  LAUNDRY: require('@/assets/images/categories/laundry.png'),
  GROCERY_SHOPPING: require('@/assets/images/categories/grocery_shopping.png'),
  PET_CARE: require('@/assets/images/categories/pet_care.png'),
  PLANT_CARE: require('@/assets/images/categories/plant_care.png'),
  OTHER_SERVICES: require('@/assets/images/categories/other_services.png'),

  // Compatibility aliases
  HOURLY: require('@/assets/images/categories/cleaning_hourly.png'),
  PERIODIC: require('@/assets/images/categories/cleaning_deep.png'),
  DEEP_CLEAN: require('@/assets/images/categories/cleaning_deep.png'),
};

export const getCategoryIcon = (categoryId: string | ServiceCategory): any => {
  return CATEGORY_ICONS[categoryId] || null;
};
