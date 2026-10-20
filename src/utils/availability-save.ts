import type { AvailabilityDraft, AvailabilitySnapshot } from '../types/staff-availability';

/** A lost write response is successful only when a fresh server read proves the whole week matches. */
export function availabilityWasSaved(actual: AvailabilitySnapshot, draft: AvailabilityDraft, revision: number): boolean {
  if (!draft.weekStart || draft.days.length !== 7 || new Set(draft.days.map(day => day.date)).size !== 7
    || actual.saved.revision <= revision || !actual.saved.registeredWeekStarts?.includes(draft.weekStart)
    || actual.saved.matchNotifications !== draft.matchNotifications) return false;
  const areas = (values: string[]) => JSON.stringify([...new Set(values)].sort());
  if (areas(actual.saved.areaIds) !== areas(draft.areaIds)) return false;
  const intervals = (values: AvailabilityDraft['days'][number]['intervals']) => values
    .map(item => [Date.parse(item.startsAt), Date.parse(item.endsAt)])
    .sort((a,b) => a[0]-b[0] || a[1]-b[1]);
  return draft.days.every(day => {
    const saved = actual.saved.days.find(item => item.date === day.date);
    if (!saved) return false;
    const expected = intervals(day.intervals), found = intervals(saved.intervals);
    return expected.flat().every(Number.isFinite) && found.flat().every(Number.isFinite)
      && JSON.stringify(expected) === JSON.stringify(found);
  });
}

export async function saveAvailabilityWithReadback(
  draft: AvailabilityDraft, revision: number,
  write: () => Promise<AvailabilitySnapshot>, read: () => Promise<AvailabilitySnapshot>,
): Promise<AvailabilitySnapshot> {
  try { return await write(); }
  catch (error) {
    try {
      const actual = await read();
      if (availabilityWasSaved(actual, draft, revision)) return actual;
    } catch { /* Keep the original save error and the user's draft if verification fails. */ }
    throw error;
  }
}
