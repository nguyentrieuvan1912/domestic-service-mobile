import { identityRequest } from './identity';
import { STAFF_AREA_OPTIONS } from '@/data/staffAreas';

export interface AdministrativeUnit { id: number; name: string; type: 'WARD' | 'COMMUNE' | 'SPECIAL_ZONE' }
export interface AdministrativeDirectory { province: string; effectiveFrom: string; resolution: string; items: AdministrativeUnit[]; total: number }
let pending: Promise<AdministrativeDirectory> | null = null;
export function loadHcmAdministrativeUnits(): Promise<AdministrativeDirectory> {
  if (!pending) pending = identityRequest<AdministrativeDirectory>('/administrative-units/hcm').then(directory => {
    directory.items.sort((a,b) => a.name.localeCompare(b.name, 'vi'));
    // Keep old IDs only for historical schedules. New choices come from the owning DB.
    for (const unit of directory.items) if (!STAFF_AREA_OPTIONS.some(area => area.name === unit.name)) STAFF_AREA_OPTIONS.push({ id: `hcm-${unit.id}`, name: unit.name });
    return directory;
  }).catch(error => { pending = null; throw error; });
  return pending;
}
export const administrativeSearchKey = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim().replace(/\s+/g, ' ');
