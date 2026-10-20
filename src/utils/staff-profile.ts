import type { Staff } from '@/types/user';
export function staffRating(rating: number | null | undefined, reviewCount = 0): number {
  return reviewCount > 0 && rating != null && Number.isFinite(rating) ? rating : 5;
}
export function staffAge(staff: Pick<Staff,'dateOfBirth'|'birthYear'>, now = Date.now()): number | null {
  const today=new Date(now+7*3600000).toISOString().slice(0,10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(staff.dateOfBirth)) {
    const year=Number(staff.dateOfBirth.slice(0,4));
    const age=Number(today.slice(0,4))-year-(today.slice(5)<staff.dateOfBirth.slice(5)?1:0);
    return age>=18&&age<=100?age:null;
  }
  return staff.birthYear ? Number(today.slice(0,4))-staff.birthYear : null;
}
export function staffAgeLabel(staff: Pick<Staff,'dateOfBirth'|'birthYear'>): string {
  const age=staffAge(staff);
  return age===null?'Chưa cập nhật tuổi':`${age} tuổi`;
}
export function staffBirthLabel(staff: Pick<Staff,'dateOfBirth'|'birthYear'>): string {
  return staff.dateOfBirth ? staff.dateOfBirth.split('-').reverse().join('/') : staff.birthYear?`${staff.birthYear} (chưa có ngày/tháng)`:'Chưa cập nhật';
}
