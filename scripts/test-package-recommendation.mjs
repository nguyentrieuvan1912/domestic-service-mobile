import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { readFileSync } from 'node:fs';
const require=createRequire(import.meta.url),ts=require('typescript');
Module._extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
let instance;const requests=[];
const equal=(a,b)=>a&&b&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
const react={
 useState(initial){const index=instance.cursor++;if(!(index in instance.slots))instance.slots[index]=initial;const owner=instance;return[owner.slots[index],next=>{owner.slots[index]=typeof next==='function'?next(owner.slots[index]):next;owner.dirty=true;}];},
 useCallback(callback,deps){const index=instance.cursor++;if(!equal(instance.slots[index]?.deps,deps))instance.slots[index]={deps,value:callback};return instance.slots[index].value;},
 useEffect(effect,deps){const index=instance.cursor++;if(!equal(instance.slots[index]?.deps,deps)){const old=instance.slots[index];instance.slots[index]={deps,cleanup:old?.cleanup};instance.effects.push(()=>{old?.cleanup?.();instance.slots[index].cleanup=effect();});}},
};
const originalLoad=Module._load;
Module._load=function(name,...args){if(name==='react')return react;if(name==='@/utils/service-requirements')return require('../src/utils/service-requirements.ts');if(name==='@/api/catalog')return{catalogGet:(path,signal)=>new Promise((resolve,reject)=>{requests.push({path,signal,resolve,reject});})};return originalLoad.call(this,name,...args);};
const {usePackageRecommendation}=require('../src/hooks/use-package-recommendation.ts');
const detail={service:{id:19},requirements:[{fieldKey:'areaM2',fieldType:'NUMBER',label:'Diện tích',required:true,validationRules:{min:10,max:1000,integer:true}}]};
let answers={areaM2:'80'},active=true,maxStaff=20;
instance={slots:[],cursor:0,effects:[],dirty:true,value:null};
const flush=()=>{let guard=0;while(instance.dirty){assert.ok(++guard<15);instance.dirty=false;instance.cursor=0;instance.effects=[];instance.value=usePackageRecommendation(detail,answers,maxStaff,720,active);for(const effect of instance.effects)effect();}return instance.value;};
const settle=async()=>{await new Promise(resolve=>setImmediate(resolve));flush();};
const debounce=async()=>{await new Promise(resolve=>setTimeout(resolve,370));};
flush();await debounce();assert.equal(requests.length,1);assert.match(requests[0].path,/areaM2=80/);
answers={areaM2:'130'};instance.dirty=true;flush();await debounce();assert.equal(requests.length,2);assert.equal(requests[0].signal.aborted,true);
requests[0].resolve({status:'RECOMMENDED',areaM2:80,options:[{packageId:35,requiredStaffCount:1}]});await settle();assert.equal(instance.value.data,null,'Old area response must not become applicable');
requests[1].resolve({status:'RECOMMENDED',areaM2:130,options:[{packageId:35,requiredStaffCount:2}]});await settle();assert.equal(instance.value.data.options[0].requiredStaffCount,2);
assert.equal(instance.value.measurementKey,'19:130');
answers={areaM2:'130.5'};instance.dirty=true;flush();await debounce();assert.equal(instance.value.data,null);assert.equal(requests.length,2,'Invalid integer area must not trigger recommendations');
answers={areaM2:'80'};active=false;instance.dirty=true;flush();await debounce();assert.equal(requests.length,2,'No background request');
active=true;maxStaff=1;instance.dirty=true;flush();await debounce();assert.match(requests[2].path,/maxStaffCount=1/);
requests[2].reject(new Error('Connection failed'));await settle();assert.match(instance.value.error,/Connection failed/);
instance.value.retry();flush();await debounce();assert.equal(requests.length,4);requests[3].resolve({status:'NO_MATCH',areaM2:80,options:[]});await settle();assert.equal(instance.value.data.status,'NO_MATCH');
for(const slot of instance.slots)slot?.cleanup?.();Module._load=originalLoad;
console.log('Package recommendation: debounced real-hook request parameters, stale-area rejection, invalid input, pause/resume, Mode A staff limit and manual retry passed.');
