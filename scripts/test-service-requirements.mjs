import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { readFileSync } from 'node:fs';
const require=createRequire(import.meta.url), ts=require('typescript');
Module._extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const {serviceAnswersIssue}=require('../src/utils/service-requirements.ts');
const fields=[
  {fieldKey:'count',label:'Số máy',fieldType:'NUMBER',required:true,options:[],validationRules:{min:1,max:10,integer:true}},
  {fieldKey:'water',label:'Có nước',fieldType:'BOOLEAN',required:true,options:[],validationRules:{}},
  {fieldKey:'type',label:'Loại máy',fieldType:'SELECT',required:true,options:['Front','Top'],validationRules:{}},
  {fieldKey:'tasks',label:'Công việc',fieldType:'MULTI_SELECT',required:true,options:['Clean','Dry'],validationRules:{}},
];
assert.match(serviceAnswersIssue(fields,{}),/Số máy/);
const valid={count:'2',water:false,type:'Front',tasks:['Clean']};
assert.equal(serviceAnswersIssue(fields,valid),'');
for(const count of ['0','11','1.5','NaN']) assert.match(serviceAnswersIssue(fields,{...valid,count}),/Số máy/);
assert.match(serviceAnswersIssue(fields,{...valid,type:'Unknown'}),/Loại máy/);
assert.match(serviceAnswersIssue(fields,{...valid,tasks:[]}),/Công việc/);
assert.match(serviceAnswersIssue(fields,{...valid,tasks:['Unknown']}),/Công việc/);
assert.match(serviceAnswersIssue(fields,{...valid,water:null}),/Có nước/);
console.log('Service questionnaires: required fields, boolean false, numeric bounds/integer counts and service-specific choices passed.');

const {serviceSetupSteps,serviceSetupIssue}=require('../src/utils/service-setup.ts');
const detail={service:{priceUnit:'ITEM'},requirements:[
  {...fields[1],id:2,displayOrder:20},
  {...fields[0],id:1,displayOrder:10},
  {id:3,fieldKey:'notes',label:'Ghi chú',fieldType:'TEXT',required:false,options:[],validationRules:{},displayOrder:30},
],packages:[{id:10,defaultStaffCount:2,durationMinutes:120}]};
const steps=serviceSetupSteps(detail);
assert.deepEqual(steps.map(step=>step.key),['question:count','question:water','question:notes','package','quantity','staff']);
assert.deepEqual(serviceSetupSteps({...detail,service:{priceUnit:'HOUR'}}).map(step=>step.kind),['QUESTION','QUESTION','QUESTION','PACKAGE','STAFF']);
assert.equal(serviceSetupSteps(detail,true).length,3,'Staff-selected flow reuses question screens without changing its existing package step');
const selection={answers:{},packageId:'10',quantity:1,staffCount:2};
assert.match(serviceSetupIssue(steps[0],detail,selection),/Số máy/);
assert.equal(serviceSetupIssue(steps[0],detail,{...selection,answers:{count:2}}),'','Only the current question is required before advancing');
assert.match(serviceSetupIssue(steps[1],detail,{...selection,answers:{count:2}}),/Có nước/);
assert.equal(serviceSetupIssue(steps[1],detail,{...selection,answers:{count:2,water:false}}),'','False must remain a valid confirmed choice');
assert.equal(serviceSetupIssue(steps[2],detail,selection),'','Optional question can be skipped');
assert.match(serviceSetupIssue(steps[3],detail,{...selection,packageId:'999'}),/gói dịch vụ/);
assert.match(serviceSetupIssue(steps[4],detail,{...selection,quantity:7}),/12 giờ/);
assert.match(serviceSetupIssue(steps[4],detail,{...selection,quantity:1.5}),/số lượng/);
assert.match(serviceSetupIssue(steps[5],detail,{...selection,staffCount:1}),/nhân viên/);
assert.equal(serviceSetupIssue(steps[5],detail,selection),'');
console.log('Guided service setup: ordered single-question screens, current-step gating, optional skip, boolean false, package ownership, quantity duration and required staffing passed.');

const {minimumStaffForArea}=require('../src/utils/service-setup.ts');
const areaDetail={...detail,packages:[{id:10,defaultStaffCount:2,durationMinutes:120,maxArea:80}]};
assert.equal(minimumStaffForArea(areaDetail,'10',{areaM2:80},1),2);
assert.equal(minimumStaffForArea(areaDetail,'10',{areaM2:81},1),4);
assert.equal(minimumStaffForArea(areaDetail,'10',{areaM2:160},2),2);
assert.match(serviceSetupIssue({kind:'STAFF',key:'staff',title:''},areaDetail,{...selection,answers:{areaM2:160},staffCount:3}),/ít nhất 4/);
assert.equal(minimumStaffForArea({...areaDetail,packages:[{...areaDetail.packages[0],maxArea:0.29}]},'10',{areaM2:29},100),2,'Decimal capacity at an exact boundary must not add an unnecessary team');
assert.equal(minimumStaffForArea(areaDetail,'10',{areaM2:'bad'},1),2);
console.log('Area staffing: whole-team coverage, quantity scaling, manual under-staff rejection and decimal boundary passed.');
