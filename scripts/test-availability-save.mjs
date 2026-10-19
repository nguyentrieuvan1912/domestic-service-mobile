import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url), ts = require('typescript');
Module._extensions['.ts'] = (module,file) => module._compile(ts.transpileModule(readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const { availabilityWasSaved, saveAvailabilityWithReadback } = require('../src/utils/availability-save.ts');
const draft = {weekStart:'2026-10-19', confirmedDates:[], matchNotifications:true, areaIds:['Phường Gò Vấp','Phường Sài Gòn'],days:Array.from({length:7},(_,i)=>({date:`2026-10-${19+i}`,intervals:i===0?[{startsAt:'2026-10-19T08:00:00+07:00',endsAt:'2026-10-19T12:00:00+07:00'}]:[]}))};
const snapshot = {saved:{...structuredClone(draft),revision:5,updatedAt:'2026-10-19T07:00:00Z',registeredWeekStarts:['2026-10-19']},bookings:[],unknownBookingCodes:[]};
snapshot.saved.areaIds.reverse();
snapshot.saved.days[0].intervals=[{startsAt:'2026-10-19T01:00:00Z',endsAt:'2026-10-19T05:00:00Z'}];
assert.equal(availabilityWasSaved(snapshot,draft,4),true,'Readback compares instants and ignores area order');
let writes=0,reads=0;
const failure=new Error('Response lost');
const write=async()=>{writes++;throw failure;};
const read=async()=>{reads++;return snapshot;};
assert.equal(await saveAvailabilityWithReadback(draft,4,write,read),snapshot);
assert.equal(writes,1,'Never repeat a possibly committed write');assert.equal(reads,1);
for(const alter of [s=>s.saved.revision=4,s=>s.saved.registeredWeekStarts=[],s=>s.saved.areaIds.pop(),s=>s.saved.matchNotifications=false,s=>s.saved.days[1].intervals=[{startsAt:'2026-10-20T01:00:00Z',endsAt:'2026-10-20T05:00:00Z'}],s=>s.saved.days[0].intervals[0].endsAt='invalid',s=>s.saved.days.shift()]) {
 const different=structuredClone(snapshot);alter(different);
 await assert.rejects(saveAvailabilityWithReadback(draft,4,write,async()=>different),error=>error===failure);
}
await assert.rejects(saveAvailabilityWithReadback(draft,4,write,async()=>{throw new Error('Read failed');}),error=>error===failure);
assert.equal(await saveAvailabilityWithReadback(draft,4,async()=>snapshot,async()=>{throw new Error('Must not read after successful write');}),snapshot);
console.log('Availability save: lost response and stale revision reconcile only against matching newer persisted week; changed slots/areas/preferences, missing registration, unchanged revision and failed verification retain the error. No write retry.');
