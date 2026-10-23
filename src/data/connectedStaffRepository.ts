import { STAFF_AREA_OPTIONS, areaNamesForIds } from './staffAreas';
import { reuseSnapshot } from '@/utils/stable-snapshot';
import { saveAvailabilityWithReadback } from '@/utils/availability-save';
import { displayTime, localDate } from './staffAvailabilityRules';
import { ChatRepository } from './connectedChatRepository';
import { loadHcmAdministrativeUnits } from '@/api/administrative-units';
import { operationRequest, operationSession, subscribeSession } from '@/api/operations';
import { adaptCapabilityRestriction, adaptStaffCapability } from './staffCapabilityAdapter';
import type { AcceptedAssignment, OpenOpportunity, StaffOperationalProfile, StaffWalletBalance, StaffWalletTransaction, JobDetailResult, ClaimOpportunityResult } from './staffRepository';
import type { AvailabilityActor, AvailabilityDraft, AvailabilitySnapshot } from '@/types/staff-availability';
import type { StaffCapabilityActor, StaffCapabilityRecord, CapabilityRestrictionRecord, StaffCapabilitySnapshot } from '@/types/staff-capability';
import type { MatchingSnapshot, MatchItem } from '@/types/staff-matching';
import type { JobStepStatus } from './staffStateTransitions';

