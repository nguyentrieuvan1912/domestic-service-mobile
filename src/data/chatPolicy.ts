import type { ChatMessage } from '../types/chat';

export const CHAT_TIME_ZONE = 'Asia/Ho_Chi_Minh';

// Presentation policy only. Booking DTO enums remain owned by the booking contract.
export type ChatBookingPhase = 'ACTIVE' | 'AWAITING_ACCEPTANCE' | 'CLOSED';
export interface ChatPolicy {
  allowWhileAwaitingAcceptance: boolean;
}
export const DEFAULT_CHAT_POLICY: Readonly<ChatPolicy> = {
  allowWhileAwaitingAcceptance: true,
};

export interface ChatActor {
  userId: string;
  participantId: string;
  role: 'CUSTOMER' | 'STAFF';
  name: string;
  avatar: string;
}

export function getChatBookingPhase(status: string, awaitingAcceptance = false): ChatBookingPhase {
  if (['COMPLETED', 'CANCELLED', 'ABSENT', 'REJECTED', 'REFUNDING', 'REFUNDED', 'NO_STAFF_FOUND'].includes(status)) {
    return 'CLOSED';
  }
  if (status === 'IN_PROGRESS' && awaitingAcceptance) return 'AWAITING_ACCEPTANCE';
  return ['ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS', 'CONFIRMED', 'STAFF_ASSIGNED', 'ASSIGNED'].includes(status) ? 'ACTIVE' : 'CLOSED';
}

export function canSendChat(phase: ChatBookingPhase, policy: ChatPolicy = DEFAULT_CHAT_POLICY): boolean {
  return phase === 'ACTIVE' || (phase === 'AWAITING_ACCEPTANCE' && policy.allowWhileAwaitingAcceptance);
}

export function isOwnChatMessage(message: ChatMessage, actor: ChatActor): boolean {
  // Legacy fixtures store domain IDs; AuthContext stores account IDs.
  return message.senderType === actor.role &&
    (message.senderId === actor.participantId || message.senderId === actor.userId);
}

export const CHAT_PHASE_LABELS: Record<ChatBookingPhase, string> = {
  ACTIVE: 'Ca đang hoạt động',
  AWAITING_ACCEPTANCE: 'Chờ nghiệm thu',
  CLOSED: 'Ca đã kết thúc',
};
