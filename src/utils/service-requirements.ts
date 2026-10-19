import type { CatalogDetail } from '../api/catalog-types';

export function serviceAnswersIssue(fields: CatalogDetail['requirements'], values: Record<string, unknown>): string {
  for (const field of fields) {
    const value = values[field.fieldKey];
    const empty = value == null || String(value).trim() === '' || (Array.isArray(value) && value.length === 0);
    if (empty) { if (field.required) return 'Vui lòng nhập: ' + field.label; continue; }
    if (field.fieldType === 'NUMBER') {
      const number = Number(value), rules = field.validationRules;
      if (!Number.isFinite(number) || (rules.integer && !Number.isInteger(number))
        || (rules.min != null && number < Number(rules.min)) || (rules.max != null && number > Number(rules.max)))
        return 'Giá trị không phù hợp: ' + field.label;
    }
    if (field.fieldType === 'BOOLEAN' && typeof value !== 'boolean') return 'Vui lòng chọn: ' + field.label;
    if (field.fieldType === 'SELECT' && !field.options.includes(value)) return 'Vui lòng chọn: ' + field.label;
    if (field.fieldType === 'MULTI_SELECT' && (!Array.isArray(value) || value.some(item => !field.options.includes(item)))) return 'Vui lòng chọn: ' + field.label;
    if (String(value).length > 2000) return 'Thông tin quá dài: ' + field.label;
  }
  return '';
}
