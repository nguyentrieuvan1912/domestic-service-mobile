import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CatalogDetail } from '@/api/catalog-types';
import { BrandColors } from '@/constants/theme';
import { ServiceQuantity } from './ServiceQuestions';
import { serviceSetupIssue, type ServiceSetupStep } from '@/utils/service-setup';

interface Props {
  detail: CatalogDetail; steps: ServiceSetupStep[]; index: number; totalSteps?: number;
  answers: Record<string,unknown>; packageId: string; quantity: number; staffCount: number;
  setAnswers: (answers: Record<string,unknown>) => void;
  setPackage: (id: string) => void; setQuantity: (quantity: number) => void; setStaffCount: (count: number) => void;
  setIndex: (index: number) => void; back: () => void; complete: () => void;
  nextSection?: string;
}

export function ServiceSetupWizard(props: Props) {
  const { detail, steps, index, answers, packageId, quantity, staffCount }=props;
  const step=steps[Math.min(index,steps.length-1)];
  const [error,setError]=useState<{key: string;message: string}>();
  const scroll=useRef<ScrollView>(null);
  const pack=detail.packages.find(item=>String(item.id)===packageId);
  const last=index===steps.length-1;
  const nextTitle=last ? props.nextSection || 'Dịch vụ bổ sung' : steps[index+1].title;
  const changeAnswer=(value: unknown) => { setError(undefined); props.setAnswers({...answers,[step.kind==='QUESTION'?step.field.fieldKey:'']:value}); };
  const next=() => {
    const message=serviceSetupIssue(step,detail,props);
    if(message){setError({key:step.key,message});scroll.current?.scrollToEnd({animated:true});return;}
    Keyboard.dismiss();setError(undefined);
    if(last) props.complete(); else props.setIndex(index+1);
  };
  return <SafeAreaView style={styles.screen} edges={['top','bottom']}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quay lại bước trước" onPress={()=>{Keyboard.dismiss();setError(undefined);props.back();}} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
      <View style={{flex:1,gap:4}}><Text style={styles.serviceName} numberOfLines={1}>{detail.service.name}</Text><Text style={styles.progressText}>Bước {index+1} / {props.totalSteps || steps.length} · Thiết lập dịch vụ</Text></View>
    </View>
    <View accessibilityLabel={`Bước ${index+1} trên ${props.totalSteps || steps.length}`} style={styles.progressTrack}><View style={[styles.progressFill,{width:`${(index+1)/(props.totalSteps || steps.length)*100}%`}]} /></View>
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView key={step.key} ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{step.kind==='QUESTION' ? step.field.required ? 'THÔNG TIN CẦN CHỌN' : 'THÔNG TIN THÊM · CÓ THỂ BỎ QUA' : 'LỰA CHỌN CHO LỊCH ĐẶT'}</Text>
        <Text accessibilityRole="header" style={styles.title}>{step.title}</Text>
        {step.kind==='QUESTION' && <>
          <Text style={styles.description}>{step.field.fieldType==='MULTI_SELECT' ? 'Bạn có thể chọn nhiều mục. Chọn xong, bấm Tiếp tục ở bên dưới.' : ['SELECT','BOOLEAN'].includes(step.field.fieldType) ? 'Bấm vào một lựa chọn bên dưới, sau đó bấm Tiếp tục.' : step.field.fieldType==='NUMBER' ? 'Nhập con số vào ô bên dưới để chúng tôi chuẩn bị đúng nhu cầu.' : 'Nhập thông tin vào ô bên dưới. Nội dung sẽ được lưu cùng lịch đặt.'}</Text>
          {step.field.validationRules.hint != null && <Text style={styles.hint}>{String(step.field.validationRules.hint)}</Text>}
          {['BOOLEAN','SELECT','MULTI_SELECT'].includes(step.field.fieldType) ? (step.field.fieldType==='BOOLEAN'?['Có','Không']:step.field.options.map(String)).map((option,i)=>{
            const value=step.field.fieldType==='BOOLEAN'?i===0:option;
            const current=answers[step.field.fieldKey];
            const selected=step.field.fieldType==='MULTI_SELECT'?Array.isArray(current)&&current.includes(option):current===value;
            return <Pressable key={option} accessibilityRole={step.field.fieldType==='MULTI_SELECT'?'checkbox':'radio'} accessibilityState={{checked:selected}} accessibilityLabel={option}
              onPress={()=>{const list=Array.isArray(current)?current:[];changeAnswer(step.field.fieldType==='MULTI_SELECT'?selected?list.filter(item=>item!==option):[...list,option]:value);}}
              style={[styles.option,selected&&styles.selected]}>
              <Text style={[styles.optionText,selected&&styles.selectedText]}>{option}</Text><Text style={[styles.indicator,selected&&styles.selectedText]}>{selected?'✓':'○'}</Text>
            </Pressable>;
          }) : <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Nhập {step.field.label.toLocaleLowerCase('vi-VN')}</Text>
            <TextInput key={step.key} accessibilityLabel={step.field.label} placeholder={step.field.fieldType==='DATE'?'YYYY-MM-DD':'Bấm vào đây để nhập'} placeholderTextColor="#94A3B8"
              value={String(answers[step.field.fieldKey] ?? '')} onChangeText={changeAnswer} maxLength={2000}
              keyboardType={step.field.fieldType==='NUMBER'?'numeric':/điện thoại/i.test(step.field.label)?'phone-pad':'default'}
              multiline={step.field.fieldType==='TEXT'&&!/điện thoại/i.test(step.field.label)}
              style={[styles.input,step.field.fieldType==='TEXT'&&!/điện thoại/i.test(step.field.label)&&styles.multiline]} />
            {step.field.fieldType==='NUMBER'&&<Text style={styles.description}>Từ {String(step.field.validationRules.min ?? 0)} đến {String(step.field.validationRules.max ?? 'không giới hạn')}{step.field.validationRules.integer?' · Nhập số nguyên':''}</Text>}
          </View>}
        </>}
        {step.kind==='PACKAGE' && <>
          <Text style={styles.description}>Chọn một gói phù hợp. Giá và thời lượng được lấy từ bảng giá của dịch vụ.</Text>
          {detail.packages.map(item=><Pressable key={item.id} accessibilityRole="radio" accessibilityState={{checked:String(item.id)===packageId}} accessibilityLabel={item.name}
            onPress={()=>{setError(undefined);props.setPackage(String(item.id));}} style={[styles.package,String(item.id)===packageId&&styles.selected]}>
            <Text style={styles.optionText}>{item.name}{String(item.id)===packageId?'  ✓':''}</Text>
            {!!item.description&&<Text style={styles.description}>{item.description}</Text>}
            <Text style={styles.description}>{item.durationMinutes} phút · {item.defaultStaffCount} nhân viên{item.maxArea?` · Tối đa ${item.maxArea} m²`:''}</Text>
            <Text style={styles.price}>{item.basePrice.toLocaleString('vi-VN')}đ / gói</Text>
          </Pressable>)}
        </>}
        {step.kind==='QUANTITY' && <View style={styles.inputCard}>
          <Text style={styles.optionText}>{pack?.name}</Text><ServiceQuantity value={quantity} change={props.setQuantity} />
          {pack&&<Text style={styles.hint}>{quantity} gói × {pack.basePrice.toLocaleString('vi-VN')}đ · Thời gian gói chính: {pack.durationMinutes*quantity} phút</Text>}
        </View>}
        {step.kind==='STAFF' && <View style={styles.inputCard}>
          <Text style={styles.description}>Gói đã chọn cần tối thiểu {pack?.defaultStaffCount || 1} nhân viên. Nếu chọn nhiều người, lịch sẽ chờ đủ người nhận.</Text>
          <View style={styles.counter}>
            <Pressable accessibilityRole="button" accessibilityLabel="Giảm số nhân viên" disabled={staffCount<=(pack?.defaultStaffCount || 1)} onPress={()=>props.setStaffCount(Math.max(pack?.defaultStaffCount || 1,staffCount-1))} style={styles.counterButton}><Text style={styles.counterSign}>−</Text></Pressable>
            <Text style={styles.counterValue}>{staffCount} người</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Tăng số nhân viên" disabled={staffCount>=20} onPress={()=>props.setStaffCount(Math.min(20,staffCount+1))} style={styles.counterButton}><Text style={styles.counterSign}>+</Text></Pressable>
          </View>
          <Text style={styles.hint}>Bạn sẽ xem giá chính xác theo gói, số lượng và số nhân viên trước khi xác nhận đặt lịch.</Text>
        </View>}
        {error?.key===step.key&&<Text accessibilityRole="alert" style={styles.error}>{error.message}</Text>}
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.nextLabel}>Tiếp theo: {nextTitle}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Tiếp tục" onPress={next} style={styles.next}><Text style={styles.nextText}>{step.kind==='QUESTION'&&!step.field.required&&!String(answers[step.field.fieldKey] ?? '').trim()?'Bỏ qua & Tiếp tục':'Tiếp tục'}  →</Text></Pressable>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:'#F5FAF7'},header:{padding:16,flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#FFF'},back:{width:44,height:44,borderRadius:14,backgroundColor:'#F1F5F9',alignItems:'center',justifyContent:'center'},backText:{fontSize:32,color:'#0F172A'},serviceName:{fontSize:16,fontWeight:'700',color:'#0F172A'},progressText:{fontSize:12,color:'#64748B'},progressTrack:{height:4,backgroundColor:'#DCEDE4'},progressFill:{height:4,backgroundColor:BrandColors.primary},
  content:{padding:22,gap:16,paddingBottom:28},eyebrow:{fontSize:11,fontWeight:'700',letterSpacing:1,color:'#047857'},title:{fontSize:27,lineHeight:35,fontWeight:'800',color:'#0F172A'},description:{fontSize:14,lineHeight:22,color:'#64748B'},hint:{fontSize:14,lineHeight:22,color:'#047857',backgroundColor:'#E8F5EE',padding:14,borderRadius:12},
  option:{minHeight:72,padding:18,borderRadius:18,borderWidth:1.5,borderColor:'#D6E2DB',backgroundColor:'#FFF',flexDirection:'row',alignItems:'center',gap:12},selected:{borderColor:BrandColors.primary,backgroundColor:'#E9F8F0'},optionText:{fontSize:17,fontWeight:'700',color:'#1E293B',flexShrink:1},selectedText:{color:'#047857'},indicator:{fontSize:24,color:'#94A3B8',marginLeft:'auto'},inputCard:{backgroundColor:'#FFF',borderRadius:18,padding:18,gap:14},inputLabel:{fontSize:13,fontWeight:'700',color:'#475569'},input:{borderWidth:1.5,borderColor:'#A9C9B8',borderRadius:14,padding:16,fontSize:18,color:'#0F172A',minHeight:60,backgroundColor:'#FCFFFD'},multiline:{minHeight:150,textAlignVertical:'top'},package:{backgroundColor:'#FFF',borderRadius:18,borderWidth:1.5,borderColor:'#D6E2DB',padding:18,gap:10},price:{fontSize:20,fontWeight:'800',color:'#047857'},counter:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:12},counterButton:{height:52,width:52,borderRadius:16,backgroundColor:'#E9F8F0',alignItems:'center',justifyContent:'center'},counterSign:{fontSize:26,color:'#047857'},counterValue:{fontSize:24,fontWeight:'800',color:'#0F172A'},error:{fontSize:14,color:'#B91C1C',backgroundColor:'#FEF2F2',padding:14,borderRadius:12},footer:{backgroundColor:'#FFF',paddingHorizontal:20,paddingTop:12,paddingBottom:14,gap:10,borderTopWidth:1,borderTopColor:'#E2E8F0'},nextLabel:{fontSize:12,color:'#64748B',textAlign:'center'},next:{minHeight:56,borderRadius:16,backgroundColor:BrandColors.primary,alignItems:'center',justifyContent:'center'},nextText:{fontSize:17,fontWeight:'800',color:'#FFF'},
});
