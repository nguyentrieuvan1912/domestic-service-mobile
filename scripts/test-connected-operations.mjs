import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const require=createRequire(import.meta.url), ts=require('typescript');
const originalResolve=Module._resolveFilename, originalLoad=Module._load;
Module._resolveFilename=function(specifier,parent,...args){if(specifier.startsWith('@/')){const base=resolve('src',specifier.slice(2));specifier=existsSync(base+'.ts')?base+'.ts':base+'.tsx';}return originalResolve.call(this,specifier,parent,...args);};
Module._load=function(specifier,parent,isMain){if(specifier==='react-native')return {Platform:{OS:'web'}};return originalLoad.call(this,specifier,parent,isMain);};
Module._extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const ops=require('../src/api/operations.ts'), {CustomerBookings:bookings}=require('../src/data/connectedBookings.ts'), {StaffRepository:staff}=require('../src/data/connectedStaffRepository.ts');
const customer={id:71001,role:'CUSTOMER'}, other={id:71002,role:'CUSTOMER'}, employee={id:71003,role:'STAFF'};
const record={id:90001,customerId:customer.id,serviceId:5,addressId:8,packageId:10,status:'MATCHING',service:{name:'Test snapshot'},address:{},assignments:[],addOns:[],startsAt:'2026-10-15T02:00:00Z',endsAt:'2026-10-15T03:00:00Z'};
let mode='list',pendingResolve,postCalls=0;
global.fetch=async (_url,options)=>{if(options.method==='POST')postCalls++;if(mode==='unauthorized')return new Response(JSON.stringify({detail:'Session revoked'}),{status:401});if(mode==='failed')return new Response(JSON.stringify({detail:'Persistence unavailable'}),{status:503});if(mode==='deferred')await new Promise(r=>pendingResolve=r);return new Response(JSON.stringify(mode==='cancel'?{...record,status:'CANCELLED'}:[record]),{status:200});};
ops.connectOperationsSession(customer,'customer-session');await bookings.load();assert.equal(bookings.list()[0].id,'90001');assert.equal(bookings.list()[0].customerId,String(customer.id));
mode='failed';await assert.rejects(bookings.cancel('90001','Reason'),/Persistence unavailable/);assert.equal(bookings.list()[0].status,'MATCHING','Failed write must not update local state or report success');
mode='cancel';await bookings.cancel('90001','Reason');assert.equal(bookings.list()[0].status,'CANCELLED');
// Cancelling one booking must preserve another booking accepted by the same staff.
const acceptedOther={...record,id:90002,status:'CONFIRMED',assignments:[{staffId:employee.id,status:'ACCEPTED',executionStatus:'ACCEPTED'}]};
let cancelledPath;
global.fetch=async(url,options)=>{
 if(options.method==='POST'){cancelledPath=url;return new Response(JSON.stringify({...record,status:'CANCELLED'}));}
 return new Response(JSON.stringify([record,acceptedOther]));
};
await bookings.load();const untouchedBooking=bookings.get('90002');
await bookings.cancel('90001','Cancel only the selected booking');
assert(cancelledPath.endsWith('/bookings/90001/cancel'));
assert.equal(bookings.get('90001').status,'CANCELLED');
assert.equal(bookings.get('90002'),untouchedBooking,'Cancellation must not replace or change the other booking');
assert.equal(bookings.get('90002').status,'CONFIRMED');
assert.equal(bookings.get('90002').assignments[0].status,'ACCEPTED');
// A pending refresh must never restore an expired invitation after a successful renewal.
let finishOldRead;
global.fetch=async (_url,options)=>{
  if(options.method==='POST') return new Response(JSON.stringify({...record,status:'STAFF_ASSIGNED',staffWaitState:'WAITING',staffWaitRound:2,staffResponseDeadline:'2026-10-15T03:03:00Z'}));
  await new Promise(resolve=>finishOldRead=resolve);
  return new Response(JSON.stringify([{...record,status:'CANCELLED',staffWaitState:'EXPIRED',staffWaitRound:1}]));
};
const staleRefresh=bookings.load();
await bookings.staffResponse('90001','EXTEND',1);
finishOldRead();await staleRefresh;
assert.equal(bookings.list()[0].staffWaitRound,2,'An old poll cannot reopen the expired modal after extending');
assert.equal(bookings.list()[0].status,'STAFF_ASSIGNED');
global.fetch=async (_url,options)=>{if(options.method==='POST')postCalls++;if(mode==='unauthorized')return new Response(JSON.stringify({detail:'Session revoked'}),{status:401});if(mode==='deferred')await new Promise(r=>pendingResolve=r);return new Response(JSON.stringify([record]));};
ops.connectOperationsSession(other,'other-session');assert.equal(bookings.list().length,0,'Login change must clear previous account cache');
mode='deferred';const oldLoad=bookings.load();ops.connectOperationsSession(customer,'new-session');pendingResolve();await assert.rejects(oldLoad,/Phiên đăng nhập đã thay đổi/);assert.equal(bookings.list().length,0,'Old response must not populate the new account');
ops.connectOperationsSession(employee,'staff-session');const count=postCalls;await assert.rejects(bookings.cancel('90001','Reason'),/khách hàng/);assert.equal(postCalls,count,'Wrong UI role must not issue a mutation');assert.throws(()=>staff.getOperationalProfile('71004'),/đúng tài khoản/);
let revoked=0;ops.onOperationSessionInvalidated(()=>revoked++);mode='unauthorized';await assert.rejects(ops.operationRequest('booking','/staff/me/assignments'),/Session revoked/);assert.equal(ops.operationSession(),null);assert.equal(revoked,1);assert.equal(bookings.list().length,0);
console.log('Connected operations: persisted-response mutations, failed-write isolation, role scoping, account cache reset, stale-response rejection and revoked-session clearing passed.');

