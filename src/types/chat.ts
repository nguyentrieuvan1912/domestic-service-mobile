export type MessageSenderType = 'CUSTOMER' | 'STAFF' | 'SYSTEM';

export type MessageContentType = 'TEXT' | 'IMAGE' | 'LOCATION';

export interface ChatMessage {
  id: string;
  clientKey?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderType: MessageSenderType;
  content: string;
  contentType: MessageContentType;
  mediaUrl?: string;
  isRead: boolean;
  sentAt: string;
}

export interface Conversation {
  customerTrashedAt?: string | null;
  customerDeletedThroughId?: number;
  id: string;
  bookingId: string;
  bookingCode?: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  staffId: string;
  staffName: string;
  staffAvatar: string;
  serviceName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCountCustomer: number;
  unreadCountStaff: number;
  createdAt: string;
}
