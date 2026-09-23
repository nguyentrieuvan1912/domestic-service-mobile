import { Service } from '@/types/service';
import { mockServices } from './services';

export interface ServiceBundle {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  discountPercent: number;
  discountAmount: number;
  originalPrice: number;
  bundlePrice: number;
  primaryServiceId: string;
  includedServiceIds: string[];
  bannerImage: string;
  aiReason: string;
  tag: string;
}

export interface RelatedServiceItem {
  service: Service;
  reason: string;
  discountOffer: string;
  discountedPrice: number;
}

export const mockServiceBundles: ServiceBundle[] = [
  {
    id: 'bundle-001',
    title: 'Combo Điện Lạnh Toàn Diện',
    subtitle: 'Vệ sinh Máy lạnh + Máy giặt + Tủ lạnh',
    badgeText: 'Tiết kiệm 140.000đ',
    discountPercent: 20,
    discountAmount: 140000,
    originalPrice: 650000,
    bundlePrice: 510000,
    primaryServiceId: 'srv-004',
    includedServiceIds: ['srv-004', 'srv-006', 'srv-008'],
    bannerImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
    aiReason: 'AI phân tích: 82% khách hàng bảo dưỡng máy lạnh chọn làm cùng máy giặt để tối ưu công cụ chuyên dụng và giảm chi phí di chuyển của kỹ thuật viên.',
    tag: 'Bán chạy nhất',
  },
  {
    id: 'bundle-002',
    title: 'Combo Nhà Đẹp Sạch Sâu Cuối Tuần',
    subtitle: 'Vệ sinh nhà theo giờ + Giặt Sofa/Nệm + Khử khuẩn',
    badgeText: 'Tiết kiệm 120.000đ',
    discountPercent: 18,
    discountAmount: 120000,
    originalPrice: 680000,
    bundlePrice: 560000,
    primaryServiceId: 'srv-001',
    includedServiceIds: ['srv-001', 'srv-003', 'srv-016'],
    bannerImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    aiReason: 'Gợi ý cho căn hộ gia đình: Giặt nệm sofa kết hợp khử khuẩn không gian giúp loại bỏ 99.9% vi khuẩn, bụi mịn mạt nhà.',
    tag: 'Đề xuất AI',
  },
  {
    id: 'bundle-003',
    title: 'Combo Mẹ Thảnh Thơi - Bé Khỏe Vui',
    subtitle: 'Chăm sóc trẻ em + Nấu ăn dinh dưỡng',
    badgeText: 'Tiết kiệm 80.000đ',
    discountPercent: 15,
    discountAmount: 80000,
    originalPrice: 500000,
    bundlePrice: 420000,
    primaryServiceId: 'srv-009',
    includedServiceIds: ['srv-009', 'srv-011'],
    bannerImage: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80',
    aiReason: 'Giúp mẹ an tâm làm việc: Bảo mẫu chăm sóc kèm chuẩn bị bữa ăn dặm hoặc thực đơn gia đình ấm cúng.',
    tag: 'Gia đình trẻ',
  },
  {
    id: 'bundle-004',
    title: 'Combo Chăm Sóc Người Cao Tuổi Chu Đáo',
    subtitle: 'Chăm sóc người cao tuổi + Đi chợ hộ + Nấu ăn',
    badgeText: 'Tiết kiệm 100.000đ',
    discountPercent: 15,
    discountAmount: 100000,
    originalPrice: 650000,
    bundlePrice: 550000,
    primaryServiceId: 'srv-010',
    includedServiceIds: ['srv-010', 'srv-011', 'srv-013'],
    bannerImage: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&q=80',
    aiReason: 'Dành cho con cháu bận rộn: Nhân viên có chứng chỉ điều dưỡng đồng hành, mua thực phẩm tươi sạch và nấu ăn theo chế độ riêng.',
    tag: 'Hiếu thảo',
  },
  {
    id: 'bundle-005',
    title: 'Combo Gia Đình Nuôi Thú Cưng',
    subtitle: 'Chăm sóc thú cưng + Giặt sofa khử khuẩn lông thú',
    badgeText: 'Tiết kiệm 60.000đ',
    discountPercent: 15,
    discountAmount: 60000,
    originalPrice: 480000,
    bundlePrice: 420000,
    primaryServiceId: 'srv-014',
    includedServiceIds: ['srv-014', 'srv-003'],
    bannerImage: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&q=80',
    aiReason: 'Bảo vệ sức khỏe đường hô hấp: Tắm rửa cún miu kết hợp hút lông, giặt hơi nước nóng diệt ve rận trên sofa nệm.',
    tag: 'Pet Lovers',
  },
  {
    id: 'bundle-006',
    title: 'Combo Bữa Cơm Trọn Vẹn',
    subtitle: 'Đi chợ thực phẩm sạch + Nấu ăn gia đình',
    badgeText: 'Tiết kiệm 40.000đ',
    discountPercent: 12,
    discountAmount: 40000,
    originalPrice: 320000,
    bundlePrice: 280000,
    primaryServiceId: 'srv-013',
    includedServiceIds: ['srv-013', 'srv-011'],
    bannerImage: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80',
    aiReason: 'Nhân viên chọn mua thực phẩm siêu thị tươi ngon có hóa đơn, sơ chế và nấu bữa cơm 3 món chuẩn vị gia đình.',
    tag: 'Tiện lợi',
  },
];

