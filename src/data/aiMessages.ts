import { AIMessage } from '../types/ai';

export const mockAIMessages: AIMessage[] = [
  // --- ai-conv-001: Căn hộ 70m2 ---
  {
    id: 'ai-msg-001',
    conversationId: 'ai-conv-001',
    role: 'USER',
    content: 'Tôi cần tổng vệ sinh căn hộ chung cư 70m2, bạn tư vấn giúp tôi nên chọn gói nào và giá bao nhiêu?',
    createdAt: '2024-06-11T14:01:00Z',
  },
  {
    id: 'ai-msg-002',
    conversationId: 'ai-conv-001',
    role: 'ASSISTANT',
    content:
      'Chào bạn! Với căn hộ chung cư diện tích 70m² (thường gồm 2 phòng ngủ, 2 WC), bạn có 2 lựa chọn phù hợp nhất:\n\n1. **Gói Tổng vệ sinh căn hộ (< 80m²)**: Giá 650.000đ (thời lượng khoảng 4 giờ). Nhân viên sẽ tổng vệ sinh sạch sâu toàn diện từ trần, tường, sàn, tẩy ố kính nhà tắm đến hút bụi rèm cửa.\n\n2. **Giúp việc theo giờ (Gói 4 giờ)**: Giá 320.000đ. Phù hợp nếu nhà bạn đã tương đối gọn gàng và chỉ cần lau chùi định kỳ hàng tuần.\n\nNếu bạn dọn dẹp để chuẩn bị đón khách hoặc sau thời gian dài chưa dọn, mình đề xuất bạn chọn gói **Tổng vệ sinh căn hộ** nhé!',
    suggestions: [
      {
        type: 'PACKAGE',
        referenceId: 'pkg-004',
        title: 'Tổng vệ sinh căn hộ (< 80m²)',
        subtitle: 'Thời lượng 4 giờ • Khử khuẩn sâu',
        price: 650000,
      },
      {
        type: 'PACKAGE',
        referenceId: 'pkg-002',
        title: 'Giúp việc theo giờ (Gói 4 giờ)',
        subtitle: 'Dọn dẹp tiêu chuẩn 2 phòng ngủ',
        price: 320000,
      },
    ],
    createdAt: '2024-06-11T14:02:00Z',
  },
  {
    id: 'ai-msg-003',
    conversationId: 'ai-conv-001',
    role: 'USER',
    content: 'Kính phòng tắm nhà mình bị ố vàng cặn nước nhiều lắm, gói này có tẩy sạch được không?',
    createdAt: '2024-06-11T14:05:00Z',
  },
  {
    id: 'ai-msg-004',
    conversationId: 'ai-conv-001',
    role: 'ASSISTANT',
    content:
      'Dạ cặn canxi nước cứng trên kính phòng tắm bám rất chặt, cần hóa chất sinh học chuyên dụng. Bạn có thể chọn thêm dịch vụ phụ trợ **Tẩy cặn canxi vách kính tắm (+80.000đ)**, nhân viên sẽ dùng dung dịch chuyên biệt đánh bay hoàn toàn vết ố, trả lại mặt kính trong suốt 100%!',
    suggestions: [
      {
        type: 'ADDON',
        referenceId: 'addon-007',
        title: 'Tẩy cặn canxi vách kính tắm',
        subtitle: 'Dung dịch sinh học cao cấp',
        price: 80000,
      },
    ],
    createdAt: '2024-06-11T14:06:00Z',
  },
  {
    id: 'ai-msg-005',
    conversationId: 'ai-conv-001',
    role: 'USER',
    content: 'Hiện có mã khuyến mãi nào áp dụng được cho đơn này không?',
    createdAt: '2024-06-11T14:18:00Z',
  },
  {
    id: 'ai-msg-006',
    conversationId: 'ai-conv-001',
    role: 'ASSISTANT',
    content:
      'Tuyệt vời! Hiện tại bạn có thể áp dụng mã **SUMMER20** để được giảm ngay 50.000đ (tối đa). Với căn hộ 70m², gói Tổng vệ sinh căn hộ 650.000đ sẽ làm sạch sâu toàn diện nhất ạ!',
    suggestions: [
      {
        type: 'PROMOTION',
        referenceId: 'promo-001',
        title: 'Mã SUMMER20 - Giảm 50.000đ',
        subtitle: 'Áp dụng cho đơn từ 200.000đ',
      },
    ],
    createdAt: '2024-06-11T14:20:00Z',
  },

  // --- ai-conv-002: Nên chọn gói 2h hay 4h ---
  {
    id: 'ai-msg-007',
    conversationId: 'ai-conv-002',
    role: 'USER',
    content: 'Nên chọn gói 2 giờ hay 4 giờ?',
    createdAt: '2024-06-10T10:01:00Z',
  },
  {
    id: 'ai-msg-008',
    conversationId: 'ai-conv-002',
    role: 'ASSISTANT',
    content:
      'Để tư vấn chuẩn nhất cho bạn, bạn có thể cho mình biết:\n- Diện tích nhà bạn khoảng bao nhiêu m²?\n- Nhà có bao nhiêu phòng ngủ và phòng vệ sinh?\n- Bạn chỉ cần quét lau sàn cơ bản hay cần thêm lau dọn bếp, toilet kỹ lưỡng?',
    createdAt: '2024-06-10T10:02:00Z',
  },
  {
    id: 'ai-msg-009',
    conversationId: 'ai-conv-002',
    role: 'USER',
    content: 'Nhà mình chung cư 65m2, 2 phòng ngủ 1 wc, cần lau dọn cả phòng khách và dọn bếp sau khi nấu.',
    createdAt: '2024-06-10T10:05:00Z',
  },
  {
    id: 'ai-msg-010',
    conversationId: 'ai-conv-002',
    role: 'ASSISTANT',
    content:
      'Với diện tích 65m² và nhu cầu dọn dẹp phòng khách, 2 phòng ngủ cùng khu vực bếp nấu nướng, thời lượng làm việc chuẩn xác là **Gói 4 giờ** (320.000đ).\n\nNếu chọn gói 2 giờ, nhân viên chỉ kịp quét lau sàn cơ bản và gom rác, không đủ thời gian để cọ rửa bếp và lau đồ dùng kỹ càng. Do đó, gói 4 giờ là sự lựa chọn tối ưu và tiết kiệm nhất cho bạn!',
    suggestions: [
      {
        type: 'PACKAGE',
        referenceId: 'pkg-002',
        title: 'Gói 4 giờ - Tiêu chuẩn',
        subtitle: '320.000đ • Phổ biến nhất',
        price: 320000,
      },
    ],
    createdAt: '2024-06-10T10:08:00Z',
  },
  {
    id: 'ai-msg-011',
    conversationId: 'ai-conv-002',
    role: 'USER',
    content: 'Cảm ơn em, gói này nhân viên có mang theo nước lau sàn không?',
    createdAt: '2024-06-10T10:12:00Z',
  },
  {
    id: 'ai-msg-012',
    conversationId: 'ai-conv-002',
    role: 'ASSISTANT',
    content:
      'Dạ với gói tiêu chuẩn thì khách hàng chuẩn bị sẵn chổi, khăn lau và nước lau sàn tại nhà. Nếu bạn muốn nhân viên tự chuẩn bị trọn gói bộ dụng cụ chuyên nghiệp (máy hút bụi cầm tay, khăn microfiber, nước lau sinh học), bạn có thể tích chọn thêm dịch vụ phụ **Mang theo bộ dụng cụ (+30.000đ)** khi đặt đơn nhé!',
    suggestions: [
      {
        type: 'ADDON',
        referenceId: 'addon-005',
        title: 'Mang theo bộ dụng cụ chuyên dụng',
        subtitle: 'Đầy đủ khăn, cây lau và dung dịch',
        price: 30000,
      },
    ],
    createdAt: '2024-06-10T10:15:00Z',
  },

  // --- ai-conv-003: Sofa & thú cưng ---
  {
    id: 'ai-msg-013',
    conversationId: 'ai-conv-003',
    role: 'USER',
    content: 'Bộ sofa nỉ nhà mình bị dính lông chó và có mùi hôi, bên bạn có cách nào làm sạch không?',
    createdAt: '2024-06-08T08:31:00Z',
  },
  {
    id: 'ai-msg-014',
    conversationId: 'ai-conv-003',
    role: 'ASSISTANT',
    content:
      'Chào anh! CleanMaster có dịch vụ **Giặt sấy sofa & đệm rèm** chuyên xử lý các trường hợp này bằng công nghệ phun hút hơi nước nóng 140°C kết hợp hóa chất khử khuẩn sinh học.\n\nQuy trình bao gồm:\n1. Hút sâu lông thú cưng bám trong từng kẽ nỉ\n2. Phun dung dịch enzym sinh học phân hủy mùi hôi\n3. Chà vết bẩn và hút sạch nước bẩn ra ngoài\n4. Phun tinh dầu khử khuẩn và sấy khô 80%',
    suggestions: [
      {
        type: 'PACKAGE',
        referenceId: 'pkg-010',
        title: 'Giặt bộ sofa chữ L hoặc văng dài',
        subtitle: '350.000đ • Công nghệ hơi nước nóng',
        price: 350000,
      },
    ],
    createdAt: '2024-06-08T08:35:00Z',
  },
  {
    id: 'ai-msg-015',
    conversationId: 'ai-conv-003',
    role: 'USER',
    content: 'Có dịch vụ phụ nào giúp mùi thơm giữ được lâu không?',
    createdAt: '2024-06-08T08:40:00Z',
  },
  {
    id: 'ai-msg-016',
    conversationId: 'ai-conv-003',
    role: 'ASSISTANT',
    content:
      'Anh có thể thêm dịch vụ phụ **Khử mùi thú cưng chuyên dụng (60.000đ)** và **Phủ nano chống thấm (100.000đ)**. Lớp phủ nano sẽ ngăn nước tiểu hay chất lỏng của thú cưng ngấm sâu vào mút đệm trong 3-6 tháng tới!',
    suggestions: [
      {
        type: 'ADDON',
        referenceId: 'addon-015',
        title: 'Khử mùi thú cưng chuyên dụng',
        subtitle: 'Tinh dầu sinh học tự nhiên',
        price: 60000,
      },
      {
        type: 'ADDON',
        referenceId: 'addon-014',
        title: 'Phủ nano chống bám nước & bám bụi',
        subtitle: 'Bảo vệ sợi vải sofa',
        price: 100000,
      },
    ],
    createdAt: '2024-06-08T08:45:00Z',
  },

  // --- ai-conv-004: Chính sách hủy & hoàn tiền ---
  {
    id: 'ai-msg-017',
    conversationId: 'ai-conv-004',
    role: 'USER',
    content: 'Tôi muốn hỏi quy định hủy đơn đặt dịch vụ và chính sách hoàn tiền như thế nào?',
    createdAt: '2024-06-09T17:16:00Z',
  },
  {
    id: 'ai-msg-018',
    conversationId: 'ai-conv-004',
    role: 'ASSISTANT',
    content:
      'Chính sách hủy đơn của CleanMaster được thiết kế minh bạch để bảo vệ quyền lợi cả khách hàng và nhân viên đối tác:\n\n1. **Hủy trước ≥ 12 giờ so với giờ hẹn**: Miễn phí 100%. Nếu đã thanh toán trực tuyến (VNPAY/MOMO/ZALOPAY), tiền sẽ hoàn 100% về tài khoản ví trong 15-30 phút.\n\n2. **Hủy từ 2 đến dưới 12 giờ**: Phí hủy là 20% giá trị đơn hàng để hỗ trợ chi phí chuẩn bị của nhân viên.\n\n3. **Hủy dưới 2 giờ hoặc khi nhân viên đã đến nơi**: Phí hủy là 50% giá trị đơn hàng.',
    createdAt: '2024-06-09T17:20:00Z',
  },
  {
    id: 'ai-msg-019',
    conversationId: 'ai-conv-004',
    role: 'USER',
    content: 'Nếu nhân viên tự ý hủy thì khách hàng được đền bù gì không?',
    createdAt: '2024-06-09T17:25:00Z',
  },
  {
    id: 'ai-msg-020',
    conversationId: 'ai-conv-004',
    role: 'ASSISTANT',
    content:
      'Nếu nhân viên tự ý hủy đơn sát giờ mà không có sự cố bất khả kháng:\n- Bạn sẽ được hoàn tiền 100% ngay lập tức.\n- Hệ thống tự động tặng ngay 1 mã giảm giá 50.000đ cho đơn tiếp theo.\n- Hệ thống lập tức ưu tiên điều phối nhân viên thay thế có điểm đánh giá cao nhất trong khu vực của bạn.',
    createdAt: '2024-06-09T17:30:00Z',
  },

  // --- ai-conv-005: Chăm sóc người cao tuổi ---
  {
    id: 'ai-msg-021',
    conversationId: 'ai-conv-005',
    role: 'USER',
    content: 'Nhà mình có cụ bà 82 tuổi vừa xuất viện sau mổ khớp háng, bên bạn có nhân viên nào có chuyên môn y tá/điều dưỡng không?',
    createdAt: '2024-06-05T11:02:00Z',
  },
  {
    id: 'ai-msg-022',
    conversationId: 'ai-conv-005',
    role: 'ASSISTANT',
    content:
      'Dạ chào bạn, CleanMaster có đội ngũ nhân sự chuyên biệt cho mảng **Chăm sóc người cao tuổi** đã được xác thực chứng chỉ điều dưỡng và sơ cấp cứu gia đình.\n\nBạn có thể sử dụng tính năng **Tự chọn nhân viên (Mode A)** để chọn đích danh các nhân viên xuất sắc như:\n- **Phạm Thị Lan**: 6 năm kinh nghiệm, 4.9 sao, có chứng chỉ điều dưỡng gia đình, rất khéo léo trong phục hồi vận động.\n- **Phan Thị Mai Phương**: 3 năm kinh nghiệm, 4.85 sao, chuyên chăm sóc người cao tuổi phục hồi chức năng.',
    suggestions: [
      {
        type: 'SERVICE',
        referenceId: 'srv-006',
        title: 'Chăm sóc người cao tuổi',
        subtitle: 'Nhân viên có chứng chỉ điều dưỡng',
        price: 350000,
      },
    ],
    createdAt: '2024-06-05T11:10:00Z',
  },
  {
    id: 'ai-msg-023',
    conversationId: 'ai-conv-005',
    role: 'USER',
    content: 'Một ca chăm sóc bao gồm những việc gì?',
    createdAt: '2024-06-05T11:15:00Z',
  },
  {
    id: 'ai-msg-024',
    conversationId: 'ai-conv-005',
    role: 'ASSISTANT',
    content:
      'Ca chăm sóc 4 giờ bao gồm:\n- Đo huyết áp, nhịp tim và ghi chép nhật ký theo dõi\n- Hỗ trợ vệ sinh cá nhân, thay đồ, tắm rửa nhẹ nhàng\n- Chuẩn bị thức ăn mềm, cho ăn và nhắc nhở uống thuốc đúng giờ\n- Hỗ trợ tập vật lý trị liệu nhẹ nhàng hoặc dìu đi lại theo chỉ định bác sĩ\n- Trò chuyện, bầu bạn giúp tinh thần cụ vui vẻ, lạc quan',
    createdAt: '2024-06-05T11:20:00Z',
  },

  // --- ai-conv-006: Mode A vs Mode B ---
  {
    id: 'ai-msg-025',
    conversationId: 'ai-conv-006',
    role: 'USER',
    content: 'Khi đặt dịch vụ tôi thấy có 2 cách chọn nhân viên, giải thích giúp tôi?',
    createdAt: '2024-06-04T09:02:00Z',
  },
  {
    id: 'ai-msg-026',
    conversationId: 'ai-conv-006',
    role: 'ASSISTANT',
    content:
      'CleanMaster cung cấp 2 chế độ đặt dịch vụ linh hoạt:\n\n1. **Mode A (Khách hàng tự chọn nhân viên)**:\n- Bạn được xem danh sách tất cả nhân viên phù hợp trong khu vực.\n- Xem chi tiết hồ sơ: số năm kinh nghiệm, tỷ lệ hài lòng, điểm đánh giá sao và các nhận xét từ khách hàng trước.\n- Bạn chủ động bấm chọn người mình ưng ý nhất.\n\n2. **Mode B (Hệ thống tự động Matching)**:\n- Bạn chỉ cần chọn giờ và địa chỉ.\n- Thuật toán thông minh sẽ quét và chỉ định ngay nhân viên có điểm uy tín cao nhất đang ở gần bạn nhất (trong vòng 3-5 phút).\n- Rất thích hợp khi bạn cần đặt việc nhanh chóng!',
    createdAt: '2024-06-04T09:08:00Z',
  },
  {
    id: 'ai-msg-027',
    conversationId: 'ai-conv-006',
    role: 'USER',
    content: 'Nếu dùng Mode B mà tôi cần 2 người làm cùng lúc có được không?',
    createdAt: '2024-06-04T09:12:00Z',
  },
  {
    id: 'ai-msg-028',
    conversationId: 'ai-conv-006',
    role: 'ASSISTANT',
    content:
      'Hoàn toàn được ạ! Trong Mode B, ở bước chọn số lượng nhân viên bạn có thể chọn **2 nhân viên**. Hệ thống Matching sẽ tự động ghép cặp 2 nhân viên ăn ý ở cùng khu vực để cùng đến làm việc tại nhà bạn!',
    createdAt: '2024-06-04T09:15:00Z',
  },

  // --- ai-conv-007: Nhà liền kề sau xây dựng ---
  {
    id: 'ai-msg-029',
    conversationId: 'ai-conv-007',
    role: 'USER',
    content: 'Nhà mình 4 tầng 200m2 vừa hoàn thiện sơn sửa, có gói nào dọn sạch được xi măng và sơn trên kính không?',
    createdAt: '2024-06-06T09:22:00Z',
  },
  {
    id: 'ai-msg-030',
    conversationId: 'ai-conv-007',
    role: 'ASSISTANT',
    content:
      'Chào bạn! Với nhà 4 tầng diện tích ~200m² sau sơn sửa, bạn nên đặt **Gói nhà phố 3-4 tầng (< 200m²)** thuộc dịch vụ **Tổng vệ sinh nhà**.\n\nGói này sẽ phân công **2 nhân viên chuyên nghiệp** mang theo máy chà sàn công nghiệp, dao cạo kính chuyên dụng không làm xước kính và nước tẩy xi măng hữu cơ an toàn.',
    suggestions: [
      {
        type: 'PACKAGE',
        referenceId: 'pkg-005',
        title: 'Gói nhà phố 3-4 tầng (< 200m²)',
        subtitle: '1.450.000đ • Đội ngũ 2 thợ chuyên nghiệp',
        price: 1450000,
      },
    ],
    createdAt: '2024-06-06T09:28:00Z',
  },
  {
    id: 'ai-msg-031',
    conversationId: 'ai-conv-007',
    role: 'USER',
    content: 'Mã VIP100K có dùng được cho gói này không bạn?',
    createdAt: '2024-06-06T09:35:00Z',
  },
  {
    id: 'ai-msg-032',
    conversationId: 'ai-conv-007',
    role: 'ASSISTANT',
    content:
      'Dạ hoàn toàn áp dụng được ạ! Mã **VIP100K** áp dụng cho đơn từ 800.000đ, đơn của bạn là 1.450.000đ nên sẽ được giảm ngay 100.000đ chỉ còn 1.350.000đ cho cả ca làm việc trọn gói 2 thợ nhé!',
    suggestions: [
      {
        type: 'PROMOTION',
        referenceId: 'promo-006',
        title: 'Mã VIP100K - Giảm 100.000đ',
        subtitle: 'Áp dụng cho đơn tổng vệ sinh',
      },
    ],
    createdAt: '2024-06-06T09:40:00Z',
  },

  // --- ai-conv-008: Hóa đơn đỏ VAT văn phòng ---
  {
    id: 'ai-msg-033',
    conversationId: 'ai-conv-008',
    role: 'USER',
    content: 'Công ty mình đặt vệ sinh văn phòng hàng tuần thì có xuất hóa đơn đỏ VAT không?',
    createdAt: '2024-06-03T10:01:00Z',
  },
  {
    id: 'ai-msg-034',
    conversationId: 'ai-conv-008',
    role: 'ASSISTANT',
    content:
      'Chào bạn! CleanMaster cung cấp hóa đơn điện tử VAT hợp pháp cho 100% doanh nghiệp sử dụng dịch vụ Vệ sinh văn phòng.\n\nỞ bước thanh toán hoặc trong mục Thông tin công ty tại hồ sơ, bạn chỉ cần điền:\n- Tên công ty\n- Mã số thuế (MST)\n- Địa chỉ trụ sở và Email nhận hóa đơn\n\nHóa đơn điện tử sẽ được gửi tự động qua email ngay sau khi ca làm việc kết thúc!',
    suggestions: [
      {
        type: 'SERVICE',
        referenceId: 'srv-003',
        title: 'Vệ sinh văn phòng',
        subtitle: 'Xuất hóa đơn VAT điện tử',
        price: 250000,
      },
    ],
    createdAt: '2024-06-03T10:05:00Z',
  },
  {
    id: 'ai-msg-035',
    conversationId: 'ai-conv-008',
    role: 'USER',
    content: 'Công ty có thể thanh toán chuyển khoản trả sau hàng tháng không?',
    createdAt: '2024-06-03T10:08:00Z',
  },
  {
    id: 'ai-msg-036',
    conversationId: 'ai-conv-008',
    role: 'ASSISTANT',
    content:
      'Dạ với khách hàng doanh nghiệp ký hợp đồng định kỳ từ 3 tháng trở lên, CleanMaster hỗ trợ hình thức thanh toán công nợ cuối tháng chuyển khoản ngân hàng và xuất hóa đơn gộp tháng rất tiện lợi ạ.',
    createdAt: '2024-06-03T10:10:00Z',
  },

  // --- ai-conv-009: Khuyến mãi hôm nay ---
  {
    id: 'ai-msg-037',
    conversationId: 'ai-conv-009',
    role: 'USER',
    content: 'Hôm nay có những mã khuyến mãi nào tốt nhất?',
    createdAt: '2024-06-11T08:16:00Z',
  },
  {
    id: 'ai-msg-038',
    conversationId: 'ai-conv-009',
    role: 'ASSISTANT',
    content:
      'Chào bạn! Dưới đây là các mã ưu đãi hấp dẫn nhất đang áp dụng trong ngày hôm nay:\n\n1. **SUMMER20**: Giảm 20% (tối đa 50.000đ) cho đơn từ 200.000đ.\n2. **FLASH50K**: Giảm ngay 50.000đ cho khung giờ vàng sáng 08:00 - 11:00 (Sắp hết hạn trong 24h!).\n3. **CLEANHOME30**: Giảm thẳng 30.000đ cho đơn từ 300.000đ.\n4. **FREESHIP20**: Giảm 20.000đ phí di chuyển của nhân viên.',
    suggestions: [
      {
        type: 'PROMOTION',
        referenceId: 'promo-004',
        title: 'FLASH50K - Giảm 50.000đ',
        subtitle: 'Khung giờ vàng sáng',
      },
      {
        type: 'PROMOTION',
        referenceId: 'promo-001',
        title: 'SUMMER20 - Giảm 20%',
        subtitle: 'Áp dụng toàn sàn',
      },
    ],
    createdAt: '2024-06-11T08:20:00Z',
  },
  {
    id: 'ai-msg-039',
    conversationId: 'ai-conv-009',
    role: 'USER',
    content: 'Mình đặt đơn 320k thì dùng mã nào giảm được nhiều nhất?',
    createdAt: '2024-06-11T08:22:00Z',
  },
  {
    id: 'ai-msg-040',
    conversationId: 'ai-conv-009',
    role: 'ASSISTANT',
    content:
      'Với đơn 320.000đ đặt trong khung giờ sáng, bạn dùng mã **FLASH50K** sẽ được giảm tối đa **50.000đ** (tiết kiệm hơn so với SUMMER20 giảm 20% là 50.000đ nhưng FLASH50K trừ thẳng tiện lợi). Bạn chỉ cần thanh toán **270.000đ** thôi nhé!',
    createdAt: '2024-06-11T08:25:00Z',
  },

  // --- ai-conv-010: Khách hàng mới ---
  {
    id: 'ai-msg-041',
    conversationId: 'ai-conv-010',
    role: 'USER',
    content: 'Tôi là người mới dùng app lần đầu, cho tôi hỏi quy trình đặt dịch vụ như thế nào?',
    createdAt: '2024-06-01T12:16:00Z',
  },
  {
    id: 'ai-msg-042',
    conversationId: 'ai-conv-010',
    role: 'ASSISTANT',
    content:
      'Chào mừng bạn đến với đại gia đình CleanMaster! Quy trình đặt dịch vụ cực kỳ đơn giản chỉ với 4 bước:\n\n1. **Chọn dịch vụ**: Giúp việc theo giờ, Tổng vệ sinh, Nấu ăn...\n2. **Chọn gói & thời gian**: Chọn ngày và khung giờ bạn muốn nhân viên đến.\n3. **Chọn địa chỉ & phương thức**: Nhập địa chỉ nhà và chọn thanh toán Online hoặc Tiền mặt sau khi hoàn thành.\n4. **Xác nhận**: Nhân viên sẽ có mặt đúng giờ và bạn có thể theo dõi tiến độ trực tiếp trên ứng dụng!',
    suggestions: [
      {
        type: 'PROMOTION',
        referenceId: 'promo-002',
        title: 'Mã WELCOME10 - Giảm 10%',
        subtitle: 'Quà tặng dành riêng cho bạn mới',
      },
    ],
    createdAt: '2024-06-01T12:20:00Z',
  },
  {
    id: 'ai-msg-043',
    conversationId: 'ai-conv-010',
    role: 'USER',
    content: 'Tôi có cần phải ở nhà trông nhân viên làm không?',
    createdAt: '2024-06-01T12:25:00Z',
  },
  {
    id: 'ai-msg-044',
    conversationId: 'ai-conv-010',
    role: 'ASSISTANT',
    content:
      'Bạn hoàn toàn có thể yên tâm làm việc hoặc ra ngoài! 100% nhân viên CleanMaster đều được xác thực danh tính căn cước công dân và ký cam kết bảo đảm tài sản. Ngoài ra ứng dụng có tính năng định vị thời gian đến và bấm giờ làm việc minh bạch để bạn theo dõi từ xa.',
    createdAt: '2024-06-01T12:30:00Z',
  },

  // Additional system / helper AI messages to ensure 52+
  {
    id: 'ai-msg-045',
    conversationId: 'ai-conv-001',
    role: 'USER',
    content: 'Cảm ơn AI đã tư vấn rất kỹ.',
    createdAt: '2024-06-11T14:22:00Z',
  },
  {
    id: 'ai-msg-046',
    conversationId: 'ai-conv-001',
    role: 'ASSISTANT',
    content: 'Dạ rất vui được hỗ trợ bạn. Chúc bạn có một không gian sống thật sạch sẽ và thoải mái!',
    createdAt: '2024-06-11T14:23:00Z',
  },
  {
    id: 'ai-msg-047',
    conversationId: 'ai-conv-002',
    role: 'USER',
    content: 'Mình vừa bấm đặt đơn rồi nhé.',
    createdAt: '2024-06-10T10:18:00Z',
  },
  {
    id: 'ai-msg-048',
    conversationId: 'ai-conv-002',
    role: 'ASSISTANT',
    content: 'Dạ hệ thống đã nhận được đơn của bạn rồi ạ. Bạn có thể theo dõi nhân viên tại mục Lịch sử đơn hàng nhé.',
    createdAt: '2024-06-10T10:20:00Z',
  },
  {
    id: 'ai-msg-049',
    conversationId: 'ai-conv-003',
    role: 'USER',
    content: 'Ok mình sẽ chọn thêm dịch vụ khử mùi thú cưng.',
    createdAt: '2024-06-08T08:48:00Z',
  },
  {
    id: 'ai-msg-050',
    conversationId: 'ai-conv-003',
    role: 'ASSISTANT',
    content: 'Dạ tuyệt vời, nhân viên chuyên sofa sẽ mang tinh dầu hữu cơ đến xử lý sạch mùi cho bạn ạ.',
    createdAt: '2024-06-08T08:50:00Z',
  },
  {
    id: 'ai-msg-051',
    conversationId: 'ai-conv-004',
    role: 'USER',
    content: 'Chính sách rất rõ ràng, cảm ơn bạn.',
    createdAt: '2024-06-09T17:32:00Z',
  },
  {
    id: 'ai-msg-052',
    conversationId: 'ai-conv-004',
    role: 'ASSISTANT',
    content: 'Dạ không có gì ạ! Nếu cần hỗ trợ thêm bất kỳ điều gì, bạn cứ nhắn cho mình nhé.',
    createdAt: '2024-06-09T17:35:00Z',
  },
];
