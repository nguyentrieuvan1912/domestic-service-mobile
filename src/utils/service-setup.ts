import type { CatalogDetail } from '../api/catalog-types';
import { serviceAnswersIssue } from './service-requirements';

export type ServiceSetupStep =
  | { key: string; kind: 'QUESTION'; title: string; field: CatalogDetail['requirements'][number] }
  | { key: 'package'; kind: 'PACKAGE'; title: string }
  | { key: 'quantity'; kind: 'QUANTITY'; title: string }
  | { key: 'staff'; kind: 'STAFF'; title: string };

/** Steps come from the service's real catalog questionnaire; no synthetic answers. */
export function serviceSetupSteps(detail: CatalogDetail, questionsOnly = false): ServiceSetupStep[] {
  const steps: ServiceSetupStep[] = [...detail.requirements]
    .sort((a,b) => a.displayOrder-b.displayOrder || a.id-b.id)
    .map(field => ({ key: 'question:'+field.fieldKey, kind: 'QUESTION', title: field.label, field }));
  if (questionsOnly) return steps;
  steps.push({ key:'package',kind:'PACKAGE',title:'Chọn gói dịch vụ' });
  if(detail.service.priceUnit==='ITEM') steps.push({key:'quantity',kind:'QUANTITY',title:'Bạn cần bao nhiêu gói?'});
  steps.push({key:'staff',kind:'STAFF',title:'Chọn số nhân viên'});
  return steps;
}

export function serviceSetupIssue(step: ServiceSetupStep, detail: CatalogDetail, selection: {
  answers: Record<string,unknown>; packageId: string; quantity: number; staffCount: number;
}): string {
  if(step.kind==='QUESTION') return serviceAnswersIssue([step.field],selection.answers);
  const pack=detail.packages.find(item=>String(item.id)===selection.packageId);
  if(step.kind==='PACKAGE') return pack ? '' : 'Vui lòng chọn một gói dịch vụ để tiếp tục.';
  if(step.kind==='QUANTITY') {
    if(!Number.isInteger(selection.quantity) || selection.quantity<1 || selection.quantity>100) return 'Chọn số lượng gói từ 1 đến 100.';
    if(pack && pack.durationMinutes*selection.quantity>720) return 'Gói chính vượt quá 12 giờ. Vui lòng giảm số lượng hoặc chọn gói khác.';
    return '';
  }
  const minimum=minimumStaffForArea(detail,selection.packageId,selection.answers,selection.quantity);
  if(minimum>20)return 'Diện tích vượt định mức tối đa của gói này. Vui lòng chọn gói khác.';
  return pack && Number.isInteger(selection.staffCount) && selection.staffCount>=minimum && selection.staffCount<=20 ? '' : `Cần ít nhất ${minimum} nhân viên để đủ định mức diện tích của gói đã chọn.`;
}

export function minimumStaffForArea(detail: CatalogDetail, packageId: string, answers: Record<string,unknown>, quantity: number): number {
  const pack=detail.packages.find(item=>String(item.id)===packageId);
  const area=Number(answers.areaM2);
  if(!pack)return 1;
  if(!pack.maxArea||!Number.isFinite(area)||area<=0||!Number.isInteger(quantity)||quantity<1)return pack.defaultStaffCount;
  const capacityUnits=Math.round(pack.maxArea*100)*quantity;
  return Math.max(1,Math.ceil(Math.round(area*100)/capacityUnits))*pack.defaultStaffCount;
}