const settleChat=()=>new Promise(resolve=>setImmediate(resolve));
const {ChatRepository:chat}=require('../src/data/connectedChatRepository.ts');
const chatActor={userId:String(customer.id),participantId:String(customer.id),role:'CUSTOMER',name:'Customer',avatar:''};
const conversation={id:80001,bookingId:90001,customerId:customer.id,staffId:employee.id,bookingStatus:'CONFIRMED',conversationStatus:'ACTIVE',unreadCountCustomer:2,unreadCountStaff:0};
ops.connectOperationsSession(customer,'chat-session');
let releaseInbox,staleInbox=false,readBody;
global.fetch=async(url,options)=>{
 if(url.endsWith('/conversations')){if(staleInbox)await new Promise(resolve=>releaseInbox=resolve);return new Response(JSON.stringify([conversation]));}
 if(url.endsWith('/messages'))return new Response(JSON.stringify([{id:1001,conversationId:80001,senderId:employee.id,senderType:'STAFF',content:'Hello',isRead:false,sentAt:'2026-10-15T12:00:00Z'}]));
 if(url.endsWith('/read')){readBody=JSON.parse(options.body);return new Response(JSON.stringify({changed:1,unreadCount:0}));}
 throw new Error('Unexpected request '+url);
};
await chat.loadList(chatActor);assert.equal(chat.list()[0].unreadCountCustomer,2);assert.equal(chat.resolveForBooking('90001',chatActor,String(employee.id)).kind,'READY');
staleInbox=true;const oldInbox=chat.loadList(chatActor);await chat.load('80001',chatActor);await settleChat();assert.deepEqual(readBody,{throughMessageId:1001});assert.equal(chat.list()[0].unreadCountCustomer,0);releaseInbox();await oldInbox;assert.equal(chat.list()[0].unreadCountCustomer,0,'A stale inbox poll must not restore unread count after read receipt');
ops.connectOperationsSession(other,'new-chat-owner');assert.equal(chat.list().length,0);await assert.rejects(chat.loadList(chatActor),/đúng tài khoản/);
console.log('Connected chat: accepted-booking lookup, bounded receipt, unread update, stale-poll rejection and account reset passed.');

const {getChatBookingPhase,canSendChat}=require('../src/data/chatPolicy.ts');
assert(canSendChat(getChatBookingPhase('MATCHING')),'An accepted staff can chat while a team booking awaits other staff');
for(const state of ['CANCELLED','COMPLETED','REFUNDED','REJECTED'])assert(!canSendChat(getChatBookingPhase(state)));

// Polling must deliver real changes without repeatedly rerendering unchanged screens.
ops.connectOperationsSession(customer,'quiet-inbox-session');
let chatEvents=0;const stopChat=chat.subscribe(()=>chatEvents++);
global.fetch=async()=>new Response(JSON.stringify([conversation]));
await chat.loadList(chatActor);const stableInbox=chat.list(), initialChatEvents=chatEvents;
for(let i=0;i<20;i++)await chat.loadList(chatActor);
assert.equal(chat.list(),stableInbox);assert.equal(chatEvents,initialChatEvents);
global.fetch=async()=>new Response(JSON.stringify([{...conversation,unreadCountCustomer:3}]));
await chat.loadList(chatActor);assert.equal(chatEvents,initialChatEvents+1);stopChat();

