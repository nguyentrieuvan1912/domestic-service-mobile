export interface AvailabilityInterval { startsAt: string; endsAt: string }
export interface AvailabilityDay { date: string; intervals: AvailabilityInterval[] }
export interface AvailabilityDraft { days: AvailabilityDay[]; areaIds: string[]; matchNotifications: boolean }
export interface SavedAvailability extends AvailabilityDraft { revision: number; updatedAt: string }
export interface ScheduleBooking extends AvailabilityInterval { id: string; bookingCode: string; district: string; status: string }
export interface AvailabilitySnapshot { saved: SavedAvailability; bookings: ScheduleBooking[]; unknownBookingCodes: string[] }
export interface AvailabilityActor { userId: string; staffId: string }
export type ScheduleFailureCode = 'TIME_INVALID' | 'OUTSIDE_WINDOW' | 'PAST_START' | 'AREA_OUTSIDE' | 'OUTSIDE_AVAILABILITY' | 'BOOKING_CONFLICT' | 'SCHEDULE_INVALID';
export type ScheduleResult = { allowed: true } | { allowed: false; reason: string; code?: ScheduleFailureCode };
