import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { operationRequest, operationSession } from '@/api/operations';
type Entry = { id: number; kind: string; status: string; reason: string; amount: number; violation_number?: number; created_at: string };
export function StaffDisciplineHistory() {
 const [items, setItems] = useState<Entry[]>([]), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
 useFocusEffect(useCallback(() => { let active = true; const owner=operationSession()?.token;
  operationRequest<Entry[]>('finance','/staff/discipline').then(rows => { if(active && owner === operationSession()?.token){setItems(rows);setError('');} }).catch(cause => { if(active)setError(cause instanceof Error ? cause.message : 'Chưa tải được lịch sử.'); });
  return () => { active=false; };
 },[attempt]));
 return <View style={{ margin: 16, backgroundColor: '#fff', padding: 16, borderRadius: 16, gap: 12 }}><Text style={{ fontWeight: '700', fontSize: 17 }}>Thưởng, phạt & cảnh báo</Text>{error ? <Pressable onPress={() => setAttempt(a=>a+1)}><Text style={{ color: '#b91c1c' }}>{error} · Thử lại</Text></Pressable> : !items.length ? <Text style={{ color: '#64748b' }}>Chưa có lệnh thưởng, phạt hoặc cảnh báo.</Text> : null}{items.map(a=><View key={a.id} style={{ borderTopWidth:1,borderColor:'#e2e8f0',paddingTop:10,gap:5 }}><Text style={{ fontWeight:'600',color:a.kind==='REWARD'?'#047857':'#c2410c' }}>{a.status==='WARNING'?'Cảnh báo':a.status==='PENDING_FUNDS'?'Chờ trừ khi ví đủ tiền':a.kind==='REWARD'?'Đã cộng thưởng':'Đã trừ phạt'}{a.status!=='WARNING'?` · ${a.amount.toLocaleString('vi-VN')}đ`:''}{a.violation_number?` · Lần ${a.violation_number}`:''}</Text><Text style={{ color:'#475569',lineHeight:20 }}>{a.reason}</Text><Text style={{ color:'#94a3b8',fontSize:12 }}>Lệnh #{a.id} · {new Date(a.created_at).toLocaleString('vi-VN')}</Text></View>)}</View>;
}
