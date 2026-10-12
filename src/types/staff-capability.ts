// Local read model until Booking's capability DTO/visibility contract is agreed.
// Approval statuses mirror the existing DB vocabulary; presentation states are separate.
export type CapabilityApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INACTIVE';
export type CapabilityDisplayState = 'VALID' | 'PENDING' | 'REJECTED' | 'INACTIVE' | 'EXPIRED' | 'NOT_YET_VALID' | 'SUSPENDED';
export interface StaffCapabilityActor { userId: string; staffId: string }
export interface StaffCapabilityRecord {
  id: string; staffId: string; serviceId: string; serviceName: string;
  experienceYears: number;
  status: CapabilityApprovalStatus;
  approvedAt?: string; approvedByName?: string; note?: string;
  staffMayViewApproval: boolean; staffMayViewNote: boolean;
  scope: readonly string[];
  validFrom?: string; validUntil?: string;
}
export interface CapabilityRestrictionRecord {
  id: string; staffId: string; type: 'WARNING' | 'SERVICE_LIMIT' | 'SUSPENSION';
  serviceId?: string;
  reason: string; startsAt: string; endsAt?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}
export interface CapabilityRestrictionView extends CapabilityRestrictionRecord {
  isActive: boolean; blocksReceiving: boolean; statusLabel: string;
}
export interface StaffCapabilityView {
  id: string; serviceId: string; serviceName: string; experienceYears: number;
  approvalLabel: string; state: CapabilityDisplayState; stateLabel: string;
  canReceive: boolean; reason?: string;
  approvedAt?: string; approvedByName?: string; note?: string;
  scope: readonly string[]; validFrom?: string; validUntil?: string;
  restrictions: readonly CapabilityRestrictionView[];
}
export interface StaffCapabilitySnapshot {
  capabilities: readonly StaffCapabilityView[];
  restrictions: readonly CapabilityRestrictionView[];
  eligibleCount: number; checkedAt: string;
}
