import { AddOn } from '../types/service';

export const mockAddOns: AddOn[] = [
  // Add-ons cho Vệ sinh nhà (srv-001, srv-002)
  {
    id: 'addon-001',
    serviceId: 'srv-001',
    name: 'Giặt Sofa nỉ/da',
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
    description: 'Hút bụi kỹ, làm sạch vết bẩn nhẹ trên thảm phòng khách.',
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
    name: 'Giặt nệm giường',
    description: 'Hút bụi sâu và khử khuẩn bề mặt nệm ngủ bằng máy chuyên dụng.',
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
    name: 'Lau dọn tủ lạnh',
    description: 'Bỏ đồ, rã đông, lau sạch từng khay kệ và khử mùi sinh học.',
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&auto=format&fit=crop&q=80',
    price: 70000,
    estimatedMinutes: 30,
    durationMinutes: 30,
    icon: 'fridge',
    isActive: true,
  },
  {
    id: 'addon-006',
    serviceId: 'srv-001',
    name: 'Vệ sinh lò vi sóng & lò nướng',
    description: 'Tẩy sạch dầu mỡ cháy bám dính bên trong và ngoài lò nướng.',
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
    description: 'Lau sạch 2 mặt kính ban công, cửa sổ kính lớn bằng cây gạt chuyên dụng.',
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
    name: 'Nhân viên tự mang dụng cụ & hóa chất',
    description: 'Nhân viên mang xô, cây lau, khăn vi sợi, hóa chất vệ sinh chuẩn HomeCare.',
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500&auto=format&fit=crop&q=80',
    price: 30000,
    estimatedMinutes: 0,
    durationMinutes: 0,
    icon: 'tools',
    isActive: true,
  },

  // Add-ons cho Máy lạnh (srv-004, srv-005)
  {
    id: 'addon-ac-01',
    serviceId: 'srv-004',
    name: 'Khử khuẩn Nano Bạc cửa gió',
    description: 'Phun lớp màng nano bạc kháng nấm mốc và vi khuẩn lâu dài trên lá nhôm.',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80',
    price: 50000,
    estimatedMinutes: 15,
    durationMinutes: 15,
    icon: 'spray',
    isActive: true,
  },
  {
    id: 'addon-ac-02',
    serviceId: 'srv-004',
    name: 'Thông tắc đường ống thoát nước sâu',
    description: 'Dùng dây thông chuyên dụng xử lý cặn nhớt ứ đọng trong tường tránh chảy nước.',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
    price: 60000,
    estimatedMinutes: 20,
    durationMinutes: 20,
    icon: 'pipe',
    isActive: true,
  },

  // Add-ons cho Chăm sóc trẻ em (srv-009)
  {
    id: 'addon-child-01',
    serviceId: 'srv-009',
    name: 'Hỗ trợ nấu bữa ăn dặm cho bé',
    description: 'Bảo mẫu hỗ trợ hâm hoặc nấu cháo dinh dưỡng theo công thức ba mẹ để sẵn.',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500&auto=format&fit=crop&q=80',
    price: 50000,
    estimatedMinutes: 30,
    durationMinutes: 30,
    icon: 'bowl',
    isActive: true,
  },
  {
    id: 'addon-child-02',
    serviceId: 'srv-009',
    name: 'Giặt sấy quần áo riêng của bé',
    description: 'Giặt tay hoặc giặt máy với nước giặt chuyên dụng cho da em bé.',
    image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=500&auto=format&fit=crop&q=80',
    price: 40000,
    estimatedMinutes: 30,
    durationMinutes: 30,
    icon: 'baby_clothes',
    isActive: true,
  },

  // Add-ons cho Thú cưng (srv-014)
  {
    id: 'addon-pet-01',
    serviceId: 'srv-014',
    name: 'Cắt mài móng & Vệ sinh tai',
    description: 'Cắt móng an toàn và nhỏ dung dịch làm sạch ráy tai cho cún mèo.',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop&q=80',
    price: 50000,
    estimatedMinutes: 20,
    durationMinutes: 20,
    icon: 'paw',
    isActive: true,
  },
];

export const getAddOnsByServiceId = (serviceId: string): AddOn[] => {
  const specific = mockAddOns.filter((addon) => addon.serviceId === serviceId && addon.isActive);
  if (specific.length > 0) return specific;
  // Fallback to common cleaning add-ons if none specific
  return mockAddOns.filter((a) => ['addon-005', 'addon-006', 'addon-007', 'addon-008'].includes(a.id));
};

export const getAddOnById = (id: string): AddOn | undefined => {
  return mockAddOns.find((addon) => addon.id === id);
};
