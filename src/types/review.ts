export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  staffId: string;
  serviceId: string;
  rating: number; // 1 to 5
  comment: string;
  tags?: string[]; // e.g. ["Đúng giờ", "Nhiệt tình", "Sạch sẽ", "Cẩn thận"]
  images?: string[];
  createdAt: string;
}
