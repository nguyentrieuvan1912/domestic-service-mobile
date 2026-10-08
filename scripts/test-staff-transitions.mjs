import assert from 'node:assert/strict';
import {
  isValidJobTransition,
  isTerminalStatus,
  validateJobTransition,
  calculateCompletionCredit,
} from '../src/data/staffStateTransitions.ts';
import {
  getStaffIdByUserId,
  getUserIdByStaffId,
  isStaffUser,
} from '../src/data/staffMapping.ts';

console.log('=== RUNNING STAFF DOMAIN & TRANSITIONS SUITE ===\n');

// Group 1: User ID <-> Staff ID Typed Mapping
console.log('Group 1: Typed Mapping (UserId <-> StaffId)');
assert.equal(getStaffIdByUserId('user-s01'), 'staff-001');
assert.equal(getUserIdByStaffId('staff-001'), 'user-s01');
assert.equal(getStaffIdByUserId('user-s05'), 'staff-005');
assert.equal(getUserIdByStaffId('staff-005'), 'user-s05');
assert.equal(getStaffIdByUserId('user-c01'), undefined, 'Customer ID must not map to staff');
assert.equal(isStaffUser('user-s01'), true);
assert.equal(isStaffUser('user-c01'), false);
console.log('✓ Group 1: All mapping tests passed\n');

// Group 2: Terminal Statuses
console.log('Group 2: Terminal Status Guards');
assert.equal(isTerminalStatus('COMPLETED'), true, 'COMPLETED must be terminal');
assert.equal(isTerminalStatus('CANCELLED'), true, 'CANCELLED must be terminal');
assert.equal(isTerminalStatus('ACCEPTED'), false, 'ACCEPTED is not terminal');
assert.equal(isTerminalStatus('EN_ROUTE'), false, 'EN_ROUTE is not terminal');
assert.equal(isTerminalStatus('IN_PROGRESS'), false, 'IN_PROGRESS is not terminal');
console.log('✓ Group 2: Terminal status guards passed\n');

// Group 3: Valid State Transitions
console.log('Group 3: Valid Job Progressions');
assert.equal(isValidJobTransition('ACCEPTED', 'EN_ROUTE'), true);
assert.equal(isValidJobTransition('EN_ROUTE', 'IN_PROGRESS'), true);
assert.equal(isValidJobTransition('IN_PROGRESS', 'COMPLETED'), true);
assert.equal(isValidJobTransition('ACCEPTED', 'CANCELLED'), true);
assert.equal(isValidJobTransition('EN_ROUTE', 'CANCELLED'), true);
assert.equal(isValidJobTransition('IN_PROGRESS', 'CANCELLED'), true);
console.log('✓ Group 3: Valid transitions passed\n');

// Group 4: Invalid State Transitions
console.log('Group 4: Invalid State Transitions');
assert.equal(isValidJobTransition('ACCEPTED', 'COMPLETED'), false, 'Cannot skip directly from ACCEPTED to COMPLETED');
assert.equal(isValidJobTransition('EN_ROUTE', 'ACCEPTED'), false, 'Cannot go backwards from EN_ROUTE to ACCEPTED');
assert.equal(isValidJobTransition('IN_PROGRESS', 'ACCEPTED'), false, 'Cannot go backwards from IN_PROGRESS to ACCEPTED');
assert.equal(isValidJobTransition('COMPLETED', 'IN_PROGRESS'), false, 'Terminal COMPLETED cannot transition');
assert.equal(isValidJobTransition('COMPLETED', 'COMPLETED'), false, 'Terminal COMPLETED cannot re-complete');
assert.equal(isValidJobTransition('CANCELLED', 'ACCEPTED'), false, 'Terminal CANCELLED cannot revive');
console.log('✓ Group 4: Invalid transition blocks passed\n');

// Group 5: Operator Authorization Guard & Non-existent Job
console.log('Group 5: Authorization & Existence Guards');
const staff1Job = { staffId: 'staff-001', status: 'IN_PROGRESS' };
const resStaff2 = validateJobTransition(staff1Job, 'staff-005', 'COMPLETED');
assert.equal(resStaff2.valid, false);
assert.equal(resStaff2.errorCode, 'FORBIDDEN');

const resNotFound = validateJobTransition(null, 'staff-001', 'EN_ROUTE');
assert.equal(resNotFound.valid, false);
assert.equal(resNotFound.errorCode, 'NOT_FOUND');

const completedJob = { staffId: 'staff-001', status: 'COMPLETED' };
const resTerminal = validateJobTransition(completedJob, 'staff-001', 'COMPLETED');
assert.equal(resTerminal.valid, false);
assert.equal(resTerminal.errorCode, 'TERMINAL_STATE');
console.log('✓ Group 5: Authorization and existence guards passed\n');

// Group 6: Wallet Credit Idempotency (Prevent Duplicate Income)
console.log('Group 6: Idempotent Wallet Completion');
const initialAvailable = 1000000;
const initialTotal = 5000000;
const netIncome = 272000;
const bookingId = 'bk-023';
const creditedSet = new Set(['bk-001', 'bk-015']);

// First credit
const credit1 = calculateCompletionCredit(initialAvailable, initialTotal, netIncome, bookingId, creditedSet);
assert.equal(credit1.credited, true);
assert.equal(credit1.nextAvailableBalance, 1272000);
assert.equal(credit1.nextTotalEarned, 5272000);

// Add to credited set
creditedSet.add(bookingId);

// Duplicate completion call for the same booking
const credit2 = calculateCompletionCredit(credit1.nextAvailableBalance, credit1.nextTotalEarned, netIncome, bookingId, creditedSet);
assert.equal(credit2.credited, false, 'Duplicate completion must NOT credit again');
assert.equal(credit2.reason, 'ALREADY_CREDITED');
assert.equal(credit2.nextAvailableBalance, credit1.nextAvailableBalance, 'Balance must stay identical');
assert.equal(credit2.nextTotalEarned, credit1.nextTotalEarned, 'Total earned must stay identical');

// Invalid amount test
const creditZero = calculateCompletionCredit(credit1.nextAvailableBalance, credit1.nextTotalEarned, 0, 'bk-new', creditedSet);
assert.equal(creditZero.credited, false);
assert.equal(creditZero.reason, 'INVALID_AMOUNT');
console.log('✓ Group 6: Idempotent wallet completion passed\n');

console.log('=== ALL 6 TEST GROUPS COMPLETED SUCCESSFULLY ===');