type WalletResponse = { balance: StaffWalletBalance; incomes: {bookingId:number;staffAmount:number;platformFee:number;status:string}[]; transactions: { id: number; type: string; direction: string; bucket: string; amount: number; createdAt: string }[]; withdrawals: { id: number; amount: number; status: string; requestedAt: string }[] };
type Bank = { id: string; bankCode: string; accountNumber: string; accountHolder: string; status: string; isDefault: boolean };
const listeners = new Set<() => void>();
let revision = 0, owner = '', loaded = false, failure = '', loading: Promise<void> | null = null;
let assignments: AcceptedAssignment[] = [], matchItems: MatchItem[] = [];
let records: StaffCapabilityRecord[] = [], restrictions: CapabilityRestrictionRecord[] = [];
let banks: Bank[] = [];
let reviews: { id: string; customerName: string; customerAvatar: string; rating: number; comment: string; createdAt: string; tags: string[] }[] = [];
let balance: StaffWalletBalance = { available: 0, pending: 0, totalEarned: 0, withdrawn: 0 };
let transactions: StaffWalletTransaction[] = [];
const initialSchedule = (): AvailabilitySnapshot => ({ saved: { days: [], areaIds: [], matchNotifications: true, revision: 0, updatedAt: '' }, bookings: [], unknownBookingCodes: [] });
let schedule = initialSchedule();
let scheduleLoaded = false, scheduleFailure = '', scheduleLoading: Promise<void> | null = null;
function areaView(value: AvailabilitySnapshot): AvailabilitySnapshot { return { ...value, saved: { ...value.saved, areaIds: value.saved.areaIds.map(name => STAFF_AREA_OPTIONS.find(item => item.name === name.replace(/^Quận (?=[^0-9])/, ''))?.id || name) }, bookings: value.bookings.map(item => ({ ...item, id: String(item.id) })) }; }
function notify() { revision++; listeners.forEach(listener => { try { listener(); } catch { /* A role change can unmount a previously scoped subscriber. */ } }); }
subscribeSession(() => {
  const active = operationSession(); const next = active?.profile.role === 'STAFF' ? active.userId : '';
  if (next !== owner) { owner = next; loaded = false; failure = ''; assignments = []; matchItems = []; records = []; restrictions = []; banks = []; reviews = []; balance = { available: 0, pending: 0, totalEarned: 0, withdrawn: 0 }; transactions = []; schedule = initialSchedule(); loading = null; scheduleLoaded = false; scheduleFailure = ''; scheduleLoading = null; }
  notify();
});
function assertStaff(id?: string) { const active = operationSession(); if (!active || active.profile.role !== 'STAFF' || id && active.userId !== id) throw new Error('Vui lòng đăng nhập đúng tài khoản nhân viên.'); return active; }
function actor(actor: StaffCapabilityActor | AvailabilityActor | null) { if (!actor || actor.staffId !== actor.userId) throw new Error('Tài khoản không khớp hồ sơ nhân viên.'); return assertStaff(actor.staffId); }
function capabilitySnapshot(): StaffCapabilitySnapshot {
  const now = Date.now(), views = restrictions.map(item => adaptCapabilityRestriction(item, now));
  const capabilities = records.map(item => adaptStaffCapability(item, views, now));
  return { capabilities, restrictions: views, eligibleCount: capabilities.filter(item => item.canReceive).length, checkedAt: new Date(now).toISOString() };
}
const assignmentView = (item: Record<string, unknown>): AcceptedAssignment => ({ ...item, id: String(item.id), staffId: String(item.staffId), customerId: String(item.customerId), serviceId: String(item.serviceId), conversationId: item.conversationId == null ? undefined : String(item.conversationId) } as unknown as AcceptedAssignment);
async function loadSchedule(signal?: AbortSignal) {
  const active = assertStaff();
  if (scheduleLoading) return scheduleLoading;
  const task = (async () => {
    try {
      const raw = await operationRequest<AvailabilitySnapshot>('booking', '/staff/me/availability', 'GET', undefined, signal);
      if (active.token !== operationSession()?.token || signal?.aborted) return;
      // A pending read must not replace a newer schedule saved while it was in flight.
      const nextSchedule = !scheduleLoaded || raw.saved.revision >= schedule.saved.revision ? reuseSnapshot(schedule, areaView(raw)) : schedule;
      const changed=nextSchedule !== schedule || !scheduleLoaded || !!scheduleFailure;
      schedule=nextSchedule; scheduleLoaded = true; scheduleFailure = '';
      if(changed) notify();
    } catch (error) {
      if (active.token !== operationSession()?.token || signal?.aborted) return;
      scheduleFailure = error instanceof Error ? error.message : 'Chưa kiểm tra được lịch làm việc.';
      notify(); throw error;
    }
  })();
  scheduleLoading = task;
  try { await task; } finally { if (scheduleLoading === task) scheduleLoading = null; }
}
function applyWallet(wallet: WalletResponse) {
      balance = wallet.balance;
      transactions = wallet.transactions.filter(item => item.bucket === 'AVAILABLE' && !['HOLD', 'RELEASE'].includes(item.type)).map(item => ({ id: String(item.id), title: item.type === 'TOP_UP' ? 'Nạp tiền chuyển khoản' : item.type === 'EARNING' ? 'Thu nhập ca làm' : item.type === 'REWARD' ? 'Thưởng' : item.type === 'PENALTY' ? 'Khoản phạt' : 'Bút toán ' + item.type, date: new Date(item.createdAt).toLocaleString('vi-VN'), amount: item.amount, type: item.type === 'TOP_UP' ? 'TOP_UP' : item.type === 'EARNING' ? 'INCOME' : item.type === 'REWARD' ? 'BONUS' : 'FEE', status: 'SUCCESS' }));
      transactions.push(...wallet.withdrawals.map(item => ({ id: 'withdrawal-' + item.id, title: 'Yêu cầu rút tiền', date: new Date(item.requestedAt).toLocaleString('vi-VN'), amount: item.amount, type: 'WITHDRAW' as const, status: item.status === 'PAID' ? 'SUCCESS' as const : ['REJECTED','FAILED','CANCELLED'].includes(item.status) ? 'FAILED' as const : 'PENDING' as const })));
}
async function refreshWallet(signal?: AbortSignal) {
  const active = assertStaff();
  const [wallet, rawBanks] = await Promise.all([operationRequest<WalletResponse>('finance', '/staff/me/wallet', 'GET', undefined, signal), operationRequest<(Omit<Bank, 'id'> & { id: number })[]>('finance', '/staff/me/bank-accounts', 'GET', undefined, signal)]);
  if (active.token !== operationSession()?.token || signal?.aborted) return;
  banks = rawBanks.map(bank => ({ ...bank, id: String(bank.id) }));
  applyWallet(wallet); notify();
}
async function load(signal?: AbortSignal) {
  const active = assertStaff();
  if (loading) return loading;
  const task = (async () => {
    try {
      await loadHcmAdministrativeUnits();
      const [rawAssignments, rawMatching, rawCaps, , wallet, rawBanks, rawReviews] = await Promise.all([
        operationRequest<Record<string, unknown>[]>('booking', '/staff/me/assignments', 'GET', undefined, signal),
        operationRequest<{ items: { opportunity: Record<string, unknown>; eligibility: MatchItem['eligibility'] }[] }>('booking', '/staff/me/matching', 'GET', undefined, signal),
        operationRequest<{ capabilities: Record<string, unknown>[]; restrictions: Record<string, unknown>[] }>('booking', '/staff/me/capabilities', 'GET', undefined, signal),
        loadSchedule(signal),
        operationRequest<WalletResponse>('finance', '/staff/me/wallet', 'GET', undefined, signal),
        operationRequest<(Omit<Bank, 'id'> & { id: number })[]>('finance', '/staff/me/bank-accounts', 'GET', undefined, signal),
        operationRequest<{ id: number; customerId: number; rating: number; comment: string; createdAt: string; tags: string[] }[]>('booking', '/reviews', 'GET', undefined, signal),
        loadHcmAdministrativeUnits(),
      ]);
      if (active.token !== operationSession()?.token || signal?.aborted) return;
      assignments = rawAssignments.map(raw=>{const assignment=assignmentView(raw);const income=wallet.incomes.find(i=>String(i.bookingId)===assignment.id && i.status==='SETTLED');return income?{...assignment,netIncome:income.staffAmount,platformFee:income.platformFee,incomePendingPolicy:false}:assignment;});
      matchItems = rawMatching.items.map(item => ({ ...item, opportunity: { ...item.opportunity, id: String(item.opportunity.id), serviceId: String(item.opportunity.serviceId), invitedStaffId: item.opportunity.invitedStaffId == null ? undefined : String(item.opportunity.invitedStaffId) } as unknown as MatchItem['opportunity'] }));
      records = rawCaps.capabilities.map(item => ({ ...item, id: String(item.id), staffId: String(item.staffId), serviceId: String(item.serviceId), note: item.note || undefined, approvedAt: item.approvedAt || undefined, validFrom: item.validFrom || undefined, validUntil: item.validUntil || undefined } as StaffCapabilityRecord));
      restrictions = rawCaps.restrictions.map(item => ({ ...item, id: String(item.id), staffId: String(item.staffId), serviceId: item.serviceId == null ? undefined : String(item.serviceId), endsAt: item.endsAt || undefined } as CapabilityRestrictionRecord));
      applyWallet(wallet);
      banks = rawBanks.map(item => ({ ...item, id: String(item.id) }));
      reviews = rawReviews.map(item => ({ ...item, id: String(item.id), customerName: 'Khách hàng #' + item.customerId, customerAvatar: '', tags: item.tags || [] }));
      loaded = true; failure = ''; notify();
    } catch (error) { if(active.token!==operationSession()?.token || signal?.aborted)return; failure = error instanceof Error ? error.message : 'Chưa tải được dữ liệu nhân viên.'; loaded = false; notify(); throw error; }
  })();
  loading = task;
  try { await task; } finally { if (loading === task) loading = null; }
}
let workRefresh: Promise<void> | null = null;
async function refreshWork(signal?: AbortSignal) {
  if (workRefresh) return workRefresh;
  const active = assertStaff();
  const task = (async () => {
    const [rawAssignments, rawMatching] = await Promise.all([
      operationRequest<Record<string, unknown>[]>('booking', '/staff/me/assignments', 'GET', undefined, signal),
      operationRequest<{ items: { opportunity: Record<string, unknown>; eligibility: MatchItem['eligibility'] }[] }>('booking', '/staff/me/matching', 'GET', undefined, signal),
    ]);
    if (active.token !== operationSession()?.token || signal?.aborted) return;
    const nextAssignments = reuseSnapshot(assignments, rawAssignments.map(raw => {
      const next = assignmentView(raw), previous = assignments.find(item => item.id === next.id);
      return previous?.incomePendingPolicy === false ? { ...next, netIncome: previous.netIncome, platformFee: previous.platformFee, incomePendingPolicy: false } : next;
    }));
    const nextMatchItems = reuseSnapshot(matchItems, rawMatching.items.map(item => ({ ...item, opportunity: { ...item.opportunity, id: String(item.opportunity.id), serviceId: String(item.opportunity.serviceId), invitedStaffId: item.opportunity.invitedStaffId == null ? undefined : String(item.opportunity.invitedStaffId) } as unknown as MatchItem['opportunity'] })));
    const changed=nextAssignments !== assignments || nextMatchItems !== matchItems;
    assignments=nextAssignments; matchItems=nextMatchItems;
    if(changed) notify();
  })();
  workRefresh = task;
  try { await task; } finally { if (workRefresh === task) workRefresh = null; }
}
async function refreshAfterWrite() { try { await load(); } catch { /* The write has committed; UI presents the refresh error separately. */ } }
export const StaffRepository = {
  load, refreshWallet,
  loadSchedule,
  getScheduleLoadState: () => ({ loaded: scheduleLoaded, error: scheduleFailure }),
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  getStoreRevision: () => revision,
  getLoadState: () => ({ loaded, error: failure }),
  getOperationalProfile(staff: string): StaffOperationalProfile {
    const active = assertStaff(staff), p = active.profile;
    return { staffId: staff, userId: staff, fullName: p.fullName, phone: p.phone, email: p.email, avatar: p.avatar, bio: p.bio || '', rating: reviews.length ? reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length : 5, reviewCount: reviews.length, completionRate: assignments.length ? Math.round(assignments.filter(a => a.status === 'COMPLETED').length / assignments.length * 100) : 0, isOnline: p.isOnline, autoAccept: false, maxDistanceKm: 0, primaryDistrict: areaNamesForIds(schedule.saved.areaIds)[0] || '', operatingDistricts: areaNamesForIds(schedule.saved.areaIds), specialties: records.filter(c => c.status === 'APPROVED').map(c => c.serviceName) };
  },
  getAssignments(staff: string) { assertStaff(staff); return assignments; },
  getWallet(staff: string) { assertStaff(staff); return { balance, transactions }; },
  getBankAccounts(staff: string) { assertStaff(staff); return banks; },
  getStaffReviews(staff: string) { assertStaff(staff); return reviews; },
  getScheduleSnapshot(staff: string) { assertStaff(staff); return schedule; },
  getMatchingSnapshot(value: StaffCapabilityActor): MatchingSnapshot {
    actor(value); const p = operationSession()!.profile;
    return { context: { actor: value, userActive: p.status === 'ACTIVE', staffStatus: p.staffStatus || 'OFFLINE', isOnline: p.isOnline, capabilities: capabilitySnapshot(), schedule }, items: matchItems, revision, checkedAt: new Date().toISOString() };
  },
  getMatchingOpportunity(value: StaffCapabilityActor, id: string) { actor(value); return matchItems.find(item => item.opportunity.id === id); },
  getOpportunityEligibility(staff: string, id: string) { assertStaff(staff); return matchItems.find(item => item.opportunity.id === id)?.eligibility || { allowed: false, reasons: [{ code: 'POSITION_FULL' as const, message: 'Ca không còn khả dụng.' }], checks: [] }; },
  getJobDetail(staff: string, id: string): JobDetailResult {
    assertStaff(staff); const assignment = assignments.find(item => item.id === id);
    const opportunity = matchItems.find(item => item.opportunity.id === id)?.opportunity;
    if (assignment && (assignment.status !== 'CANCELLED' || !opportunity)) return { kind: 'ASSIGNMENT', assignment };
    if (opportunity) return { kind: 'OPEN_OPPORTUNITY', opportunity: { ...opportunity, customerName: '', customerPhone: '', customerAvatar: '', address: '', date: localDate(opportunity.startsAt), timeSlot: displayTime(opportunity.startsAt) + ' - ' + displayTime(opportunity.endsAt), packageTitle: opportunity.packageTitle, totalCustomerPaid: opportunity.totalCustomerPaid ?? 0, platformFee: 0, netIncome: opportunity.netIncome, status: 'OPEN' } as OpenOpportunity };
    return { kind: 'NOT_FOUND', reason: loaded ? 'Không tìm thấy ca của tài khoản này.' : failure || 'Đang tải ca làm việc…' };
  },
  async claimOpportunity(staff: string, id: string): Promise<ClaimOpportunityResult> {
    const active = assertStaff(staff);
    try { const assignment = assignmentView(await operationRequest<Record<string, unknown>>('booking', '/staff/opportunities/' + id + '/claim', 'POST')); if (active.token !== operationSession()?.token) throw new Error('Phiên đăng nhập đã thay đổi.'); assignments = [assignment, ...assignments.filter(a => a.id !== id)];
      const chatActor = { userId: staff, participantId: staff, role: 'STAFF' as const, name: active.profile.fullName, avatar: active.profile.avatar };
      try { await ChatRepository.loadList(chatActor); if (ChatRepository.resolveForBooking(id, chatActor, staff).kind !== 'READY') await ChatRepository.loadList(chatActor); } catch { /* Claim is committed; the focused inbox retries chat loading. */ }
      notify(); await refreshAfterWrite(); return { success: true, assignment }; }
    catch (error) {
      // Another staff member may have claimed the last position while this screen was open.
      try { await refreshWork(); } catch { /* Preserve the original claim error. */ }
      return { success: false, reason: error instanceof Error ? error.message : 'Chưa nhận được ca.', errorCode: 'NOT_ELIGIBLE' };
    }
  },
  async updateJobStatus(staff: string, id: string, status: JobStepStatus) {
    assertStaff(staff);
    try { const assignment = assignmentView(await operationRequest<Record<string, unknown>>('booking', '/staff/assignments/' + id + '/status', 'PATCH', { status, ...(status === 'CANCELLED' ? { reason: 'Nhân viên yêu cầu hủy ca' } : {}) })); assignments = assignments.map(a => a.id === id ? assignment : a); notify(); await refreshAfterWrite(); return { success: true, assignment }; }
    catch (error) { return { success: false, reason: error instanceof Error ? error.message : 'Chưa cập nhật được ca.' }; }
  },
  async toggleChecklistItem(staff: string, id: string, checkId: string) { assertStaff(staff); try { const assignment = assignmentView(await operationRequest<Record<string, unknown>>('booking', '/staff/assignments/' + id + '/checklist', 'PATCH', { id: checkId, done: !assignments.find(a=>a.id===id)?.checklist?.find(c=>c.id===checkId)?.done })); assignments = assignments.map(a => a.id === id ? assignment : a); notify(); return { success: true, assignment }; } catch { return { success: false }; } },
  async setOnline(staff: string, isOnline: boolean) { const active = assertStaff(staff); const profile = await operationRequest<typeof active.profile>('identity', '/staff/status', 'PATCH', { isOnline }); if (active.token === operationSession()?.token) { active.profile = profile; notify(); await refreshAfterWrite(); } },
  async saveSchedule(staff: string, draft: AvailabilityDraft, version: number) {
    const active = assertStaff(staff);
    const payload = { ...draft, areaIds: draft.areaIds.map(id => STAFF_AREA_OPTIONS.find(item => item.id === id)?.name || id) };
    const sameSession = () => { if (active.token !== operationSession()?.token) throw new Error('Phiên đăng nhập đã thay đổi.'); };
    const saved = await saveAvailabilityWithReadback(payload, version,
      () => operationRequest<AvailabilitySnapshot>('booking', '/staff/me/availability', 'PUT', { ...payload, revision: version }),
      async () => { sameSession(); const actual = await operationRequest<AvailabilitySnapshot>('booking', '/staff/me/availability'); sameSession(); return actual; });
    sameSession(); schedule = areaView(saved); scheduleLoaded = true; scheduleFailure = ''; notify(); return schedule;
  },
  async withdrawMoney(staff: string, amount: number, bank: string, _account: string, key: string) { assertStaff(staff); const selected = banks.find(item => item.id === bank); if (!selected) throw new Error('Vui lòng chọn tài khoản ngân hàng đã liên kết.'); const result = await operationRequest<{ id: number; status: string }>('finance', '/staff/me/withdrawals', 'POST', { amount, bankAccountId: Number(selected.id), requestKey: key }); await refreshAfterWrite(); return result; },
  async addBank(staff: string, bankCode: string, accountNumber: string, accountHolder: string) { assertStaff(staff); await operationRequest('finance', '/staff/me/bank-accounts', 'POST', { bankCode, accountNumber, accountHolder }); await refreshAfterWrite(); },
  async reportIssue(staff: string, id: string, reason: string) { assertStaff(staff); return operationRequest('booking', '/bookings/' + id + '/incidents', 'POST', { reason }); },
  getCapabilitySnapshot: capabilitySnapshot,
  getAvailability(staff: string) { assertStaff(staff); return { slots: [], operatingDistricts: schedule.saved.areaIds, autoAccept: false, maxDistanceKm: 0, primaryDistrict: schedule.saved.areaIds[0] || '' }; },
  updateOperatingAreas() { throw new Error('Vui lòng lưu khu vực trong màn đăng ký lịch làm.'); },
  toggleShiftSlot() { throw new Error('Vui lòng lưu khoảng rảnh trong màn đăng ký lịch làm.'); },
};
export const StaffCapabilityRepository = { async load(value: StaffCapabilityActor, signal?: AbortSignal) { actor(value); await load(signal); return capabilitySnapshot(); } };
export const StaffAvailabilityRepository = { async load(value: AvailabilityActor, signal?: AbortSignal) { actor(value); await loadHcmAdministrativeUnits(); await loadSchedule(signal); return schedule; }, async save(value: AvailabilityActor, draft: AvailabilityDraft, version: number, _signal?: AbortSignal) { actor(value); return StaffRepository.saveSchedule(value.staffId, draft, version); } };
export const StaffMatchingRepository = { async refresh(value: StaffCapabilityActor, signal?: AbortSignal) { actor(value); await refreshWork(signal); }, async load(value: StaffCapabilityActor, signal?: AbortSignal) { actor(value); await load(signal); return StaffRepository.getMatchingSnapshot(value); }, read: (value: StaffCapabilityActor, _now?: number) => StaffRepository.getMatchingSnapshot(value), detail: (value: StaffCapabilityActor, id: string) => StaffRepository.getMatchingOpportunity(value, id), eligibility: (value: StaffCapabilityActor, id: string) => StaffRepository.getOpportunityEligibility(value.staffId, id), claim: (value: StaffCapabilityActor, id: string, _signal?: AbortSignal) => StaffRepository.claimOpportunity(value.staffId, id), setOnline: (value: StaffCapabilityActor, online: boolean) => StaffRepository.setOnline(value.staffId, online) };
export function availabilityDraft(value: AvailabilitySnapshot): AvailabilityDraft { return JSON.parse(JSON.stringify({ days: value.saved.days, areaIds: value.saved.areaIds, matchNotifications: value.saved.matchNotifications })); }