/**
 * Intelligent recommendation mapping based on service domains
 */
const RELATED_SERVICE_MAP: Record<string, { serviceId: string; reason: string; discountOffer: string; discountRate: number }[]> = {
  // 1. Vệ sinh nhà theo giờ
  'srv-001': [
    {
      serviceId: 'srv-003',
      reason: 'Giặt sạch sâu sofa & nệm bằng máy hút nước nóng diệt khuẩn mạt bụi',
      discountOffer: 'Giảm 15% khi đặt kèm',
      discountRate: 0.15,
    },
    {
      serviceId: 'srv-016',
      reason: 'Phun khử khuẩn Nano bạc toàn bộ không gian phòng khách và bếp',
      discountOffer: 'Ưu đãi chỉ còn 120k',
      discountRate: 0.2,
    },
    {
      serviceId: 'srv-011',
      reason: 'Nấu thêm bữa tối nóng hổi cho cả nhà sau khi dọn sạch',
      discountOffer: 'Giảm 10%',
      discountRate: 0.1,
    },
  ],
  // 2. Tổng vệ sinh
  'srv-002': [
    {
      serviceId: 'srv-003',
      reason: 'Xử lý giặt rèm, nệm và sofa vải nỉ chuyên sâu',
      discountOffer: 'Giảm 20% khi gộp đơn',
      discountRate: 0.2,
    },
    {
      serviceId: 'srv-016',
      reason: 'Khử khuẩn, diệt mầm bệnh và nấm mốc góc khuất',
      discountOffer: 'Đồng giá 150k',
      discountRate: 0.25,
    },
  ],
  // 3. Sofa, nệm, rèm
  'srv-003': [
    {
      serviceId: 'srv-001',
      reason: 'Vệ sinh hút bụi sàn nhà và lau dọn bề mặt xung quanh',
      discountOffer: 'Giảm 15%',
      discountRate: 0.15,
    },
    {
      serviceId: 'srv-014',
      reason: 'Khử mùi nước tiểu thú cưng và triệt lông bám sâu',
      discountOffer: 'Tặng gói xịt dưỡng vải',
      discountRate: 0.1,
    },
  ],
  // 4. Máy lạnh
  'srv-004': [
    {
      serviceId: 'srv-006',
      reason: 'Vệ sinh lồng giặt máy giặt - cùng chuyên môn kỹ thuật điện lạnh',
      discountOffer: 'Giảm 40k khi làm cùng máy lạnh',
      discountRate: 0.2,
    },
    {
      serviceId: 'srv-005',
      reason: 'Kiểm tra áp suất gas R32/R410A và bảo dưỡng block nén an toàn',
      discountOffer: 'Gói kiểm tra 50k',
      discountRate: 0.3,
    },
    {
      serviceId: 'srv-008',
      reason: 'Vệ sinh dàn nóng và khử mùi ngăn đông tủ lạnh',
      discountOffer: 'Giảm 15%',
      discountRate: 0.15,
    },
  ],
  // 5. Bảo dưỡng máy lạnh
  'srv-005': [
    {
      serviceId: 'srv-004',
      reason: 'Vệ sinh lưới lọc và xịt rửa dàn lạnh chuyên dụng',
      discountOffer: 'Ưu đãi trọn gói 2 trong 1',
      discountRate: 0.2,
    },
    {
      serviceId: 'srv-006',
      reason: 'Bảo dưỡng định kỳ máy giặt cửa ngang/cửa trên',
      discountOffer: 'Giảm 15%',
      discountRate: 0.15,
    },
  ],
  // 6. Máy giặt
  'srv-006': [
    {
      serviceId: 'srv-007',
      reason: 'Vệ sinh đường thoát khí và lưới lọc máy sấy quần áo',
      discountOffer: 'Giảm 50.000đ khi kết hợp',
      discountRate: 0.25,
    },
    {
      serviceId: 'srv-004',
      reason: 'Vệ sinh máy lạnh cùng lúc để tiết kiệm thời gian',
      discountOffer: 'Giảm 15%',
      discountRate: 0.15,
    },
  ],
  // 7. Máy sấy
  'srv-007': [
    {
      serviceId: 'srv-006',
      reason: 'Vệ sinh lồng giặt máy giặt song song',
      discountOffer: 'Giảm 20%',
      discountRate: 0.2,
    },
  ],
  // 8. Tủ lạnh
  'srv-008': [
    {
      serviceId: 'srv-004',
      reason: 'Vệ sinh bảo dưỡng thiết bị lạnh trong gia đình',
      discountOffer: 'Giảm 15%',
      discountRate: 0.15,
    },
    {
      serviceId: 'srv-011',
      reason: 'Dọn tủ lạnh trước khi nấu ăn gia đình',
      discountOffer: 'Giảm 10%',
      discountRate: 0.1,
    },
  ],
  // 9. Trẻ em
  'srv-009': [
    {
      serviceId: 'srv-011',
      reason: 'Chuẩn bị cháo dặm / món ăn dinh dưỡng sạch sẽ cho bé',
      discountOffer: 'Giảm 15% gói nấu ăn kèm theo',
      discountRate: 0.15,
    },
    {
      serviceId: 'srv-016',
      reason: 'Khử trùng đồ chơi và phòng ngủ của bé bằng dung dịch an toàn',
      discountOffer: 'Đồng giá 99k',
      discountRate: 0.3,
    },
  ],
  // 10. Người cao tuổi
  'srv-010': [
    {
      serviceId: 'srv-011',
      reason: 'Nấu các món ăn ít muối, tốt cho tim mạch người lớn tuổi',
      discountOffer: 'Giảm 15%',
      discountRate: 0.15,
    },
    {
      serviceId: 'srv-013',
      reason: 'Đi chợ chọn mua thực phẩm dinh dưỡng, sữa và hoa quả sạch',
      discountOffer: 'Miễn phí công đi chợ',
      discountRate: 0.3,
    },
  ],
  // 11. Nấu ăn gia đình
  'srv-011': [
    {
      serviceId: 'srv-013',
      reason: 'Đi chợ mua sẵn nguyên liệu tươi sống theo thực đơn yêu cầu',
      discountOffer: 'Chỉ thêm 40k công đi chợ',
      discountRate: 0.2,
    },
    {
      serviceId: 'srv-001',
      reason: 'Dọn dẹp rửa bát và vệ sinh bếp sáng bóng sau bữa ăn',
      discountOffer: 'Giảm 10%',
      discountRate: 0.1,
    },
  ],
  // 12. Giặt ủi
  'srv-012': [
    {
      serviceId: 'srv-001',
      reason: 'Dọn dẹp gấp quần áo và sắp xếp gọn gàng vào tủ',
      discountOffer: 'Giảm 15%',
      discountRate: 0.15,
    },
  ],
  // 13. Đi chợ hộ
  'srv-013': [
    {
      serviceId: 'srv-011',
      reason: 'Sơ chế và chế biến ngay sau khi mua đồ về',
      discountOffer: 'Giảm 15% phí nấu ăn',
      discountRate: 0.15,
    },
  ],
  // 14. Chăm sóc thú cưng
  'srv-014': [
    {
      serviceId: 'srv-003',
      reason: 'Giặt sấy đệm nằm và sofa khử mùi hôi thú cưng',
      discountOffer: 'Giảm 20%',
      discountRate: 0.2,
    },
  ],
  // 15. Cây cảnh
  'srv-015': [
    {
      serviceId: 'srv-001',
      reason: 'Quét dọn lá cây và lau chùi ban công, sân thượng',
      discountOffer: 'Giảm 15%',
      discountRate: 0.15,
    },
  ],
};

