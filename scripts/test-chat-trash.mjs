import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const require=createRequire(import.meta.url),ts=require('typescript');
const oldResolve=Module._resolveFilename,oldLoad=Module._load;
Module._resolveFilename=function(specifier,parent,...args){if(specifier.startsWith('@/')){const base=resolve('src',specifier.slice(2));specifier=existsSync(base+'.ts')?base+'.ts':base+'.tsx';}return oldResolve.call(this,specifier,parent,...args);};
Module._load=function(specifier,parent,main){if(specifier==='react-native')return {Platform:{OS:'web'}};return oldLoad.call(this,specifier,parent,main);};
Module._extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const ops=require('../src/api/operations.ts'),{ChatRepository:repo}=require('../src/data/connectedChatRepository.ts');
const profile={id:101,role:'CUSTOMER'},actor={userId:'101',participantId:'101',role:'CUSTOMER',name:'Customer',avatar:''};
const conversation={id:7,bookingId:5,customerId:101,staffId:201,customerName:'Customer',staffName:'Staff',bookingStatus:'CONFIRMED',conversationStatus:'ACTIVE',customerTrashedAt:'2026-10-29T00:00:00Z',lastMessage:'old'};
let rows=[conversation],fail=false,release,delayed=false,deletes=0;
global.fetch=async(url,options)=>{
 if(options.method==='DELETE'){deletes++;return fail?Response.json({detail:'Deletion unavailable'},{status:503}):new Response(null,{status:204});}
 if(url.endsWith('/messages'))return Response.json([{id:1,conversationId:7,senderId:101,senderType:'CUSTOMER',content:'old',isRead:true}]);
 if(delayed){const snapshot=rows;await new Promise(resolve=>release=resolve);return Response.json(snapshot);}
 return Response.json(rows);
};
ops.connectOperationsSession(profile,'trash-customer');await repo.loadList(actor);await repo.load('7',actor);
fail=true;await assert.rejects(repo.deletePermanently('7',actor),/Deletion unavailable/);
assert.equal(repo.list().length,1,'Failed delete cannot report success or remove the thread');
assert.equal(repo.getMessages('7',actor).length,1);assert.equal(deletes,1,'Deletion must not be retried automatically');
fail=false;delayed=true;const oldRead=repo.loadList(actor);
await repo.deletePermanently('7',actor);assert.equal(repo.list().length,0);
release();await oldRead;assert.equal(repo.list().length,0,'An older poll must not resurrect a permanently deleted conversation');
delayed=false;rows=[{...conversation,customerTrashedAt:null,lastMessage:'new message'}];await repo.loadList(actor);
assert.equal(repo.getMessages('7',actor).length,0,'New messages must not restore deleted cached history');
await assert.rejects(repo.deletePermanently('7',actor),/thùng rác/);
await repo.load('7',actor);assert.equal(repo.getMessages('7',actor).length,1);
rows=[{...conversation,customerTrashedAt:null,customerDeletedThroughId:1,lastMessage:'New message on another device'}];
await repo.loadList(actor);
assert.equal(repo.getMessages('7',actor).length,0,'A deletion on another device clears old cached history even when fresh messages reopen the same thread before the next poll');
ops.connectOperationsSession({id:201,role:'STAFF'},'trash-staff');
const staff={...actor,userId:'201',participantId:'201',role:'STAFF'};
await repo.loadList(staff);await assert.rejects(repo.deletePermanently('7',staff),/Chỉ khách hàng/);
console.log('Chat trash: persisted-delete confirmation, failure preservation, no mutation retry, stale-poll protection, cache erasure, active-thread rejection and staff authorization passed.');