const notifications=require('../src/data/connectedNotifications.ts');
notifications.setCustomerNotificationSession(String(customer.id),'quiet-notification-session');
const notificationActor={userId:String(customer.id),role:'CUSTOMER'};
const notice={id:60001,userId:customer.id,referenceId:90001,type:'BOOKING_CREATED',isRead:false};
global.fetch=async()=>new Response(JSON.stringify([notice]));
await notifications.NotificationRepository.load(notificationActor);
const stableNotices=notifications.NotificationRepository.getSnapshot(notificationActor), noticeRevision=notifications.NotificationRepository.getRevision();
for(let i=0;i<20;i++)await notifications.NotificationRepository.load(notificationActor);
assert.equal(notifications.NotificationRepository.getSnapshot(notificationActor),stableNotices);
assert.equal(notifications.NotificationRepository.getRevision(),noticeRevision);
global.fetch=async()=>new Response(JSON.stringify([{...notice,isRead:true}]));
await notifications.NotificationRepository.load(notificationActor);
assert.equal(notifications.NotificationRepository.getRevision(),noticeRevision+1);

ops.connectOperationsSession(employee,'quiet-staff-session');
const {StaffMatchingRepository:matching}=require('../src/data/connectedStaffRepository.ts');
const staffActor={userId:String(employee.id),staffId:String(employee.id)};
let jobStatus='ACCEPTED',reads=0;
global.fetch=async(url)=>{reads++;return new Response(JSON.stringify(url.endsWith('/assignments')?[{id:90001,staffId:employee.id,customerId:customer.id,serviceId:5,status:jobStatus}]:{items:[],checkedAt:String(reads)}));};
await matching.refresh(staffActor);const workRevision=staff.getStoreRevision();
for(let i=0;i<20;i++)await matching.refresh(staffActor);
assert.equal(staff.getStoreRevision(),workRevision);
jobStatus='COMPLETED';await matching.refresh(staffActor);assert.equal(staff.getStoreRevision(),workRevision+1);
const beforeShared=reads;await Promise.all([matching.refresh(staffActor),matching.refresh(staffActor)]);
assert.equal(reads-beforeShared,2,'Concurrent refreshes share one assignments/matching request pair');
console.log('Polling performance: 20 identical chat, notification and job polls caused zero extra store updates; real unread/job changes were delivered and concurrent job requests were deduplicated.');
// Chat transport regression fixtures exercise the production repository, never the app's live data.
ops.connectOperationsSession(customer,'smooth-chat-session');
const incoming={id:1001,conversationId:80001,senderId:employee.id,senderType:'STAFF',content:'Hello',isRead:false,sentAt:'2026-10-15T12:00:00Z'};
let receiptCalls=0, messageReads=0, failReceipt=false;
global.fetch=async(url,options)=>{
 if(url.endsWith('/conversations'))return new Response(JSON.stringify([conversation]));
 if(url.endsWith('/read')){receiptCalls++;return new Response(JSON.stringify(failReceipt?{detail:'Receipt unavailable'}:{changed:1,unreadCount:0}),{status:failReceipt?503:200});}
 if(url.endsWith('/messages')){messageReads++;return new Response(JSON.stringify([incoming]));}
 throw new Error('Unexpected request '+url);
};
await chat.loadList(chatActor);
failReceipt=true;await chat.load('80001',chatActor);await settleChat();
assert.equal(chat.getMessages('80001',chatActor)[0].content,'Hello','A read receipt failure cannot hide loaded history');
failReceipt=false;await chat.load('80001',chatActor);await settleChat();
const quietThread=chat.getMessages('80001',chatActor);let threadEvents=0;
const stopThread=chat.subscribe(()=>threadEvents++);
for(let i=0;i<20;i++)await chat.load('80001',chatActor);await settleChat();
assert.equal(chat.getMessages('80001',chatActor),quietThread);
assert.equal(threadEvents,0,'Identical message polls must not rerender the thread');
assert.equal(receiptCalls,2,'Only the failed receipt is retried; confirmed receipts are not repeated');
stopThread();

