import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { readFileSync } from 'node:fs';
const require=createRequire(import.meta.url), ts=require('typescript');
Module._extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {retryBookingRead}=require('../src/utils/booking-read.ts');
let calls=0;
const controller=new AbortController();
assert.equal(await retryBookingRead(async()=>{if(++calls===1)throw new Error('Kết nối quá lâu. Vui lòng thử lại.');return 'live response';},controller.signal),'live response');
assert.equal(calls,2);
calls=0;
await assert.rejects(retryBookingRead(async()=>{calls++;throw new Error('Không kết nối được backend. Vui lòng thử lại.');},controller.signal));
assert.equal(calls,2,'Only one retry');
for(const message of ['Phiên đăng nhập hết hạn.','Mã ưu đãi không hợp lệ.','Giờ bắt đầu phải cách thời điểm hiện tại tối thiểu 2 giờ.']) {
 calls=0;await assert.rejects(retryBookingRead(async()=>{calls++;throw new Error(message);},controller.signal));assert.equal(calls,1,'Business/auth errors must not retry');
}
calls=0;const cancelled=new AbortController();
const cancelledRead=retryBookingRead(async()=>{calls++;throw new Error('Kết nối quá lâu. Vui lòng thử lại.');},cancelled.signal);
cancelled.abort();await assert.rejects(cancelledRead);assert.equal(calls,1,'Background cancellation prevents retry');

// Run the actual hooks with deterministic React effect scheduling and native focus/app events.
let runner,focused=true;
const listeners=new Set(),appState={currentState:'active',addEventListener(_event,callback){listeners.add(callback);return{remove:()=>listeners.delete(callback)};}};
const equal=(a,b)=>a&&b&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
const react={
 useState(initial){const index=runner.cursor++;if(!(index in runner.slots))runner.slots[index]=typeof initial==='function'?initial():initial;const owner=runner;return[owner.slots[index],next=>{const value=typeof next==='function'?next(owner.slots[index]):next;if(!Object.is(value,owner.slots[index])){owner.slots[index]=value;owner.dirty=true;}}];},
 useRef(initial){const index=runner.cursor++;return runner.slots[index]??=( {current:initial} );},
 useCallback(callback,deps){const index=runner.cursor++;if(!equal(runner.slots[index]?.deps,deps))runner.slots[index]={deps,value:callback};return runner.slots[index].value;},
 useEffect(effect,deps){const index=runner.cursor++;if(!equal(runner.slots[index]?.deps,deps)){const old=runner.slots[index];runner.slots[index]={deps,cleanup:old?.cleanup};runner.effects.push(()=>{old?.cleanup?.();runner.slots[index].cleanup=effect();});}},
};
let account={currentCustomer:{id:'1'},accessToken:'session-one',refreshProfile:async()=>{}};
const requests=[];
const identityRequest=(path,body,token,method,signal)=>new Promise((resolve,reject)=>{const request={path,body,token,method,signal,resolve,reject};requests.push(request);signal?.addEventListener('abort',()=>reject(new Error('Aborted')),{once:true});});
const load=Module._load;
Module._load=function(name,...args){if(name==='react')return react;if(name==='react-native')return{AppState:appState};if(name==='expo-router')return{useIsFocused:()=>focused,useFocusEffect:callback=>react.useEffect(()=>focused?callback():undefined,[focused,callback])};if(name==='@/context/AuthContext')return{useAuth:()=>account};if(name==='@/api/identity')return{identityRequest};return load.call(this,name,...args);};
function mount(hook){const instance={hook,slots:[],effects:[],cursor:0,dirty:true,value:null};instance.flush=()=>{let guard=0;while(instance.dirty){assert.ok(++guard<20,'Hook must settle');runner=instance;instance.dirty=false;instance.cursor=0;instance.effects=[];instance.value=hook();for(const effect of instance.effects)effect();}return instance.value;};instance.unmount=()=>instance.slots.forEach(slot=>slot?.cleanup?.());instance.flush();return instance;}
const settle=async(instance)=>{await new Promise(resolve=>setImmediate(resolve));return instance.flush();};
const emit=next=>{appState.currentState=next;for(const callback of [...listeners])callback(next);};
const addresses=mount(require('../src/hooks/use-customer-addresses.ts').useCustomerAddresses);
assert.equal(requests.length,1,'Initial focus must not duplicate address load');
requests[0].resolve([{id:11,customerId:1,streetAddress:'Saved address'}]);await settle(addresses);
assert.equal(addresses.value.loading,false);assert.equal(addresses.value.addresses[0].id,'11');
emit('background');addresses.flush();emit('active');addresses.flush();
assert.equal(requests.length,2);assert.equal(addresses.value.loading,false,'Background refresh must not unmount booking');
assert.equal(addresses.value.addresses[0].id,'11');
requests[1].reject(new Error('Kết nối quá lâu. Vui lòng thử lại.'));await settle(addresses);
assert.equal(addresses.value.error,'');assert.match(addresses.value.refreshError,/Kết nối/);assert.equal(addresses.value.addresses.length,1,'Keep last persisted addresses on transient refresh error');
addresses.value.retry();addresses.flush();const stale=requests.at(-1);
account={...account,currentCustomer:{id:'2'},accessToken:'session-two'};addresses.dirty=true;addresses.flush();
assert.equal(addresses.value.addresses.length,0,'Never display previous customer data');
stale.resolve([{id:11,customerId:1}]);await settle(addresses);assert.equal(addresses.value.addresses.length,0);
requests.at(-1).resolve([{id:22,customerId:2}]);await settle(addresses);assert.equal(addresses.value.addresses[0].id,'22');
focused=false;addresses.dirty=true;addresses.flush();focused=true;addresses.dirty=true;addresses.flush();
assert.equal(addresses.value.loading,false,'Returning from another screen preserves booking');requests.at(-1).resolve([{id:22,customerId:2}]);await settle(addresses);
addresses.unmount();
const activity=mount(require('../src/hooks/use-booking-resume.ts').useBookingResume);
const revision=activity.value.revision;emit('background');activity.flush();assert.equal(activity.value.active,false);
emit('active');activity.flush();assert.equal(activity.value.active,true);assert.equal(activity.value.revision,revision+1,'Foreground must invalidate earlier checks');
emit('active');activity.flush();assert.equal(activity.value.revision,revision+1,'Duplicate active events do not repeat refresh');
focused=false;activity.dirty=true;activity.flush();assert.equal(activity.value.active,false);
focused=true;activity.dirty=true;activity.flush();assert.equal(activity.value.revision,revision+2,'Returning to booking rechecks current data');activity.unmount();
Module._load=load;
console.log('Booking resume: foreground/focus revalidation, background cancellation, bounded read retries, no business-error retry, address refresh without unmount and cross-account response isolation passed.');
