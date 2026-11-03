import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { operationRequest, operationSession } from '@/api/operations';
import { IconSymbol } from '@/components/common/IconSymbol';
import { EvidencePhoto } from '@/components/common/EvidencePhoto';
type Evidence = {id:number;stage:'BEFORE'|'AFTER';thumbnailUrl:string;createdAt:string};
type Draft = {stage:'BEFORE'|'AFTER';imageBase64:string;requestKey:string;uri:string};
export function JobEvidencePanel({bookingId,status,onReadyChange}:{bookingId:string;status:string;onReadyChange:(ready:boolean)=>void}){
 const [items,setItems]=useState<Evidence[]>([]),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false),[draft,setDraft]=useState<Draft|null>(null);
 const locked=useRef(false),owner=operationSession()?.token;
 const load=useCallback(async(signal?:AbortSignal)=>{const rows=await operationRequest<Evidence[]>('booking',`/bookings/${bookingId}/evidence`,'GET',undefined,signal);if(signal?.aborted||owner!==operationSession()?.token)return;setItems(rows);setLoaded(true);onReadyChange(rows.some(e=>e.stage==='BEFORE')&&rows.some(e=>e.stage==='AFTER'));},[bookingId,onReadyChange,owner]);
 useFocusEffect(useCallback(()=>{const controller=new AbortController();let running=false;const update=async()=>{if(running||locked.current||AppState.currentState!=='active')return;running=true;try{await load(controller.signal);}catch(cause){if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:'Chưa tải được minh chứng.');}finally{running=false;}};void update();const timer=setInterval(()=>void update(),10000);return()=>{controller.abort();clearInterval(timer);};},[load]));
 const choose=async(stage:Draft['stage'],camera:boolean)=>{if(locked.current||draft)return;locked.current=true;setBusy(true);setError('');setMessage('');try{
  if(camera){const permission=await ImagePicker.requestCameraPermissionsAsync();if(!permission.granted)throw new Error('Cần cho phép camera để chụp ảnh minh chứng. Bạn cũng có thể chọn ảnh từ thư viện.');}
  const options:ImagePicker.ImagePickerOptions={mediaTypes:['images'],allowsEditing:false,quality:0.65,base64:true};
  const result=camera?await ImagePicker.launchCameraAsync(options):await ImagePicker.launchImageLibraryAsync(options);
  if(result.canceled||owner!==operationSession()?.token)return;const asset=result.assets[0];
  if(!asset?.base64)throw new Error('Chưa đọc được ảnh. Vui lòng chọn lại JPEG/PNG.');
  if(asset.base64.length>2796204)throw new Error('Ảnh lớn hơn 2MB. Vui lòng chọn ảnh nhỏ hơn hoặc chụp lại.');
  setDraft({stage,imageBase64:asset.base64,uri:asset.uri,requestKey:'evidence-'+Date.now()+'-'+Math.random().toString(36).slice(2)});
 }catch(cause){setError(cause instanceof Error?cause.message:'Chưa chọn được ảnh.');}finally{locked.current=false;setBusy(false);}};
 const send=async()=>{if(locked.current||!draft)return;locked.current=true;setBusy(true);setError('');setMessage('');try{
  await operationRequest('booking',`/bookings/${bookingId}/evidence`,'POST',{stage:draft.stage,imageBase64:draft.imageBase64,requestKey:draft.requestKey});
  if(owner!==operationSession()?.token)return;setDraft(null);setMessage('Ảnh đã được lưu vào đơn và tự động gửi vào chat với khách hàng.');
  try{await load();}catch{setError('Ảnh đã lưu. Đang chờ tải lại danh sách minh chứng.');}
 }catch(cause){if(owner===operationSession()?.token)setError(cause instanceof Error?cause.message:'Chưa gửi được ảnh. Hãy thử lại cùng ảnh này.');}finally{locked.current=false;setBusy(false);}};
 const ready=items.some(e=>e.stage==='BEFORE')&&items.some(e=>e.stage==='AFTER');
 return <View style={s.card}><View style={s.heading}><IconSymbol name="image" size={22} color="#008C5C"/><Text style={s.title}>Ảnh minh chứng & nghiệm thu</Text></View><Text style={s.note}>Cần tối thiểu 2 ảnh khác nhau: 1 ảnh TRƯỚC và 1 ảnh SAU khi thực hiện dịch vụ. Ảnh đã gửi được lưu trong đơn và chat để khách hàng, admin đối chiếu.</Text>
  {!loaded&&<ActivityIndicator color="#008C5C"/>}
  {(['BEFORE','AFTER'] as const).map(stage=><View key={stage} style={s.group}><View style={s.groupHeader}><Text style={s.groupTitle}>{stage==='BEFORE'?'Trước khi thực hiện':'Sau khi thực hiện'}</Text><Text style={s.count}>{items.filter(e=>e.stage===stage).length} ảnh</Text></View>
   {items.filter(e=>e.stage===stage).map(e=><View key={e.id}><EvidencePhoto bookingId={bookingId} evidenceId={e.id} thumbnail={e.thumbnailUrl} caption={(stage==='BEFORE'?'Ảnh trước':'Ảnh sau')+' · '+new Date(e.createdAt).toLocaleString('vi-VN')}/><Text style={s.time}>Đã gửi {new Date(e.createdAt).toLocaleString('vi-VN')}</Text></View>)}
   {status!=='COMPLETED'&&['EN_ROUTE','IN_PROGRESS'].includes(status)&&(stage==='BEFORE'||status==='IN_PROGRESS')&&<View style={s.actions}><Pressable accessibilityRole="button" disabled={busy||!!draft} onPress={()=>void choose(stage,true)} style={[s.primary,(busy||!!draft)&&s.disabled]}><Text style={s.white}>Chụp ảnh {stage==='BEFORE'?'trước':'sau'}</Text></Pressable><Pressable accessibilityRole="button" disabled={busy||!!draft} onPress={()=>void choose(stage,false)} style={[s.secondary,(busy||!!draft)&&s.disabled]}><Text style={s.link}>Chọn từ thư viện</Text></Pressable></View>}
  </View>)}
  {draft&&<View style={s.draft}><Text style={s.groupTitle}>Xem lại ảnh {draft.stage==='BEFORE'?'TRƯỚC':'SAU'} trước khi gửi</Text><Image source={{uri:draft.uri}} style={s.preview} resizeMode="contain"/><Pressable accessibilityRole="button" disabled={busy} onPress={()=>void send()} style={[s.primary,busy&&s.disabled]}><Text style={s.white}>{busy?'Đang lưu và gửi ảnh…':'Gửi minh chứng vào đơn & chat'}</Text></Pressable><Pressable disabled={busy} onPress={()=>setDraft(null)} style={s.secondary}><Text style={s.link}>Bỏ ảnh đang chọn</Text></Pressable></View>}
  {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}{!!message&&<Text style={s.success}>{message}</Text>}
  <Text style={[s.readiness,ready?s.success:s.note]}>{ready?'Đã đủ ảnh trước và sau để gửi nghiệm thu.':'Chưa đủ ảnh trước và sau. Hãy gửi đủ minh chứng trước khi hoàn thành ca.'}</Text>
 </View>;
}
const s=StyleSheet.create({card:{backgroundColor:'#fff',padding:18,borderRadius:18,borderWidth:1,borderColor:'#DCE9E0',gap:14,marginBottom:16},heading:{flexDirection:'row',gap:9,alignItems:'center'},title:{fontSize:16,fontWeight:'800',color:'#173B2F',flex:1},note:{fontSize:12,lineHeight:20,color:'#708575'},group:{gap:10,padding:13,borderRadius:14,backgroundColor:'#F6FAF7',borderWidth:1,borderColor:'#E5EEE8'},groupHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},groupTitle:{fontSize:13,fontWeight:'700',color:'#345A42'},count:{fontSize:11,color:'#008C5C'},actions:{gap:8},primary:{minHeight:46,backgroundColor:'#00B074',borderRadius:12,padding:13,alignItems:'center',justifyContent:'center'},white:{fontSize:12,fontWeight:'700',color:'#fff'},secondary:{minHeight:44,padding:12,alignItems:'center',borderRadius:12,borderWidth:1,borderColor:'#D9E9DE',backgroundColor:'#fff'},link:{fontSize:12,fontWeight:'600',color:'#008C5C'},disabled:{opacity:0.5},draft:{padding:14,gap:12,borderWidth:1,borderColor:'#BEE1CB',borderRadius:14,backgroundColor:'#F2FAF5'},preview:{height:210,width:'100%',borderRadius:12,backgroundColor:'#E6F1E9'},error:{fontSize:12,lineHeight:20,color:'#B91C1C'},success:{fontSize:12,lineHeight:20,color:'#008C5C'},time:{fontSize:10,color:'#8A9B90'},readiness:{padding:12,borderRadius:10,backgroundColor:'#F2F7F4'}});
