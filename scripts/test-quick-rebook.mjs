import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { readFileSync } from 'node:fs';
const require=createRequire(import.meta.url), ts=require('typescript');
Module._extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {rebookTimes,rebookQuoteBody,rebookStaffChoices,rebookAnswers}=require('../src/utils/quick-rebook.ts');
const {customerSlotIssue}=require('../src/utils/customer-booking-time.ts');
const now=Date.parse('2026-10-20T23:55:00+07:00');
for(const duration of [30,180,480,720]){
 const slots=rebookTimes(duration,now);assert.equal(slots.length,3);assert.equal(new Set(slots.map(item=>item.startsAt)).size,3);
 for(const slot of slots)assert.equal(customerSlotIssue(slot.startsAt,duration,now),'');
}
const source={id:'115',customerId:'9',serviceId:'2',packageId:'5',addressId:'8',requiredStaffCount:1,bookingDate:'2026-10-16',startTime:'09:00',startsAt:'2026-10-16T02:00:00Z',endsAt:'2026-10-16T05:00:00Z',paymentMethod:'CASH',addOns:[{addOnId:'7',addOnName:'Extra'}],assignments:[{staffId:'97',status:'COMPLETED',staffSnapshot:{fullName:'Previous'}}],service:{quantity:2,configuration:{acQuantity:2},answers:{areaM2:50},relatedServices:[{id:3,name:'Related'}]},notes:'Existing note',promotionCode:'OLD'};
const before=JSON.stringify(source), body=rebookQuoteBody(source,['7','9'],'');
assert.deepEqual(body,{serviceId:'2',packageId:'5',requiredStaffCount:1,quantity:2,configuration:{acQuantity:2},answers:{areaM2:50},addOnIds:['7','9'],relatedServiceIds:['3'],promotionCode:''});
assert.equal(JSON.stringify(source),before);assert(!('quoteId' in body));assert(!('requestKey' in body));
assert.deepEqual(rebookStaffChoices([[{id:97},{id:98}],[{id:98},{id:99}]]).map(item=>item.id),[98]);
assert.deepEqual(rebookStaffChoices([[{id:97}]],'97'),[]);
let runner;const requests=[];let activity={active:true,revision:0,now:Date.now()};
const equal=(a,b)=>a&&b&&a.length===b.length&&a.every((item,index)=>Object.is(item,b[index]));
const react={
 useState(initial){const index=runner.cursor++;if(!(index in runner.slots))runner.slots[index]=typeof initial==='function'?initial():initial;const owner=runner;return[owner.slots[index],next=>{owner.slots[index]=typeof next==='function'?next(owner.slots[index]):next;owner.dirty=true;}];},
 useRef(initial){const index=runner.cursor++;return runner.slots[index]??={current:initial};},
 useEffect(effect,deps){const index=runner.cursor++;if(!equal(runner.slots[index]?.deps,deps)){const previous=runner.slots[index];runner.slots[index]={deps,cleanup:previous?.cleanup};runner.effects.push(()=>{previous?.cleanup?.();runner.slots[index].cleanup=effect();});}},
};
const original=Module._load;
Module._load=function(name,...args){
 if(name==='react')return react;
 if(name==='./use-booking-resume')return{useBookingResume:()=>activity};
 if(name==='@/api/operations')return{operationRequest:(service,path,method,body,signal)=>new Promise((resolve,reject)=>requests.push({service,path,method,body,signal,resolve,reject}))};
 if(name.startsWith('@/utils/'))return require('../src/utils/'+name.slice(8)+'.ts');
 return original.call(this,name,...args);
};
const {useQuickRebook}=require('../src/hooks/use-quick-rebook.ts');
let selectedSource=source, requiredFields=[];
runner={slots:[],cursor:0,effects:[],dirty:true};
const flush=()=>{let guard=0;while(runner.dirty){assert(++guard<20);runner.dirty=false;runner.cursor=0;runner.effects=[];runner.value=useQuickRebook(selectedSource,false,requiredFields);for(const effect of runner.effects)effect();}return runner.value;};
const settle=async()=>{await new Promise(resolve=>setImmediate(resolve));flush();};
const debounce=()=>new Promise(resolve=>setTimeout(resolve,330));
flush();assert.equal(runner.value.mode,'KEEP');assert.equal(runner.value.ready,false);await debounce();
requests[0].resolve({baseAmount:200000,addOnAmount:50000,discountAmount:0,totalAmount:250000,durationMinutes:180});await settle();
assert.equal(requests.length,3,'Eligibility checks every main and related service over the complete quoted duration');
for(const read of requests.slice(1))read.resolve([{id:98,fullName:'Other'}]);await settle();assert.equal(runner.value.staffAvailable,false);assert.equal(runner.value.ready,false,'A busy previous staff blocks invitation');
runner.value.setMode('CHOOSE');flush();for(const read of requests.slice(3))read.resolve([{id:98,fullName:'Other'}]);await settle();
runner.value.setStaffId('98');flush();assert.equal(runner.value.ready,true);
const saving=runner.value.submit();const post=requests.at(-1);assert.equal(post.method,'POST');assert.equal(post.body.staffId,'98');assert.equal(post.body.mode,'MODE_A');assert.equal(post.body.notes,'Existing note');assert.notEqual(post.body.startsAt,source.startsAt);
post.reject(new Error('Lost response'));await assert.rejects(saving);const retry=runner.value.submit();const retried=requests.at(-1);assert.equal(retried.body.requestKey,post.body.requestKey,'Explicit retry reuses the same idempotency key');retried.resolve({id:999});await retry;
runner.value.setAddOnIds(['7','9']);flush();assert.equal(runner.value.quote,undefined);assert.equal(runner.value.ready,false,'Added extras invalidate quote and staff availability');await debounce();const oldQuote=requests.at(-1);
runner.value.setAddOnIds(['7']);flush();await debounce();oldQuote.resolve({durationMinutes:720,totalAmount:1});await settle();assert.equal(runner.value.quote,undefined,'A late quote cannot restore the previous addon selection');
requests.at(-1).resolve({baseAmount:200000,addOnAmount:0,discountAmount:0,totalAmount:200000,durationMinutes:180});await settle();runner.value.setMode('AUTO');flush();assert.equal(runner.value.ready,true,'Auto matching needs no fabricated staff selection');
const auto=runner.value.submit();const autoPost=requests.at(-1);assert.equal(autoPost.body.mode,'MODE_B');assert.equal(autoPost.body.staffId,undefined);autoPost.resolve({id:1000});await auto;
activity={...activity,active:false};runner.dirty=true;flush();assert.equal(runner.value.ready,false,'A hidden screen cannot submit an old preview');
for(const slot of runner.slots)slot?.cleanup?.();
// A historical online method must be explicitly changed to a supported method; voucher changes use fresh server pricing.
selectedSource={...source,paymentMethod:'BANK_TRANSFER_QR'};requiredFields=[];activity={...activity,active:true};runner={slots:[],cursor:0,effects:[],dirty:true};
flush();runner.value.setMode('AUTO');flush();await debounce();requests.at(-1).resolve({baseAmount:200000,addOnAmount:0,discountAmount:0,totalAmount:200000,durationMinutes:180});await settle();
assert.match(runner.value.paymentIssue,/chưa được cấu hình/);assert.equal(runner.value.ready,false);const beforeUnsupported=requests.length;await assert.rejects(runner.value.submit(),/chưa được cấu hình/);assert.equal(requests.length,beforeUnsupported,'Unsupported payment cannot create a booking');
runner.value.setPaymentMethod('CASH');flush();assert.equal(runner.value.ready,true);
runner.value.setPromotionCode('INVALID');flush();assert.equal(runner.value.quote,undefined);assert.equal(runner.value.ready,false);await debounce();assert.equal(requests.at(-1).body.promotionCode,'INVALID');requests.at(-1).reject(new Error('Mã đã hết hạn'));await settle();assert.match(runner.value.quoteError,/hết hạn/);assert.equal(runner.value.ready,false);
runner.value.setPromotionCode('NEW10');flush();await debounce();requests.at(-1).resolve({baseAmount:200000,addOnAmount:0,discountAmount:20000,totalAmount:180000,durationMinutes:180});await settle();assert.equal(runner.value.quote.totalAmount,180000);
const updatedPayment=runner.value.submit();const updatedPost=requests.at(-1);assert.equal(updatedPost.body.paymentMethod,'CASH');assert.equal(updatedPost.body.promotionCode,'NEW10');updatedPost.resolve({id:1001});await updatedPayment;
for(const slot of runner.slots)slot?.cleanup?.();
console.log('Rebook payment/promotion: unsupported method blocked, explicit cash choice persisted, changed/invalid voucher invalidates old totals and only verified new promo is submitted.');
// Historical orders can have empty answers; never invent home type, area or a boolean default.
requiredFields=[
 {id:1,fieldKey:'homeType',label:'Loại không gian',fieldType:'SELECT',required:true,options:['Căn hộ','Nhà phố'],validationRules:{}},
 {id:2,fieldKey:'areaM2',label:'Diện tích',fieldType:'NUMBER',required:true,options:[],validationRules:{min:10,max:1000,integer:true}},
 {id:3,fieldKey:'priorityAreas',label:'Khu vực ưu tiên',fieldType:'MULTI_SELECT',required:true,options:['Phòng khách'],validationRules:{}},
 {id:4,fieldKey:'hasSupplies',label:'Có dụng cụ',fieldType:'BOOLEAN',required:true,options:[],validationRules:{}},
];
selectedSource={...source,service:{answers:{},configuration:{}}};
assert.deepEqual(rebookAnswers(selectedSource,requiredFields),{});
assert.deepEqual(rebookAnswers({...selectedSource,service:{configuration:{homeType:'Căn hộ',hasSupplies:false}}},requiredFields),{homeType:'Căn hộ',hasSupplies:false});
assert.deepEqual(rebookAnswers({...selectedSource,service:{configuration:{homeType:'Unknown',hasSupplies:'false'}}},requiredFields),{});
activity={...activity,active:true};runner={slots:[],cursor:0,effects:[],dirty:true};
const beforeRepair=requests.length;flush();await debounce();assert.equal(requests.length,beforeRepair,'Incomplete historical answers must not send failing previews');assert.match(runner.value.answersIssue,/Loại không gian/);assert.equal(runner.value.ready,false);
runner.value.setAnswers({homeType:'Căn hộ',areaM2:'35',priorityAreas:['Phòng khách']});flush();await debounce();assert.equal(requests.length,beforeRepair,'Missing boolean must not become an invented false');
runner.value.setAnswers({...runner.value.answers,hasSupplies:false});flush();await debounce();assert.equal(runner.value.answersIssue,'');assert.equal(requests.length,beforeRepair+1);assert.deepEqual(requests.at(-1).body.answers,{homeType:'Căn hộ',areaM2:'35',priorityAreas:['Phòng khách'],hasSupplies:false});
assert.equal(JSON.stringify(source),before,'Repair never mutates the historical booking');
for(const slot of runner.slots)slot?.cleanup?.();Module._load=original;
console.log('Legacy rebook: absent/invalid requirements are editable, saved configuration restores without guessing, false stays valid, incomplete previews blocked and corrected answers sent to backend.');
console.log('Quick rebook: three valid future times, preserved owned snapshot, full-service staff intersection, busy-staff blocking, selected/auto modes, idempotent explicit retry, addon quote invalidation, stale response and foreground gates passed.');
