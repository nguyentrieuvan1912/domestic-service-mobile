import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { operationRequest, operationSession } from '@/api/operations';

export function EvidencePhoto({ bookingId, evidenceId, thumbnail, caption }: { bookingId: string | number; evidenceId: string | number; thumbnail: string; caption: string }) {
  const [visible, setVisible] = useState(false), [original, setOriginal] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const mounted = useRef(true), owner = operationSession()?.token;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const open = async () => {
    setVisible(true); if (original || loading) return; setLoading(true); setError('');
    try { const result = await operationRequest<{ dataUrl: string }>('booking', `/bookings/${bookingId}/evidence/${evidenceId}/original`); if (mounted.current && owner === operationSession()?.token) setOriginal(result.dataUrl); }
    catch (cause) { if (mounted.current && owner === operationSession()?.token) setError(cause instanceof Error ? cause.message : 'Chưa tải được ảnh gốc.'); }
    finally { if (mounted.current) setLoading(false); }
  };
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={`Xem ảnh gốc: ${caption}`} onPress={() => void open()} style={s.photo}><Image source={{ uri: thumbnail }} style={s.thumbnail} resizeMode="cover" /><Text style={s.hint}>Chạm để xem ảnh gốc</Text></Pressable>
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}><View style={s.overlay}><Text style={s.caption}>{caption}</Text>{loading && <ActivityIndicator color="#fff" />}{!!error && <Text style={s.error}>{error}</Text>}<Image source={{ uri: original || thumbnail }} resizeMode="contain" style={s.original} /><Pressable accessibilityRole="button" onPress={() => setVisible(false)} style={s.close}><Text style={s.closeText}>Đóng ảnh</Text></Pressable></View></Modal>
  </>;
}
const s = StyleSheet.create({photo:{gap:6,marginVertical:8,padding:8,backgroundColor:'#fff',borderRadius:14},thumbnail:{width:210,maxWidth:'100%',height:150,borderRadius:12,backgroundColor:'#E2E8F0'},hint:{fontSize:10,color:'#708575'},overlay:{flex:1,backgroundColor:'rgba(5,18,12,0.96)',padding:20,paddingVertical:40,gap:16,alignItems:'center'},caption:{color:'#fff',fontSize:15,fontWeight:'700',textAlign:'center'},original:{flex:1,width:'100%'},error:{color:'#FCA5A5',textAlign:'center'},close:{padding:15,borderRadius:12,backgroundColor:'#008C5C',alignSelf:'stretch',alignItems:'center'},closeText:{color:'#fff',fontWeight:'700'}});
