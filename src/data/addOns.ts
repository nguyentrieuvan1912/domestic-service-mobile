import { AddOn } from '../types/service';

export const mockAddOns: AddOn[] = [
  // Add-ons áp dụng cho dịch vụ chính
  {
    id: 'addon-001',
    serviceId: 'srv-001',
    name: 'Giặt Sofa vải/da',
    description: 'Hút bụi sâu và làm sạch bề mặt sofa nỉ/da bằng dung dịch chuyên dụng.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=80',
    price: 200000,
    estimatedMinutes: 60,
    durationMinutes: 60,
    icon: 'sofa',
    isActive: true,
  },
  {
    id: 'addon-002',
    serviceId: 'srv-001',
    name: 'Giặt thảm trải sàn',
    description: 'Hút bụi kỹ, làm sạch vết bẩn nhẹ trên thảm trải sàn phòng khách/phòng ngủ.',
    image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=500&auto=format&fit=crop&q=80',
    price: 150000,
    estimatedMinutes: 45,
    durationMinutes: 45,
    icon: 'carpet',
    isActive: true,
  },
  {
    id: 'addon-003',
    serviceId: 'srv-001',
    name: 'Giặt nệm lò xo',
    description: 'Hút bụi và khử khuẩn bề mặt nệm giường bằng máy hút nệm gia đình.',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&auto=format&fit=crop&q=80',
    price: 250000,
    estimatedMinutes: 60,
    durationMinutes: 60,
    icon: 'bed',
    isActive: true,
  },
  {
    id: 'addon-004',
    serviceId: 'srv-001',
    name: 'Vệ sinh rèm cửa',
    description: 'Hút bụi và làm sạch bụi bám trên rèm cửa các phòng.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=80',
    price: 180000,
    estimatedMinutes: 30,
    durationMinutes: 30,
    icon: 'curtain',
    isActive: true,
  },
  {
    id: 'addon-005',
    serviceId: 'srv-001',
    name: 'Vệ sinh tủ lạnh',
    description: 'Bỏ đồ, rã đông, khử mùi, lau sạch từng khay kệ và sắp xếp lại ngăn nắp.',
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&auto=format&fit=crop&q=80',
    price: 60000,
    estimatedMinutes: 30,
    durationMinutes: 30,
    icon: 'fridge',
    isActive: true,
  },
  {
    id: 'addon-006',
    serviceId: 'srv-001',
    name: 'Vệ sinh lò vi sóng & lò nướng',
    description: 'Tẩy sạch dầu mỡ bám dính bên trong và ngoài lò nướng.',
    image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500&auto=format&fit=crop&q=80',
    price: 50000,
    estimatedMinutes: 20,
    durationMinutes: 20,
    icon: 'microwave',
    isActive: true,
  },
  {
    id: 'addon-007',
    serviceId: 'srv-001',
    name: 'Lau kính ban công & cửa sổ',
    description: 'Lau sạch 2 mặt kính ban công, cửa sổ kính lớn bằng cây gạt kính chuyên dụng.',
    image: 'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=500&auto=format&fit=crop&q=80',
    price: 60000,
    estimatedMinutes: 30,
    durationMinutes: 30,
    icon: 'window',
    isActive: true,
  },
  {
    id: 'addon-008',
    serviceId: 'srv-001',
    name: 'Bộ dụng cụ & Hóa chất chuyên sâu',
    description: 'Nhân viên tự mang đầy đủ xô, cây lau, khăn vi sợi, hóa chất vệ sinh chuẩn HomeCare.',
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500&auto=format&fit=crop&q=80',
    price: 30000,
    estimatedMinutes: 0,
    durationMinutes: 0,
    icon: 'tools',
    isActive: true,
  },
];

export const getAddOnsByServiceId = (serviceId: string): AddOn[] => {
  return mockAddOns.filter((addon) => addon.isActive);
};

export const getAddOnById = (id: string): AddOn | undefined => {
  return mockAddOns.find((addon) => addon.id === id);
};
