import type { AvailabilitySnapshot } from './staff-availability';
import type { StaffCapabilityActor, StaffCapabilitySnapshot } from './staff-capability';
import type { StaffStatus } from './user';

// Local UI proposal, separate from the draft Booking DTO/enum.
export type MatchReasonCode = 'INVALID_ACTOR' | 'INACTIVE' | 'OFFLINE' | 'RESTRICTION'
  | 'CAPABILITY_MISSING' | 'CAPABILITY_INVALID' | 'AREA_OUTSIDE' | 'NO_AVAILABILITY'
  | 'OUTSIDE_AVAILABILITY' | 'BOOKING_CONFLICT' | 'SCHEDULE_INVALID' | 'TIME_INVALID'
  | 'OUTSIDE_WINDOW' | 'PAST_START' | 'POSITION_FULL' | 'ALREADY_ASSIGNED' | 'NOT_INVITED';
export interface MatchReason { code: MatchReasonCode; message: string }
export interface MatchCheck { code: string; label: string; passed: boolean; detail: string }
export interface MatchEligibility { allowed: boolean; reasons: MatchReason[]; checks: MatchCheck[] }
export interface MatchContext {
  actor: StaffCapabilityActor; userActive: boolean; staffStatus: StaffStatus; isOnline: boolean;
  capabilities: StaffCapabilitySnapshot; schedule: AvailabilitySnapshot;
}
// Whitelist: no customer contact, precise address, avatar or free-text notes before assignment.
export interface MatchingOpportunity {
  id: string; bookingCode: string; serviceId: string; serviceName: string; serviceIcon?: string;
  district: string; startsAt: string; endsAt: string; packageTitle: string; addOnsText?: string;
  netIncome: number; mode: 'A' | 'B'; positionsRequired: number; positionsRemaining: number;
  requiredCapabilities: string[]; invitedStaffId?: string;
  // No current fixture has coordinates or a verified distance source; numeric legacy distances are omitted.
  distance?: { km: number; source: string };
}
export interface MatchItem { opportunity: MatchingOpportunity; eligibility: MatchEligibility }
export interface MatchingSnapshot { context: MatchContext; items: MatchItem[]; checkedAt: string; revision: number }
export type MatchingSort = 'START_TIME' | 'INCOME';
export interface MatchingFilter { query: string; district: string; sort: MatchingSort }
