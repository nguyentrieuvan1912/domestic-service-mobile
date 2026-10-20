import { Pressable, Text, TextInput, View } from 'react-native';
import { memo } from 'react';
import type { CatalogDetail } from '@/api/catalog-types';
export function ServiceQuantity({ value, change }: { value: number; change: (value: number) => void }) {
  return <View style={{ paddingVertical: 12, gap: 8 }}>
    <Text style={{ color: '#334155', fontWeight: '700' }}>Số lượng gói cần thực hiện</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
      <Pressable accessibilityLabel="Giảm số lượng" disabled={value <= 1} onPress={() => change(value - 1)} style={{ padding: 12, backgroundColor: '#E2E8F0', borderRadius: 10 }}><Text>−</Text></Pressable>
      <Text style={{ fontSize: 18 }}>{value}</Text>
      <Pressable accessibilityLabel="Tăng số lượng" disabled={value >= 100} onPress={() => change(value + 1)} style={{ padding: 12, backgroundColor: '#E2E8F0', borderRadius: 10 }}><Text>+</Text></Pressable>
    </View>
    <Text style={{ color: '#64748B' }}>Số lượng nhân cho cả gói đã chọn, kể cả gói combo. Mỗi đơn tối đa 12 giờ.</Text>
  </View>;
}
export function ServiceAnswersSummary({ fields, values }: { fields: CatalogDetail['requirements']; values: Record<string, unknown> }) {
  const answered=fields.filter(field => values[field.fieldKey] != null && String(values[field.fieldKey]).trim() !== '');
  if (!answered.length) return null;
  return <View style={{ padding: 16, borderRadius: 16, backgroundColor: '#FFF', gap: 10, marginBottom: 16 }}>
    <Text style={{ fontWeight: '700', color: '#047857' }}>Yêu cầu công việc của bạn</Text>
    {answered.map(field => {
      const value=values[field.fieldKey];
      return <View key={field.id} style={{ gap: 3 }}><Text style={{ color: '#64748B' }}>{field.label}</Text><Text style={{ color: '#0F172A' }}>{typeof value === 'boolean' ? value ? 'Có' : 'Không' : Array.isArray(value) ? value.join(', ') : String(value)}</Text></View>;
    })}
  </View>;
}
function ServiceQuestionsContent({ fields, values, change, title }: { fields: CatalogDetail['requirements']; values: Record<string, unknown>; change: (values: Record<string, unknown>) => void; title?: string }) {
  return <View style={{ gap: 16, paddingVertical: 12 }}>{title && <Text style={{ color: '#047857', fontSize: 18, fontWeight: '700' }}>{title}</Text>}{fields.length > 0 && <Text style={{ color: '#64748B' }}>Mô tả đúng nhu cầu để nhân viên chuẩn bị. * Thông tin bắt buộc.</Text>}{fields.map(field => <View key={field.id}><Text style={{ color: '#334155', fontWeight: '700', marginBottom: 6 }}>{field.label}{field.required ? ' *' : ''}</Text>{['BOOLEAN','SELECT','MULTI_SELECT'].includes(field.fieldType) ?
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(field.fieldType === 'BOOLEAN' ? ['Có', 'Không'] : field.options.map(String)).map((option, index) => { const value = field.fieldType === 'BOOLEAN' ? index === 0 : option; const list = Array.isArray(values[field.fieldKey]) ? values[field.fieldKey] as string[] : []; const selected = field.fieldType === 'MULTI_SELECT' ? list.includes(option) : values[field.fieldKey] === value; return <Pressable key={option} style={{ padding: 10, borderRadius: 10, borderWidth: 1, borderColor: selected ? '#059669' : '#CBD5E1', backgroundColor: '#FFF' }} onPress={() => change({ ...values, [field.fieldKey]: field.fieldType === 'MULTI_SELECT' ? selected ? list.filter(x=>x!==option) : [...list,option] : value })}><Text>{option}</Text></Pressable>; })}</View> :
    <TextInput accessibilityLabel={field.label} maxLength={2000} multiline={field.fieldType === 'TEXT'} keyboardType={field.fieldType === 'NUMBER' ? 'numeric' : 'default'} value={String(values[field.fieldKey] ?? '')} onChangeText={value => change({ ...values, [field.fieldKey]: value })} placeholder={field.fieldType === 'DATE' ? 'YYYY-MM-DD' : field.label} style={{ backgroundColor: '#FFF', color: '#0F172A', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1' }} />}{field.validationRules.hint != null && <Text style={{ color: '#64748B', marginTop: 6 }}>{String(field.validationRules.hint)}</Text>}{field.fieldType === 'NUMBER' && <Text style={{ color: '#64748B', fontSize: 12 }}>Từ {String(field.validationRules.min ?? 0)} đến {String(field.validationRules.max ?? 'không giới hạn')}</Text>}</View>)}</View>;
}
export const ServiceQuestions=memo(ServiceQuestionsContent);
