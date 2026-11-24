import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { operationRequest, operationSession } from '@/api/operations';
import { useAppTheme } from '@/context/ThemeContext';
type Entry = { id: number; kind: string; status: string; reason: string; amount: number; violation_number?: number; created_at: string };
export function StaffDisciplineHistory() {
 const { colors } = useAppTheme();
 const [items, setItems] = useState<Entry[]>([]), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
 useFocusEffect(useCallback(() => { let active = true; const owner=operationSession()?.token;
  operationRequest<Entry[]>('finance','/staff/discipline').then(rows => { if(active && owner === operationSession()?.token){setItems(rows);setError('');} }).catch(cause => { if(active)setError(cause instanceof Error ? cause.message : 'Chưa tải được lịch sử.'); });
  return () => { active=false; };
 },[attempt]));
 return <View style={{ margin: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 16, gap: 12 }}><Text style={{ fontWeight: '700', fontSize: 17, color: colors.text }}>Thưởng, phạt & cảnh báo</Text>{error ? <Pressable onPress={() => setAttempt(a=>a+1)}><Text style={{ color: colors.dangerText }}>{error} · Thử lại</Text></Pressable> : !items.length ? <Text style={{ color: colors.textMuted }}>Chưa có lệnh thưởng, phạt hoặc cảnh báo.</Text> : null}{items.map(a=><View key={a.id} style={{ borderTopWidth:1,borderColor:colors.divider,paddingTop:10,gap:5 }}><Text style={{ fontWeight:'600',color:a.kind==='REWARD'?colors.accentText:colors.warningText }}>{a.status==='WARNING'?'Cảnh báo':a.status==='PENDING_FUNDS'?'Chờ trừ khi ví đủ tiền':a.kind==='REWARD'?'Đã cộng thưởng':'Đã trừ phạt'}{a.status!=='WARNING'?` · ${a.amount.toLocaleString('vi-VN')}đ`:''}{a.violation_number?` · Lần ${a.violation_number}`:''}</Text><Text style={{ color:colors.textSecondary,lineHeight:20 }}>{a.reason}</Text><Text style={{ color:colors.textMuted,fontSize:12 }}>Lệnh #{a.id} · {new Date(a.created_at).toLocaleString('vi-VN')}</Text></View>)}</View>;
}
