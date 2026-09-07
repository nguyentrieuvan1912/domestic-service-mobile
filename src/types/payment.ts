export type PaymentMethod = 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'CASH';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export interface Payment {
  id: string;
  bookingId: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionCode: string; // e.g. "TXN-2024-88910"
  paidAt?: string;
  createdAt: string;
}

export type RefundStatus = 'PENDING' | 'PROCESSED' | 'REJECTED';

export interface Refund {
  id: string;
  paymentId: string;
  bookingId: string;
  customerId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  createdAt: string;
  processedAt?: string;
  adminNote?: string;
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2024-001"
  bookingId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceAddress: string;
  serviceName: string;
  packageName: string;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  issuedAt: string;
  status: 'ISSUED' | 'PAID' | 'CANCELLED';
}
