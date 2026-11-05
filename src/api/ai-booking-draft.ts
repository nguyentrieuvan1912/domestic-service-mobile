import { operationRequest } from './operations';
import type { CatalogDetail } from './catalog-types';

export interface AiBookingDraft {
  id: number | null;
  expiresAt: string | null;
  data: {
    serviceId?: number;
    packageId?: number;
    quantity?: number;
    requiredStaffCount?: number;
    addressId?: number;
    startsAt?: string;
    addOnIds?: number[];
    promotionCode?: string;
    answers?: Record<string, unknown>;
  };
  missingSlots: string[];
  choices: {
    service?: { name?: string; serviceType?: string };
    packages: { id: number; name: string }[];
    requirements?: CatalogDetail['requirements'];
  };
}

export function loadAiBookingDraft(conversationId: string, signal?: AbortSignal) {
  return operationRequest<AiBookingDraft>('ai-assistant',
    '/conversations/' + encodeURIComponent(conversationId) + '/booking-draft', 'GET', undefined, signal);
}
