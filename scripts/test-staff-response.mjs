import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {needsStaffResponse,responseSeconds,responseClock}=require('../src/utils/staff-response.ts');
const deadline='2026-10-15T10:03:00+07:00',start=Date.parse('2026-10-15T10:00:00+07:00');
assert.equal(responseSeconds(deadline,start),180);
assert.equal(responseClock(responseSeconds(deadline,start+15000)), '02:45');
assert.equal(responseSeconds(deadline,start+16000),164);
assert.equal(responseSeconds(deadline,start+180001),0);
assert.equal(responseSeconds(undefined,start),0);
assert.equal(responseClock(0),'00:00');
assert.equal(responseClock(9),'00:09');
assert.equal(responseSeconds(deadline,Date.parse(deadline)-1),1);
assert(needsStaffResponse({mode:'MODE_A',status:'STAFF_ASSIGNED',staffWaitState:'WAITING'}));
assert(needsStaffResponse({mode:'MODE_A',status:'CANCELLED',staffWaitState:'EXPIRED'}));
for(const booking of [
 {mode:'MODE_B',status:'MATCHING',staffWaitState:'WAITING'},
 {mode:'MODE_A',status:'CANCELLED',staffWaitState:'CLOSED'},
 {mode:'MODE_A',status:'CONFIRMED',staffWaitState:'CLOSED'},
 {mode:'MODE_A',status:'NO_STAFF_FOUND',staffWaitState:'WAITING'},
])assert(!needsStaffResponse(booking));
console.log('Staff response: persisted deadlines, elapsed/reopened countdown, expiry boundaries, pending/expired/closed/accepted homepage routes passed.');

const {bookingRetryDraft}=require('../src/utils/booking-retry.ts');
const original={id:'100',serviceId:'2',packageId:'5',addressId:'9',bookingDate:'2026-10-16',startTime:'09:30:00',startsAt:'2026-10-16T02:30:00Z',endsAt:'2026-10-16T05:00:00Z',promotionCode:'GIAM10',notes:'Mang dụng cụ',addOns:[{addOnId:'7'}],service:{answers:{rooms:2},configuration:{acQuantity:2},relatedServices:[{id:3}]},assignments:[{staffId:'10',staffSnapshot:{fullName:'Người trước'}},{staffId:'11',staffSnapshot:{fullName:'Người hết giờ'}}]};
const before=JSON.stringify(original),draft=bookingRetryDraft(original);
assert.deepEqual(draft,{serviceId:'2',packageId:'5',addressId:'9',date:'2026-10-16',time:'09:30',durationMinutes:150,extraKeys:['addon:7','service:3'],answers:{rooms:2},configuration:{acQuantity:2},promotionCode:'GIAM10',notes:'Mang dụng cụ',previousStaffId:'11',previousStaffName:'Người hết giờ'});
assert.equal(JSON.stringify(original),before,'Restoration does not alter the cancelled order');
assert(!('quoteId' in draft));assert(!('requestKey' in draft));
const empty=bookingRetryDraft({...original,service:{},addOns:[],assignments:[],staffId:'12',staff:{fullName:'Nhân viên cũ'},promotionCode:undefined,notes:undefined});
assert.deepEqual(empty.extraKeys,[]);assert.deepEqual(empty.configuration,{});assert.deepEqual(empty.answers,{});assert.equal(empty.previousStaffId,'12');assert.equal(empty.previousStaffName,'Nhân viên cũ');
console.log('Retry: original address/time/full duration/package/extras/answers/configuration/promo/notes restored; latest invitation marked; quote/request identity never reused.');

const {bookingTravelStatus}=require('../src/utils/booking-travel-status.ts');
const moving={status:'CONFIRMED',assignments:[{status:'ACCEPTED',executionStatus:'EN_ROUTE'}]};
assert.equal(bookingTravelStatus(moving).active,true,'EN_ROUTE is assignment state while the booking remains CONFIRMED');
assert.match(bookingTravelStatus(moving).description,/đang trên đường/);
assert.equal(bookingTravelStatus({...moving,assignments:[{status:'ACCEPTED',executionStatus:'ACCEPTED'}]}).active,false);
assert.equal(bookingTravelStatus({...moving,assignments:[{status:'CANCELLED',executionStatus:'EN_ROUTE'}]}).active,false,'Cancelled invitation/assignment must not imply travel');
assert.equal(bookingTravelStatus({...moving,status:'CANCELLED'}).active,false);
assert.match(bookingTravelStatus({...moving,status:'IN_PROGRESS',assignments:[]}).description,/đã đến/);
assert.equal(bookingTravelStatus({...moving,status:'COMPLETED',assignments:[]}).active,true);
assert.equal(bookingTravelStatus({...moving,assignments:[{status:'ACCEPTED',executionStatus:'ACCEPTED'},{status:'ACCEPTED',executionStatus:'EN_ROUTE'}]}).active,true);
console.log('Customer travel timeline: real assignment EN_ROUTE, accepted/arrived/completed/cancelled and multiple-staff states passed.');
