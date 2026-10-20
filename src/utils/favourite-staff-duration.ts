import type { ServicePackage } from '../types/service';

export const FAVOURITE_STAFF_MAX_MINUTES = 240;
export const roundedBookingMinutes = (base: number, extras: number) => Math.ceil((base + extras) / 30) * 30;
export function favouriteDurationIssue(base: number, extras: number, extraCount: number): string {
  if (roundedBookingMinutes(base, extras) > FAVOURITE_STAFF_MAX_MINUTES)
    return 'Tổng thời gian gói chính và dịch vụ thêm của nhân viên yêu thích tối đa 4 giờ. Vui lòng hạ gói hoặc bỏ bớt dịch vụ thêm.';
  if (base >= FAVOURITE_STAFF_MAX_MINUTES && extraCount > 0)
    return 'Gói 4 giờ đã dùng hết thời gian làm việc tối đa của nhân viên yêu thích nên không thể chọn thêm addon. Bạn có thể giữ gói 4 giờ hoặc hạ gói để thêm dịch vụ.';
  return '';
}
export function shorterFavouritePackage(packages: ServicePackage[], currentBase: number, extras: number, extraCount: number, quantity = 1, maximum = FAVOURITE_STAFF_MAX_MINUTES) {
  return packages.filter(p => p.isActive && (p.defaultStaffCount || 1) === 1 && p.durationMinutes * quantity < currentBase
    && !favouriteDurationIssue(p.durationMinutes * quantity, extras, extraCount)
    && roundedBookingMinutes(p.durationMinutes * quantity, extras) <= maximum)
    .sort((a, b) => b.durationMinutes - a.durationMinutes)[0];
}