/**
 * Get related services with intelligent recommendation details
 */
export const getRelatedServices = (serviceId: string): RelatedServiceItem[] => {
  const configs = RELATED_SERVICE_MAP[serviceId] || [
    {
      serviceId: 'srv-001',
      reason: 'Dọn dẹp không gian chung để ngôi nhà luôn ngăn nắp',
      discountOffer: 'Giảm 10%',
      discountRate: 0.1,
    },
    {
      serviceId: 'srv-016',
      reason: 'Khử khuẩn môi trường sống bảo vệ cả gia đình',
      discountOffer: 'Ưu đãi đặt kèm 120k',
      discountRate: 0.2,
    },
  ];

  const results: RelatedServiceItem[] = [];
  for (const cfg of configs) {
    const srv = mockServices.find((s) => s.id === cfg.serviceId);
    if (srv) {
      const price = srv.basePrice || srv.price || 150000;
      const discountedPrice = Math.round((price * (1 - cfg.discountRate)) / 1000) * 1000;
      results.push({
        service: srv,
        reason: cfg.reason,
        discountOffer: cfg.discountOffer,
        discountedPrice,
      });
    }
  }
  return results;
};

/**
 * Find recommended bundle for a service
 */
export const getBundleForService = (serviceId: string): ServiceBundle | undefined => {
  return mockServiceBundles.find(
    (b) => b.primaryServiceId === serviceId || b.includedServiceIds.includes(serviceId)
  );
};
