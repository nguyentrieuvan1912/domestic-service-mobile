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
staleInbox=true;const oldInbox=chat.loadList(chatActor);await chat.load('80001',chatActor);assert.deepEqual(readBody,{throughMessageId:1001});assert.equal(chat.list()[0].unreadCountCustomer,0);releaseInbox();await oldInbox;assert.equal(chat.list()[0].unreadCountCustomer,0,'A stale inbox poll must not restore unread count after read receipt');
ops.connectOperationsSession(other,'new-chat-owner');assert.equal(chat.list().length,0);await assert.rejects(chat.loadList(chatActor),/đúng tài khoản/);
console.log('Connected chat: accepted-booking lookup, bounded receipt, unread update, stale-poll rejection and account reset passed.');

const {getChatBookingPhase,canSendChat}=require('../src/data/chatPolicy.ts');
assert(canSendChat(getChatBookingPhase('MATCHING')),'An accepted staff can chat while a team booking awaits other staff');
for(const state of ['CANCELLED','COMPLETED','REFUNDED','REJECTED'])assert(!canSendChat(getChatBookingPhase(state)));
