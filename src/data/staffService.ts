import { operationSession } from '@/api/operations';
import { StaffRepository } from './connectedStaffRepository';
import type {
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
import { selectMatchingItems, STAFF_MATCHING_POLICY } from './staffMatchingRules';
import type { MatchingOpportunity } from '../types/staff-matching';

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

const activeStaffId = () => operationSession()?.profile.role === 'STAFF' ? operationSession()!.userId : '';

/**
 * StaffService facade delegating to scoped StaffRepository.
 * Maintains backwards compatibility for components while enforcing repository scoping and immutability.
 */
export const StaffService = {
  load: StaffRepository.load,
  refreshWallet: StaffRepository.refreshWallet,
  getBankAccounts: StaffRepository.getBankAccounts,
  addBank: StaffRepository.addBank,
  reportIssue: StaffRepository.reportIssue,
  getLoadState: StaffRepository.getLoadState,
  subscribe(fn: () => void) {
    return StaffRepository.subscribe(fn);
  },

  getJobs(staffId: string = activeStaffId()): StaffJobItem[] {
    return StaffRepository.getAssignments(staffId);
  },

  getOpenShifts(staffId: string): MatchingOpportunity[] {
    const userId = /^\d+$/.test(staffId) ? staffId : getUserIdByStaffId(staffId);
    if (!userId) return [];
    return selectMatchingItems(StaffRepository.getMatchingSnapshot({ userId, staffId }),
      { query: '', district: 'Tất cả', sort: STAFF_MATCHING_POLICY.defaultSort }).map(item => item.opportunity);
  },

  getJobById(id: string, staffId: string = activeStaffId()): StaffJobItem | OpenOpportunity | undefined {
    const result = StaffRepository.getJobDetail(staffId, id);
    if (result.kind === 'ASSIGNMENT') return result.assignment;
    if (result.kind === 'OPEN_OPPORTUNITY') return result.opportunity;
    return undefined;
  },

  getJobDetail(staffId: string = activeStaffId(), id: string): JobDetailResult {
    return StaffRepository.getJobDetail(staffId, id);
  },

  getActiveJob(staffId: string = activeStaffId()): StaffJobItem | undefined {
    const jobs = StaffRepository.getAssignments(staffId);
    return jobs.find((j) => j.status === 'IN_PROGRESS' || j.status === 'EN_ROUTE');
  },

  getUpcomingJobs(staffId: string = activeStaffId()): StaffJobItem[] {
    const jobs = StaffRepository.getAssignments(staffId);
    return jobs.filter((j) => j.status === 'ACCEPTED' || j.status === 'EN_ROUTE' || j.status === 'IN_PROGRESS');
  },

  getCompletedJobs(staffId: string = activeStaffId()): StaffJobItem[] {
    const jobs = StaffRepository.getAssignments(staffId);
    return jobs.filter((j) => j.status === 'COMPLETED');
  },

  claimOpenShift(shiftId: string, staffId: string = activeStaffId()): Promise<ClaimOpportunityResult> {
    return StaffRepository.claimOpportunity(staffId, shiftId);
  },

  updateJobStatus(
    jobId: string,
    status: JobStepStatus,
    staffId: string = activeStaffId()
  ) {
    return StaffRepository.updateJobStatus(staffId, jobId, status);
  },

  toggleChecklistItem(jobId: string, checkId: string, staffId: string = activeStaffId()) {
    return StaffRepository.toggleChecklistItem(staffId, jobId, checkId);
  },

  getWallet(staffId: string = activeStaffId()) {
    return StaffRepository.getWallet(staffId);
  },

  cancelWithdrawal(id: number, staffId: string = activeStaffId()) { return StaffRepository.cancelWithdrawal(staffId, id); },

  withdrawMoney(
    amount: number,
    bankName: string,
    accountNumber: string,
    staffId: string = activeStaffId(),
    requestKey: string = `withdraw-${Date.now()}`
  ) {
    return StaffRepository.withdrawMoney(staffId, amount, bankName, accountNumber, requestKey);
  },

  getAvailability(staffId: string = activeStaffId()) {
    return StaffRepository.getAvailability(staffId);
  },
  getScheduleSnapshot(staffId: string = activeStaffId()) {
    return StaffRepository.getScheduleSnapshot(staffId);
  },

  toggleShiftSlot(slotId: string, staffId: string = activeStaffId()) {
    return StaffRepository.toggleShiftSlot();
  },

  updateOperatingAreas(
    settings: {
      autoAccept?: boolean;
      maxDistanceKm?: number;
      primaryDistrict?: string;
      selectedDistricts?: string[];
      operatingDistricts?: string[];
    },
    staffId: string = activeStaffId()
  ) {
    return StaffRepository.updateOperatingAreas();
  },

  getOperationalProfile(staffId: string = activeStaffId()): StaffOperationalProfile {
    return StaffRepository.getOperationalProfile(staffId);
  },

  setOnline(isOnline: boolean, staffId: string = activeStaffId()) {
    return StaffRepository.setOnline(staffId, isOnline);
  },

  getStaffReviews(staffId: string = activeStaffId()) {
    return StaffRepository.getStaffReviews(staffId);
  },
};
