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
  return pack && Number.isInteger(selection.staffCount) && selection.staffCount>=pack.defaultStaffCount && selection.staffCount<=20 ? '' : 'Số nhân viên chưa phù hợp với gói đã chọn.';
}
