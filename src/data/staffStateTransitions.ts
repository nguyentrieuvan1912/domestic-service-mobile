export type JobStepStatus = 'ACCEPTED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export const TERMINAL_STATUSES: ReadonlySet<JobStepStatus> = new Set(['COMPLETED', 'CANCELLED']);

export const ALLOWED_STATUS_TRANSITIONS: Readonly<Record<JobStepStatus, readonly JobStepStatus[]>> = {
  ACCEPTED: ['EN_ROUTE', 'CANCELLED'],
  EN_ROUTE: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function isTerminalStatus(status: JobStepStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function isValidJobTransition(currentStatus: JobStepStatus, nextStatus: JobStepStatus): boolean {
  if (isTerminalStatus(currentStatus)) {
    return false;
  }
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(nextStatus) : false;
}

export interface TransitionValidationResult {
  valid: boolean;
  reason?: string;
  errorCode?: 'NOT_FOUND' | 'FORBIDDEN' | 'TERMINAL_STATE' | 'INVALID_TRANSITION';
}

/**
 * Validates if the given operator is authorized and if the requested state transition is valid.
 */
export function validateJobTransition(
  assignment: { staffId: string; status: JobStepStatus } | null | undefined,
  operatorStaffId: string,
  nextStatus: JobStepStatus
): TransitionValidationResult {
  if (!assignment) {
    return {
      valid: false,
      reason: 'Ca làm việc không tồn tại trong hệ thống.',
      errorCode: 'NOT_FOUND',
    };
  }

  if (assignment.staffId !== operatorStaffId) {
    return {
      valid: false,
      reason: 'Bạn không có quyền thao tác trên ca làm việc của nhân viên khác.',
      errorCode: 'FORBIDDEN',
    };
  }

  if (isTerminalStatus(assignment.status)) {
    return {
      valid: false,
      reason: `Ca làm việc đã ở trạng thái kết thúc (${assignment.status}) và không thể chuyển trạng thái tiếp.`,
      errorCode: 'TERMINAL_STATE',
    };
  }

  if (!isValidJobTransition(assignment.status, nextStatus)) {
    return {
      valid: false,
      reason: `Không thể chuyển trạng thái ca làm từ "${assignment.status}" sang "${nextStatus}".`,
      errorCode: 'INVALID_TRANSITION',
    };
  }

  return { valid: true };
}

export interface WalletCreditResult {
  credited: boolean;
  reason?: 'ALREADY_CREDITED' | 'INVALID_AMOUNT';
  nextAvailableBalance: number;
  nextTotalEarned: number;
}

/**
 * Pure function to calculate wallet balance after job completion.
 * Ensures strict idempotency: duplicate completion calls for the same bookingId DO NOT credit balance a second time.
 */
export function calculateCompletionCredit(
  currentAvailable: number,
  currentTotal: number,
  netIncome: number,
  bookingId: string,
  creditedBookingIds: ReadonlySet<string>
): WalletCreditResult {
  if (creditedBookingIds.has(bookingId)) {
    return {
      credited: false,
      reason: 'ALREADY_CREDITED',
      nextAvailableBalance: currentAvailable,
      nextTotalEarned: currentTotal,
    };
  }

  if (netIncome <= 0) {
    return {
      credited: false,
      reason: 'INVALID_AMOUNT',
      nextAvailableBalance: currentAvailable,
      nextTotalEarned: currentTotal,
    };
  }

  return {
    credited: true,
    nextAvailableBalance: currentAvailable + netIncome,
    nextTotalEarned: currentTotal + netIncome,
  };
}
