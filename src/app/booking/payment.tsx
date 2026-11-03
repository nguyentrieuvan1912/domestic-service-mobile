import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { operationRequest, operationSession } from '@/api/operations';
import { CustomerBookings, ConnectedBooking } from '@/data/connectedBookings';
import { PaymentQr } from '@/components/staff/PaymentQr';
import { IconSymbol } from '@/components/common/IconSymbol';
import { BrandColors } from '@/constants/theme';
import { prepareBookingQr, type BookingQrIntent as Topup } from '@/utils/booking-payment-intent';
const money = (n: number) => n.toLocaleString('vi-VN') + 'đ';

export default function CustomerPaymentScreen() {
  const { currentCustomer, accessToken } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!currentCustomer) return <Redirect href="/auth/login" />;
  return <CustomerPayment key={`${accessToken}:${id}`} />;
}
function CustomerPayment() {
  const { id } = useLocalSearchParams<{ id: string }>(), router = useRouter(), { width } = useWindowDimensions();
  const [book, setBook] = useState<ConnectedBooking | null>(null), [topup, setTopup] = useState<Topup | null>(null);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [balance, setBalance] = useState<number | null>(null), [now, setNow] = useState(Date.now());
  const [balanceVisible, setBalanceVisible] = useState(false);
  const lock = useRef(false), autoAttempted = useRef(false), mounted = useRef(true), owner = operationSession()?.token;
  const current = useCallback(() => mounted.current && owner === operationSession()?.token, [owner]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const route = useCallback((b: ConnectedBooking) => {
    if (b.status !== 'AWAITING_PAYMENT') router.replace(b.mode === 'MODE_A' && b.status === 'STAFF_ASSIGNED' ? { pathname: '/booking/waiting', params: { id: b.id } } : { pathname: '/booking/[id]', params: { id: b.id } });
  }, [router]);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController(); let running = false;
    const load = async () => {
      if (running || lock.current || AppState.currentState !== 'active') return;
      running = true;
      try {
        const b = await CustomerBookings.detail(id, controller.signal);
        if (controller.signal.aborted || !current()) return;
        setBook(b);
        if (b.status !== 'AWAITING_PAYMENT') { route(b); return; }
        if (b.paymentMethod === 'WALLET') {
          const wallet = await operationRequest<{ available: number }>('finance', '/customer/me/wallet', 'GET', undefined, controller.signal);
          if (!controller.signal.aborted && current()) { setBalance(wallet.available); setError(''); }
        } else if (b.paymentMethod === 'BANK_TRANSFER_QR') {
          const items = await operationRequest<Topup[]>('finance', '/customer/me/topups', 'GET', undefined, controller.signal);
          if (controller.signal.aborted || !current()) return;
          const existing = items.find(t => String(t.bookingId) === id) || null;
          setTopup(existing);
          if (existing?.qrCode || existing?.status === 'PAID') setError('');
          if ((!existing || existing.status === 'CREATING') && !autoAttempted.current && !lock.current) {
            autoAttempted.current = true; lock.current = true; setBusy(true); setError('');
            try {
              // Do not abort a persisted creation when focus changes; its result is still the same booking intent.
              const intent = await prepareBookingQr(b, existing, operationRequest);
              if (current()) {
                setTopup(intent);
                const next = await CustomerBookings.detail(id);
                if (current()) { setBook(next); route(next); }
              }
            } catch (e) { if (current()) setError(e instanceof Error ? e.message : 'Chưa tải được mã QR. Vui lòng thử lại.'); }
            finally { lock.current = false; if (current()) setBusy(false); }
          }
        }
      } catch (e) { if (!controller.signal.aborted && current()) setError(e instanceof Error ? e.message : 'Chưa tải được thanh toán.'); }
      finally { running = false; }
    };
    void load(); const timer = setInterval(() => void load(), 5000);
    const listener = AppState.addEventListener('change', () => void load());
    return () => { controller.abort(); clearInterval(timer); listener.remove(); };
  }, [id, current, route]));
  useFocusEffect(useCallback(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []));
  const pay = async () => {
    if (lock.current || !book) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (topup && topup.status !== 'PAID') {
        const updated = await operationRequest<Topup>('finance', `/customer/me/topups/${topup.id}/refresh`, 'POST');
        if (current()) setTopup(updated);
      }
      const result = await operationRequest<{ topup?: Topup }>('finance', `/customer/bookings/${id}/pay`, 'POST');
      if (!current()) return;
      if (result.topup) setTopup(result.topup);
      const b = await CustomerBookings.detail(id);
      if (current()) { setBook(b); route(b); }
    } catch (e) { if (current()) setError(e instanceof Error ? e.message : 'Chưa thanh toán được.'); }
    finally { lock.current = false; if (current()) setBusy(false); }
  };
  const cancel = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await CustomerBookings.cancel(id, 'Khách hủy khi chờ thanh toán'); if (current()) router.replace({ pathname: '/booking/[id]', params: { id } }); }
    catch (e) { if (current()) setError(e instanceof Error ? e.message : 'Chưa hủy được đơn.'); }
    finally { lock.current = false; if (current()) setBusy(false); }
  };
  const walletPayment = book?.paymentMethod === 'WALLET';
  const seconds = topup ? Math.max(0, Math.ceil((Date.parse(topup.expiresAt) - now) / 1000)) : 0;
  const payable = topup?.status === 'PENDING' && seconds > 0 && !!topup.qrCode;
  const countdown = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const status = topup?.status === 'PAID' ? 'Đã nhận tiền · Đang kết nối dịch vụ' : topup?.status === 'REVIEW' ? 'Đang đối soát số tiền' : topup?.status === 'EXPIRED' || topup?.status === 'PENDING' && seconds === 0 ? 'Mã QR đã hết hạn' : topup?.status === 'CANCELLED' ? 'Liên kết thanh toán đã hủy' : 'Đang chờ chuyển khoản';
  return <SafeAreaView style={s.screen}>
    <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Về chi tiết đơn" onPress={() => router.replace({ pathname: '/booking/[id]', params: { id } })} style={({ pressed }) => [s.back, pressed && s.pressed]}><IconSymbol name="back" size={21} color="#334E40" /></Pressable><View style={{ flex: 1 }}><Text style={s.headerTitle}>Thanh toán dịch vụ</Text><Text style={s.headerHint}>{walletPayment ? 'Thanh toán bằng ví' : 'Chuyển khoản QR · payOS'}</Text></View><View style={s.headerIcon}><IconSymbol name={walletPayment ? 'wallet' : 'shield'} size={22} color={BrandColors.primaryDark} /></View></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      <LinearGradient colors={['#075E48', '#008C5C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.summary}><View style={s.summaryTop}><Text style={s.eyebrow}>SỐ TIỀN THANH TOÁN</Text><Text style={s.orderCode}>{book?.bookingCode || 'Đang tải đơn…'}</Text></View><Text adjustsFontSizeToFit numberOfLines={1} style={s.amount}>{book ? money(book.totalAmount) : '…'}</Text><Text numberOfLines={2} style={s.serviceName}>{book?.service.name || book?.service.serviceName || 'Dịch vụ của bạn'}</Text></LinearGradient>
      {!walletPayment && <View style={s.qrCard}>
        <Text style={s.sectionTitle}>Quét mã để thanh toán</Text><Text style={s.caption}>Mở ứng dụng ngân hàng và quét mã bên dưới</Text>
        <View style={s.qrFrame}>{payable && topup?.qrCode ? <PaymentQr value={topup.qrCode} size={Math.max(140, Math.min(width - 120, 268))} /> : <View style={s.qrPlaceholder}>{busy || !topup && !error ? <><ActivityIndicator size="large" color={BrandColors.primary} /><Text style={s.placeholderText}>Đang chuẩn bị mã QR…</Text></> : <><IconSymbol name={topup?.status === 'PAID' ? 'check' : 'info'} size={38} color={BrandColors.primaryDark} /><Text style={s.placeholderText}>{topup ? status : 'Chưa tải được mã QR'}</Text><Text style={s.caption}>Kiểm tra lại kết nối và trạng thái thanh toán.</Text></>}</View>}</View>
        {payable && <View style={s.countdown}><IconSymbol name="clock" size={15} color="#A36A16" /><Text style={s.countdownText}>Mã có hiệu lực trong {countdown}</Text></View>}
        {topup && <View style={[s.statusBadge, topup.status === 'PAID' && s.paidBadge]}><View style={[s.statusDot, topup.status === 'PAID' && { backgroundColor: BrandColors.primary }]} /><Text style={s.statusText}>{status}</Text></View>}
        <View style={s.autoNote}><IconSymbol name="info" size={16} color="#819389" /><Text style={s.autoNoteText}>Trạng thái tự cập nhật sau khi ngân hàng ghi nhận tiền.</Text></View>
      </View>}
      {walletPayment && <View style={s.details}><View style={s.detailHead}><IconSymbol name="wallet" size={20} color={BrandColors.primaryDark} /><Text style={s.sectionTitle}>Ví của tôi</Text></View><Text style={s.caption}>Số dư khả dụng</Text><View style={s.balanceRow}><Text style={s.walletAmount}>{balance !== null ? balanceVisible ? money(balance) : '••••••' : 'Đang tải…'}</Text><Pressable accessibilityRole="button" accessibilityLabel={balanceVisible ? 'Ẩn số dư ví' : 'Hiện số dư ví'} accessibilityState={{selected:balanceVisible}} onPress={() => setBalanceVisible(value => !value)} style={({pressed}) => [s.eyeButton,pressed && s.pressed]}><IconSymbol name={balanceVisible ? 'eyeOff' : 'eye'} size={22} color={BrandColors.primaryDark}/></Pressable></View>{book && balance !== null && balance < book.totalAmount && <Text style={s.insufficient}>{balanceVisible ? `Cần nạp thêm ${money(book.totalAmount - balance)} để thanh toán.` : 'Số dư ví chưa đủ. Vui lòng nạp thêm để thanh toán.'}</Text>}</View>}
      {!!error && <View accessibilityRole="alert" style={s.errorBox}><IconSymbol name="warning" size={19} color="#B91C1C" /><Text style={s.error}>{error}</Text></View>}
      {!walletPayment && topup && <View style={s.details}><View style={s.detailHead}><IconSymbol name="receipt" size={19} color={BrandColors.primaryDark} /><Text style={s.sectionTitle}>Thông tin chuyển khoản</Text></View>{[{ label: 'Người nhận', value: topup.accountName || 'Đang xác minh' }, { label: 'Số tài khoản', value: topup.accountNumber || 'Đang xác minh' }, { label: 'Số tiền', value: money(topup.amount), emphasis: true }, { label: 'Nội dung chuyển khoản', value: topup.description, emphasis: true }].map(row => <View key={row.label} style={s.detailRow}><Text style={s.detailLabel}>{row.label}</Text><Text selectable style={[s.detailValue, row.emphasis && s.emphasis]}>{row.value}</Text></View>)}<View style={s.received}><Text style={s.caption}>Đã ghi nhận</Text><Text style={s.receivedAmount}>{money(topup.amountReceived)}</Text></View></View>}
      <View style={s.actionArea}>
        {(walletPayment || !!topup || !!error) && <Pressable accessibilityRole="button" disabled={!book || busy} onPress={() => void pay()} style={({ pressed }) => [s.primary, (!book || busy || pressed) && s.pressed]}>{busy ? <ActivityIndicator color="#fff" /> : <IconSymbol name={walletPayment ? 'wallet' : 'check'} size={19} color="#fff" />}<Text style={s.primaryText}>{busy ? 'Đang xử lý…' : walletPayment ? 'Thanh toán bằng ví' : !topup || topup.status === 'CREATING' ? 'Thử tải lại mã QR' : 'Kiểm tra thanh toán'}</Text></Pressable>}
        {walletPayment && <Pressable accessibilityRole="button" onPress={() => router.push('/account/wallet')} style={({ pressed }) => [s.secondary, pressed && s.pressed]}><Text style={s.secondaryText}>Xem ví / Nạp thêm tiền</Text><IconSymbol name="chevronRight" size={16} color={BrandColors.primaryDark} /></Pressable>}
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void cancel()} style={({ pressed }) => [s.cancel, (pressed || busy) && s.pressed]}><Text style={s.cancelText}>Hủy đơn</Text></Pressable>
      </View>
      <View style={s.refundNotice}><IconSymbol name="shield" size={21} color={BrandColors.primaryDark} /><View style={{ flex: 1 }}><Text style={s.refundTitle}>Tiền được hoàn về ví khi đơn hủy</Text><Text style={s.refundText}>Chuyển đúng số tiền và nội dung. Dịch vụ chỉ được kết nối khi đã xác minh nhận đủ tiền. Nếu hủy hoặc không kết nối đủ nhân viên, tiền đã nhận được hoàn về ví.</Text></View></View>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
 screen:{flex:1,backgroundColor:'#F5F8F7'},header:{flexDirection:'row',alignItems:'center',gap:12,padding:16,paddingHorizontal:20,backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:'#E6EEE8'},back:{width:42,height:42,borderRadius:14,backgroundColor:'#F3F7F4',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#E5EDE7'},headerTitle:{fontSize:18,fontWeight:'800',color:'#173B2F'},headerHint:{fontSize:11,color:'#7A8D80',marginTop:4},headerIcon:{width:40,height:40,borderRadius:14,backgroundColor:'#E7F6EE',alignItems:'center',justifyContent:'center'},content:{padding:20,gap:18,maxWidth:560,width:'100%',alignSelf:'center',paddingBottom:32},
 summary:{padding:21,borderRadius:22,gap:12},summaryTop:{gap:8},eyebrow:{fontSize:10,fontWeight:'700',letterSpacing:1.4,color:'#BBEBD4'},orderCode:{fontSize:11,color:'#D3F0E2'},amount:{fontSize:36,fontWeight:'800',letterSpacing:-0.8,color:'#fff'},serviceName:{fontSize:12,color:'#C7ECDC',lineHeight:19},
 qrCard:{padding:20,borderWidth:1,borderColor:'#DFE9E3',backgroundColor:'#fff',borderRadius:22,alignItems:'center',gap:10},sectionTitle:{fontSize:15,fontWeight:'800',color:'#234835'},caption:{fontSize:11,color:'#83958A',lineHeight:18,textAlign:'center'},qrFrame:{marginTop:7,padding:8,backgroundColor:'#fff',borderWidth:1,borderColor:'#E0EDE5',borderRadius:18,maxWidth:'100%'},qrPlaceholder:{minHeight:220,width:'100%',minWidth:180,alignItems:'center',justifyContent:'center',gap:16,padding:12},placeholderText:{fontSize:13,fontWeight:'600',color:'#41624E',textAlign:'center',maxWidth:230,lineHeight:21},countdown:{flexDirection:'row',alignItems:'center',gap:6,paddingVertical:8,paddingHorizontal:12,backgroundColor:'#FFFAEB',borderRadius:9},countdownText:{fontSize:11,fontWeight:'600',color:'#A36A16'},statusBadge:{flexDirection:'row',alignItems:'center',gap:7,padding:10,borderRadius:10,backgroundColor:'#F2F7F4',maxWidth:'100%'},paidBadge:{backgroundColor:'#E5F7ED'},statusDot:{width:6,height:6,borderRadius:3,backgroundColor:'#E4AF43'},statusText:{fontSize:11,fontWeight:'600',color:'#466551',flexShrink:1},autoNote:{flexDirection:'row',gap:6,alignItems:'center',marginTop:4},autoNoteText:{fontSize:10,color:'#819389',lineHeight:17,flexShrink:1,textAlign:'center'},
 details:{padding:18,borderWidth:1,borderColor:'#E0EAE3',backgroundColor:'#fff',borderRadius:20,gap:14},detailHead:{flexDirection:'row',alignItems:'center',gap:9,marginBottom:3},detailRow:{gap:5,borderBottomWidth:1,borderBottomColor:'#F0F4F1',paddingBottom:12},detailLabel:{fontSize:11,color:'#8B9A91'},detailValue:{fontSize:14,color:'#3E5A49',fontWeight:'600',lineHeight:21},emphasis:{color:'#008C5C',fontWeight:'800'},received:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:12,borderRadius:10,backgroundColor:'#F2F8F4'},receivedAmount:{fontSize:14,fontWeight:'700',color:'#008C5C'},balanceRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10},eyeButton:{width:44,height:44,borderRadius:14,backgroundColor:'#F1F8F4',alignItems:'center',justifyContent:'center'},walletAmount:{fontSize:28,fontWeight:'800',color:'#008C5C',textAlign:'center'},insufficient:{fontSize:12,color:'#B45309',lineHeight:20,textAlign:'center'},
 actionArea:{gap:11},primary:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,backgroundColor:BrandColors.primary,minHeight:54,padding:15,borderRadius:15},primaryText:{color:'#fff',fontSize:14,fontWeight:'700'},secondary:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,minHeight:50,borderWidth:1,borderColor:'#D9E7DF',backgroundColor:'#fff',borderRadius:14,padding:13},secondaryText:{fontSize:13,color:'#008C5C',fontWeight:'700'},cancel:{minHeight:48,alignItems:'center',justifyContent:'center',padding:12,borderWidth:1,borderColor:'#EEDDDC',backgroundColor:'#FFFDFC',borderRadius:14},cancelText:{fontSize:13,fontWeight:'600',color:'#B15B52'},pressed:{opacity:0.55},errorBox:{flexDirection:'row',alignItems:'flex-start',gap:9,padding:14,borderWidth:1,borderColor:'#FECACA',backgroundColor:'#FEF2F2',borderRadius:14},error:{flex:1,fontSize:12,color:'#B91C1C',lineHeight:20},refundNotice:{flexDirection:'row',gap:10,padding:14,backgroundColor:'#EAF5EF',borderWidth:1,borderColor:'#DDEDE3',borderRadius:16},refundTitle:{fontSize:11,color:'#345F45',fontWeight:'700',lineHeight:18},refundText:{fontSize:10,color:'#78907E',lineHeight:18,marginTop:4},
});
