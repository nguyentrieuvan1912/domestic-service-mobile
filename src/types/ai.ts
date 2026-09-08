export type AIRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface AISuggestion {
  type: 'SERVICE' | 'PACKAGE' | 'ADDON' | 'PROMOTION' | 'BOOKING_ACTION';
  referenceId: string;
  title: string;
  subtitle?: string;
  price?: number;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: AIRole;
  content: string;
  suggestions?: AISuggestion[];
  createdAt: string;
}

export interface AIConversation {
  id: string;
  customerId: string;
  title: string; // e.g. "Tư vấn dọn nhà chung cư 70m2"
  lastMessage: string;
  lastMessageTime: string;
  createdAt: string;
}
