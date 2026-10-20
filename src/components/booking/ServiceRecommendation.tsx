import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { usePackageRecommendation } from '@/hooks/use-package-recommendation';
import type { PackageSuggestion } from '@/api/catalog-types';

export function ServiceRecommendation({resource,packageId,staffCount,quantity,apply}:{resource:ReturnType<typeof usePackageRecommendation>;packageId:string;staffCount:number;quantity:number;apply:(option:PackageSuggestion)=>void}) {
  if(!resource.measurementKey)return null;
  const option=resource.data?.options[0];
  const selected=!!option&&String(option.packageId)===packageId&&option.requiredStaffCount===staffCount&&option.quantity===quantity;
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>Đề xuất tiết kiệm theo diện tích</Text>
    {resource.loading?<View style={{gap:8}}><ActivityIndicator color="#047857"/><Text style={styles.text}>Đang so sánh gói và số nhân viên theo bảng giá…</Text></View>:resource.error?<><Text style={styles.text}>{resource.error}</Text><Pressable accessibilityRole="button" onPress={resource.retry}><Text style={styles.link}>Kiểm tra lại đề xuất</Text></Pressable></>:option?<>
      <Text style={styles.title}>{option.packageName}</Text>
      <Text style={styles.text}>{option.requiredStaffCount} nhân viên · {option.quantity} gói · {option.durationMinutes} phút</Text>
      <Text style={styles.price}>{option.baseAmount.toLocaleString('vi-VN')}đ</Text>
      <Text style={styles.text}>Đủ định mức cho {Number(option.coveredAreaM2).toLocaleString('vi-VN')} m²; diện tích bạn nhập: {Number(resource.data!.areaM2).toLocaleString('vi-VN')} m².</Text>
      <Text style={styles.text}>{resource.data!.message}</Text>
      {selected?<Text accessibilityLiveRegion="polite" style={styles.link}>✓ Đã chọn gói và số nhân viên theo đề xuất</Text>:<Pressable accessibilityRole="button" style={styles.button} onPress={()=>apply(option)}><Text style={styles.buttonText}>Áp dụng gói và số nhân viên đề xuất</Text></Pressable>}
      <Text style={styles.text}>Bạn vẫn có thể chọn gói khác hoặc thêm nhân viên.</Text>
    </>:!!resource.data&&<Text style={styles.text}>{resource.data.message}</Text>}
    {!!resource.data?.unconfiguredPackageIds.length&&<Text style={styles.note}>Các gói chưa có định mức diện tích không được dùng để so sánh.</Text>}
  </View>;
}
const styles=StyleSheet.create({card:{padding:16,borderRadius:16,backgroundColor:'#E8F5EE',borderColor:'#A7DCC6',borderWidth:1,gap:10},title:{fontSize:16,fontWeight:'800',color:'#065F46'},text:{fontSize:14,lineHeight:21,color:'#475569'},price:{fontSize:23,fontWeight:'800',color:'#047857'},link:{fontSize:14,fontWeight:'700',color:'#047857'},button:{backgroundColor:'#047857',borderRadius:12,padding:14},buttonText:{color:'#FFF',fontWeight:'700',textAlign:'center'},note:{fontSize:12,lineHeight:18,color:'#64748B'}});
