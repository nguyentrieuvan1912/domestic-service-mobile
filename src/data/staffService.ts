import {
  StaffRepository,
  AcceptedAssignment,
  OpenOpportunity,
  StaffJobItem,
  StaffWalletTransaction,
  StaffWalletBalance,
  StaffAvailabilitySlot,
  StaffOperationalProfile,
  ClaimOpportunityResult,
  JobDetailResult,
} from './staffRepository';
import {
  JobStepStatus,
  isValidJobTransition,
  validateJobTransition,
  calculateCompletionCredit,
  isTerminalStatus,
} from './staffStateTransitions';
import {
  StaffId,
  UserId,
  getStaffIdByUserId,
  getUserIdByStaffId,
  isStaffUser,
  STAFF_USER_MAPPINGS,
} from './staffMapping';

export type {
  JobStepStatus,
  AcceptedAssignment,
  OpenOpportunity,
  StaffJobItem,
  StaffWalletTransaction,
  StaffWalletBalance,
  StaffAvailabilitySlot,
  StaffOperationalProfile,
  ClaimOpportunityResult,
  JobDetailResult,
  StaffId,
  UserId,
};

export {
  StaffRepository,
  isValidJobTransition,
  validateJobTransition,
  calculateCompletionCredit,
  isTerminalStatus,
  getStaffIdByUserId,
  getUserIdByStaffId,
  isStaffUser,
  STAFF_USER_MAPPINGS,
};

const DEFAULT_STAFF_ID = 'staff-001';

/**
 * StaffService facade delegating to scoped StaffRepository.
 * Maintains backwards compatibility for components while enforcing repository scoping and immutability.
 */
export const StaffService = {
  subscribe(fn: () => void) {
    return StaffRepository.subscribe(fn);
  },

  getJobs(staffId: string = DEFAULT_STAFF_ID): StaffJobItem[] {
    return StaffRepository.getAssignments(staffId);
  },

  getOpenShifts(): OpenOpportunity[] {
    return StaffRepository.getOpenOpportunities();
  },

  getJobById(id: string, staffId: string = DEFAULT_STAFF_ID): StaffJobItem | OpenOpportunity | undefined {
    const result = StaffRepository.getJobDetail(staffId, id);
    if (result.kind === 'ASSIGNMENT') return result.assignment;
    if (result.kind === 'OPEN_OPPORTUNITY') return result.opportunity;
    return undefined;
  },

  getJobDetail(staffId: string = DEFAULT_STAFF_ID, id: string): JobDetailResult {
    return StaffRepository.getJobDetail(staffId, id);
  },

  getActiveJob(staffId: string = DEFAULT_STAFF_ID): StaffJobItem | undefined {
    const jobs = StaffRepository.getAssignments(staffId);
    return jobs.find((j) => j.status === 'IN_PROGRESS' || j.status === 'EN_ROUTE');
  },

  getUpcomingJobs(staffId: string = DEFAULT_STAFF_ID): StaffJobItem[] {
    const jobs = StaffRepository.getAssignments(staffId);
    return jobs.filter((j) => j.status === 'ACCEPTED' || j.status === 'EN_ROUTE' || j.status === 'IN_PROGRESS');
  },

  getCompletedJobs(staffId: string = DEFAULT_STAFF_ID): StaffJobItem[] {
    const jobs = StaffRepository.getAssignments(staffId);
    return jobs.filter((j) => j.status === 'COMPLETED');
  },

  claimOpenShift(shiftId: string, staffId: string = DEFAULT_STAFF_ID): ClaimOpportunityResult {
    return StaffRepository.claimOpportunity(staffId, shiftId);
  },

  updateJobStatus(
    jobId: string,
    status: JobStepStatus,
    staffId: string = DEFAULT_STAFF_ID
  ): { success: boolean; reason?: string; assignment?: AcceptedAssignment } {
    return StaffRepository.updateJobStatus(staffId, jobId, status);
  },

  toggleChecklistItem(jobId: string, checkId: string, staffId: string = DEFAULT_STAFF_ID) {
    return StaffRepository.toggleChecklistItem(staffId, jobId, checkId);
  },

  getWallet(staffId: string = DEFAULT_STAFF_ID) {
    return StaffRepository.getWallet(staffId);
  },

  withdrawMoney(
    amount: number,
    bankName: string,
    accountNumber: string,
    staffId: string = DEFAULT_STAFF_ID
  ): boolean {
    return StaffRepository.withdrawMoney(staffId, amount, bankName, accountNumber);
  },

  getAvailability(staffId: string = DEFAULT_STAFF_ID) {
    return StaffRepository.getAvailability(staffId);
  },

  toggleShiftSlot(slotId: string, staffId: string = DEFAULT_STAFF_ID) {
    StaffRepository.toggleShiftSlot(staffId, slotId);
  },

  updateOperatingAreas(
    settings: {
      autoAccept?: boolean;
      maxDistanceKm?: number;
      primaryDistrict?: string;
      selectedDistricts?: string[];
      operatingDistricts?: string[];
    },
    staffId: string = DEFAULT_STAFF_ID
  ) {
    StaffRepository.updateOperatingAreas(staffId, settings);
  },

  getOperationalProfile(staffId: string = DEFAULT_STAFF_ID): StaffOperationalProfile {
    return StaffRepository.getOperationalProfile(staffId);
  },

  setOnline(isOnline: boolean, staffId: string = DEFAULT_STAFF_ID): void {
    StaffRepository.setOnline(staffId, isOnline);
  },

  getStaffReviews(staffId: string = DEFAULT_STAFF_ID) {
    return StaffRepository.getStaffReviews(staffId);
  },
};