let releaseOldMessages;
global.fetch=async(url,options)=>{
 if(options.method==='POST')return new Response(JSON.stringify({id:1002}));
 if(url.endsWith('/conversations'))return new Response(JSON.stringify({detail:'Inbox unavailable'}),{status:503});
 if(url.endsWith('/messages')){await new Promise(resolve=>releaseOldMessages=resolve);return new Response(JSON.stringify([incoming]));}
 throw new Error('Unexpected request '+url);
};
const delayedMessages=chat.load('80001',chatActor);
assert.equal(await chat.send('80001',chatActor,'Persisted message','same-key'),'1002');
releaseOldMessages();await delayedMessages;
assert.equal(chat.getMessages('80001',chatActor).at(-1).id,'1002','An older poll cannot remove a committed send');
await chat.send('80001',chatActor,'Persisted message','same-key');
assert.equal(chat.getMessages('80001',chatActor).filter(item=>item.id==='1002').length,1,'The same acknowledged database ID must not be duplicated');
const beforeFailedSend=chat.getMessages('80001',chatActor);
global.fetch=async()=>new Response(JSON.stringify({detail:'Write unavailable'}),{status:503});
await assert.rejects(chat.send('80001',chatActor,'Not persisted','failed-key'),/Write unavailable/);
assert.equal(chat.getMessages('80001',chatActor),beforeFailedSend,'Failed POST cannot create a sent bubble');
ops.connectOperationsSession(customer,'same-user-renewed-session');
assert.equal(chat.list().length,0,'Renewing the same account session resets its old requests and cache');
console.log('Chat smoothness: unchanged thread stability, receipt retry/dedup, committed-send confirmation despite inbox failure, late-poll protection, idempotent acknowledgement and failed-send isolation passed.');
// Read resilience uses the real transport; mutation replay is forbidden.
ops.connectOperationsSession(customer,'transport-resilience');
let recoveryCalls=0;
global.fetch=async()=>{if(++recoveryCalls===1)throw new TypeError('Network request failed');return new Response(JSON.stringify({saved:true}));};
assert.deepEqual(await ops.operationRequest('booking','/bookings/90001'),{saved:true});
assert.equal(recoveryCalls,2,'A transient read recovers without a manual retry');
recoveryCalls=0;global.fetch=async()=>{recoveryCalls++;return new Response(JSON.stringify({detail:'Temporarily unavailable'}),{status:503});};
await assert.rejects(ops.operationRequest('booking','/bookings/90001'),/Temporarily/);assert.equal(recoveryCalls,2,'Read retry is bounded');
recoveryCalls=0;await assert.rejects(ops.operationRequest('booking','/bookings','POST',{}));assert.equal(recoveryCalls,1,'A write must never be replayed automatically');
recoveryCalls=0;global.fetch=async()=>{recoveryCalls++;return new Response(JSON.stringify({detail:'Invalid booking'}),{status:400});};
await assert.rejects(ops.operationRequest('booking','/bookings/90001'));assert.equal(recoveryCalls,1,'Business errors must not retry');
let releaseBody;
global.fetch=async()=>({ok:true,status:200,json:()=>new Promise(resolve=>releaseBody=resolve)});
const pendingBody=ops.operationRequest('booking','/bookings/90001');await new Promise(resolve=>setImmediate(resolve));
ops.connectOperationsSession(other,'changed-during-body');releaseBody({id:90001});
await assert.rejects(pendingBody,/Phiên đăng nhập đã thay đổi/,'The account guard includes response body decoding');
ops.connectOperationsSession(customer,'cancelled-read-retry');recoveryCalls=0;
global.fetch=async()=>{recoveryCalls++;throw new TypeError('Network request failed');};
const retryAbort=new AbortController();const abortedRetry=ops.operationRequest('booking','/bookings/90001','GET',undefined,retryAbort.signal);
await new Promise(resolve=>setImmediate(resolve));retryAbort.abort();await assert.rejects(abortedRetry,/Đã hủy/);assert.equal(recoveryCalls,1);
console.log('Transport resilience: transient GET recovery, bounded attempts, no mutation/business retry, account guard through body decode and cancellation during backoff passed.');
// Deadlines must include a stalled response body, not just response headers.
ops.connectOperationsSession(customer,'body-deadline');
const realTimeout=global.setTimeout;let bodyAttempts=0;
global.setTimeout=(callback,delay,...args)=>realTimeout(callback,delay===20000?10:delay===500?1:delay,...args);
try {
 global.fetch=async(_url,options)=>{bodyAttempts++;return{ok:true,status:200,json:()=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('Body aborted')),{once:true}))};};
 await assert.rejects(ops.operationRequest('booking','/bookings/90001'),/Kết nối quá lâu/);
 assert.equal(bodyAttempts,2,'Stalled GET body has one bounded retry');
 bodyAttempts=0;await assert.rejects(ops.operationRequest('booking','/bookings','POST',{}),/Kết nối quá lâu/);assert.equal(bodyAttempts,1,'Stalled POST body must not replay a possibly committed write');
} finally {global.setTimeout=realTimeout;}
console.log('Response body deadlines: stalled reads terminate with one retry; stalled writes terminate without replay.');
