import type { StaffCapabilityActor } from '../types/staff-capability';
import { StaffRepository } from './staffRepository';
export const MATCHING_DEMO_CONFIG = { latencyMs: 300, failNextLoad: false };
function wait(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(new Error('Đã hủy thao tác.')); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, MATCHING_DEMO_CONFIG.latencyMs);
    if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
  });
}
export const StaffMatchingRepository = {
  read(actor: StaffCapabilityActor, now = Date.now()) { return StaffRepository.getMatchingSnapshot(actor, now); },
  async load(actor: StaffCapabilityActor, signal?: AbortSignal) {
    await wait(signal);
    if (signal?.aborted) throw new Error('Đã hủy thao tác.');
    const snapshot = this.read(actor);
    if (MATCHING_DEMO_CONFIG.failNextLoad) { MATCHING_DEMO_CONFIG.failNextLoad = false; throw new Error('Chưa tải được việc phù hợp. Vui lòng thử lại.'); }
    return snapshot;
  },
  eligibility(actor: StaffCapabilityActor, id: string) {
    this.read(actor); // Validate the userId–staffId pair before any domain read/mutation.
    return StaffRepository.getOpportunityEligibility(actor.staffId, id);
  },
  detail(actor: StaffCapabilityActor, id: string) { return StaffRepository.getMatchingOpportunity(actor, id); },
  async claim(actor: StaffCapabilityActor, id: string, signal?: AbortSignal) {
    await wait(signal);
    if (signal?.aborted) throw new Error('Đã hủy thao tác.');
    this.read(actor);
    return StaffRepository.claimOpportunity(actor.staffId, id);
  },
  setOnline(actor: StaffCapabilityActor, value: boolean) {
    this.read(actor);
    StaffRepository.setOnline(actor.staffId, value);
  },
};
