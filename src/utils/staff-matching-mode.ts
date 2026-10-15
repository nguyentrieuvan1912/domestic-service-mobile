import type { MatchingSnapshot } from '../types/staff-matching';

export function matchingModeCounts(data?: MatchingSnapshot) {
  return {
    A: data?.items.filter(item => item.opportunity.mode === 'A' && item.opportunity.invitedStaffId === data.context.actor.staffId).length || 0,
    B: data?.items.filter(item => item.opportunity.mode === 'B' && item.eligibility.allowed).length || 0,
  };
}
