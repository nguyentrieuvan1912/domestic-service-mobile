import { FavouriteDurationPopup } from '@/components/booking/FavouriteDurationPopup';
import { favouriteDurationIssue, shorterFavouritePackage, roundedBookingMinutes } from '@/utils/favourite-staff-duration';
import { StaffResponseWaiting } from '@/components/booking/StaffResponseWaiting';
import { BookingPromotions } from '@/components/booking/BookingPromotions';
import { promotionIssue } from '@/utils/promotion-eligibility';
import { laterBookingSections } from '@/utils/booking-draft-reset';
import { bookingRetryDraft } from '@/utils/booking-retry';
import { remoteImageSource } from '@/utils/image-source';
import { usePublicBookingResource } from '@/hooks/use-public-booking-resource';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { Badge, formatVND } from '@/components/common/Badge';
import { RatingStars } from '@/components/common/RatingStars';
import { useAuth } from '@/context/AuthContext';
import { SmartExtras } from '@/components/booking/SmartExtras';
import { ServicePreferencePicker } from '@/components/booking/ServicePreferencePicker';
import { BookingTimingPopup } from '@/components/booking/BookingTimingPopup';
import { bookingTimingNotice, type BookingTimingNotice } from '@/utils/booking-timing-notice';
import { buildBookingExtras, getExtraTotals, toggleBookingExtra } from '@/utils/booking-extras';
import { useBookingCatalog } from '@/hooks/use-booking-catalog';
import { useCustomerAddresses } from '@/hooks/use-customer-addresses';
import { RequireAddressView } from '@/components/booking/RequireAddressView';
import { operationRequest } from '@/api/operations';
import { ConnectedBooking, CustomerBookings, bookingView } from '@/data/connectedBookings';
import { staffView } from '@/hooks/use-booking-detail';
import { ServiceQuestions } from '@/components/booking/ServiceQuestions';
import type { Staff, CustomerAddress } from '@/types/user';
import { BookingMode } from '@/types/booking';
import { PaymentMethod } from '@/types/payment';
import { staffAge, staffAgeLabel } from '@/utils/staff-profile';
import { customerSlotIssue } from '@/utils/customer-booking-time';

const todayIso = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
const calendarDays = () => Array.from({ length: 7 }, (_,i) => { const d = new Date(todayIso()+'T12:00:00+07:00'); d.setUTCDate(d.getUTCDate()+i); const iso=d.toLocaleDateString('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'}); return { iso, label:d.toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}), dayName:['CN','T2','T3','T4','T5','T6','T7'][d.getUTCDay()], dateNum:Number(iso.slice(8)), isCurrentMonth:i<7 }; });
const TIME_SLOTS = Array.from({length:24}, (_,i) => String(8+Math.floor(i/2)).padStart(2,'0') + ':' + (i%2 ? '30' : '00'));

export default function NewBookingScreen() {
  const router = useRouter();
  const { currentCustomer } = useAuth();
  const catalog = useBookingCatalog();
  const addressResource = useCustomerAddresses();
  const params = useLocalSearchParams<{
    serviceId?: string;
    packageId?: string;
    mode?: BookingMode;
    staffId?: string;
    retryBookingId?: string;
  }>();
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryState, setRetryState] = useState<{ key: string; booking?: ConnectedBooking; error?: string }>({ key: '' });
  const retryKey = `${currentCustomer?.id || ''}:${params.retryBookingId || ''}`;
  useEffect(() => {
    if (!params.retryBookingId || !currentCustomer) return;
    let active = true;
    setRetryState({ key: '' });
    void CustomerBookings.detail(params.retryBookingId).then(booking => {
      if (booking.customerId !== String(currentCustomer.id) || booking.mode !== 'MODE_A' || booking.status !== 'CANCELLED' || booking.staffWaitState !== 'CLOSED') throw new Error('Đơn chưa hoàn tất lựa chọn tìm nhân viên khác. Vui lòng mở lại đơn đang chờ.');
      if (active) setRetryState({ key: retryKey, booking });
    }).catch(cause => { if (active) setRetryState({ key: retryKey, error: cause instanceof Error ? cause.message : 'Chưa tải được thông tin đơn trước.' }); });
    return () => { active = false; };
  }, [retryKey, retryAttempt]);
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/(tabs)');
  const retrySource = retryState.key === retryKey ? retryState.booking : undefined;
  const restoreIssue = retrySource && (
    !addressResource.addresses.some(address => address.id === retrySource.addressId) ? 'Địa chỉ của đơn trước không còn tồn tại. Vui lòng về trang chủ và cập nhật địa chỉ để đặt lại.' :
    !catalog.services.some(service => service.id === retrySource.serviceId) || !catalog.packages.some(pack => pack.id === retrySource.packageId && pack.serviceId === retrySource.serviceId) ? 'Dịch vụ hoặc gói của đơn trước không còn khả dụng. Vui lòng về trang chủ để chọn dịch vụ khác.' :
    retrySource.addOns.some(add => !catalog.addOns.some(option => option.id === add.addOnId && option.serviceId === retrySource.serviceId)) ? 'Một dịch vụ bổ sung của đơn trước không còn khả dụng. Vui lòng về trang chủ để đặt lại với lựa chọn mới.' : '');

  if (!currentCustomer) {
    return (
      <LinearGradient
        colors={BrandColors.softBgGradient}
        locations={BrandColors.softBgGradientLocations}
        style={styles.gradientContainer}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.stateCenterContainer}>
            <View style={styles.stateIconCircle}>
              <IconSymbol name="user" size={38} color={BrandColors.primary} />
            </View>
            <Text style={styles.stateTitle}>Vui lòng đăng nhập</Text>
            <Text style={styles.stateSubtitle}>
              Bạn cần đăng nhập tài khoản khách hàng để tiến hành đặt dịch vụ và chọn nhân viên.
            </Text>
            <Pressable
              style={styles.statePrimaryBtn}
              onPress={() => router.push('/auth/login')}>
              <LinearGradient colors={BrandColors.primaryGradient} style={styles.stateGradientBtn}>
                <Text style={styles.statePrimaryBtnText}>Đăng nhập ngay</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.stateBackBtn} onPress={goBack}>
              <Text style={styles.stateBackBtnText}>Quay lại</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (catalog.loading || addressResource.loading || (!!params.retryBookingId && retryState.key !== retryKey)) {
    return (
      <LinearGradient
        colors={BrandColors.softBgGradient}
        locations={BrandColors.softBgGradientLocations}
        style={styles.gradientContainer}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.stateCenterContainer}>
            <ActivityIndicator size="large" color={BrandColors.primary} />
            <Text style={styles.stateLoadingTitle}>Đang tải dịch vụ và địa chỉ...</Text>
            <Text style={styles.stateSubtitle}>
              Vui lòng đợi giây lát trong khi chúng tôi chuẩn bị dữ liệu đặt lịch cho bạn.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (catalog.error || addressResource.error || (params.retryBookingId && retryState.error) || restoreIssue) {
    return (
      <LinearGradient
        colors={BrandColors.softBgGradient}
        locations={BrandColors.softBgGradientLocations}
        style={styles.gradientContainer}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.stateCenterContainer}>
            <View style={[styles.stateIconCircle, { backgroundColor: BrandColors.dangerLight }]}>
              <IconSymbol name="warning" size={38} color={BrandColors.danger} />
            </View>
            <Text style={styles.stateTitle}>Có lỗi xảy ra</Text>
            <Text style={styles.stateSubtitle}>{catalog.error || addressResource.error || retryState.error || restoreIssue}</Text>
            <Pressable
              style={styles.statePrimaryBtn}
              onPress={() => {
                catalog.retry();
                addressResource.retry();
                setRetryAttempt(value => value + 1);
              }}>
              <LinearGradient colors={BrandColors.primaryGradient} style={styles.stateGradientBtn}>
                <Text style={styles.statePrimaryBtnText}>Thử lại</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.stateBackBtn} onPress={goBack}>
              <Text style={styles.stateBackBtnText}>Quay lại</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Khi chưa có địa chỉ, hiển thị giao diện hướng dẫn thêm địa chỉ đồng bộ hệ thống
  if (!addressResource.addresses.length) {
    return (
      <RequireAddressView
        mode={params.mode || (params.staffId ? 'MODE_A' : 'MODE_A')}
        currentCustomer={currentCustomer}
        onManageAddresses={() =>
          router.push({
            pathname: '/account/addresses',
            params: {
              fromBooking: '1',
              mode: params.mode,
              serviceId: params.serviceId,
              staffId: params.staffId,
            },
          })
        }
        onBack={goBack}
        mutateAddress={addressResource.mutate}
        onAddressCreated={() => addressResource.retry()}
      />
    );
  }

  if (!catalog.services.length || !catalog.packages.length) {
    return (
      <LinearGradient
        colors={BrandColors.softBgGradient}
        locations={BrandColors.softBgGradientLocations}
        style={styles.gradientContainer}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.stateCenterContainer}>
            <View style={styles.stateIconCircle}>
              <IconSymbol name="receipt" size={38} color={BrandColors.primary} />
            </View>
            <Text style={styles.stateTitle}>Chưa có dịch vụ khả dụng</Text>
            <Text style={styles.stateSubtitle}>
              Hiện tại chưa có dịch vụ hoặc gói công việc nào đang hoạt động. Vui lòng quay lại sau.
            </Text>
            <Pressable style={styles.stateBackBtn} onPress={goBack}>
              <Text style={styles.stateBackBtnText}>Quay lại</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return <ConnectedNewBooking key={retryKey} catalog={catalog} addresses={addressResource.addresses} retryBooking={retrySource} />;
}
function ConnectedNewBooking({ catalog, addresses, retryBooking }: { catalog: ReturnType<typeof useBookingCatalog>; addresses: CustomerAddress[]; retryBooking?: ConnectedBooking }) {
  const router = useRouter();
  const { currentCustomer } = useAuth();
  const retry = useMemo(() => retryBooking ? bookingRetryDraft(retryBooking) : undefined, [retryBooking]);
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/(tabs)');
  const params = useLocalSearchParams<{
    serviceId?: string;
    packageId?: string;
    mode?: BookingMode;
    staffId?: string;
    addressId?: string;
    rebook?: string;
    addOnIds?: string;
    customConfig?: string;
    answers?: string;
  }>();

  // Mode selection: null = FLOW 0, otherwise MODE_A or MODE_B
  const [selectedMode, setSelectedMode] = useState<BookingMode | null>(
    retry || params.mode === 'MODE_A'
      ? 'MODE_A'
      : params.mode === 'MODE_B'
      ? 'MODE_B'
      : params.staffId
      ? 'MODE_A'
      : params.serviceId
      ? 'MODE_B'
      : null
  );

  // Step index
  const [currentStep, setCurrentStep] = useState<number>(retry ? 3 : 0);

  // Instant & buttery-smooth step transition (eliminates all blinking and delay)
  const triggerStepTransition = (nextStep: number) => {
    if(saving)return;
    setFavouritePending(null);
    if(nextStep>currentStep&&!createdBooking){
      if((selectedMode==='MODE_A'&&currentStep>=1)||(selectedMode==='MODE_B'&&currentStep>=3)){
        if(!validateBookingTiming())return;
      }
    }
    if(nextStep<currentStep){if(createdBooking){router.replace(('/booking/'+createdBooking.id) as never);return;}resetLaterSteps(nextStep);}
    setSubmitError('');setCurrentStep(nextStep);
  };

  // ================= Form States =================
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    retry?.serviceId || catalog.resolveId(params.serviceId) || catalog.services[0].id
  );
  const service = catalog.services.find(s => s.id === selectedServiceId) || catalog.services[0];
  const getPackagesByServiceId = (id: string) => catalog.packages.filter(p => p.serviceId === id);
  const calendarDate=todayIso();
  const CALENDAR_DAYS = useMemo(()=>calendarDays(),[calendarDate]);
  const packages = useMemo(() => catalog.packages.filter(p=>p.serviceId===service.id), [catalog.packages,service.id]);
  const serviceAddOns = useMemo(() => catalog.addOns.filter(p=>p.serviceId===service.id), [catalog.addOns,service.id]);
  const extraOptions = useMemo(() => buildBookingExtras(service, serviceAddOns, catalog.services, catalog.packages), [service,serviceAddOns,catalog.services,catalog.packages]);
  const [availableStaffs, setAvailableStaffs] = useState<Staff[]>([]);
  const [directory, setDirectory] = useState<Staff[]>([]);
  const [staffLoading,setStaffLoading]=useState(false),[staffError,setStaffError]=useState(''),[staffAttempt,setStaffAttempt]=useState(0);
  const [pickedStaff,setPickedStaff]=useState<Staff>();
  const [serviceFilters,setServiceFilters]=useState<string[]>(retry ? [retry.serviceId] : []);
  const [bookingClock,setBookingClock]=useState(Date.now);
  useEffect(()=>{const timer=setInterval(()=>setBookingClock(Date.now()),30000);return()=>clearInterval(timer);},[]);

  // Address
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    retry?.addressId || params.addressId || addresses[0]?.id || ''
  );
  useEffect(() => {
    if (params.addressId && addresses.some(a => a.id === params.addressId)) {
      setSelectedAddressId(params.addressId);
    } else if (!selectedAddressId && addresses.length > 0) {
      setSelectedAddressId(addresses.find(a => a.isDefault)?.id || addresses[0].id);
    }
  }, [params.addressId, addresses]);
  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) || addresses[0];

  // Date & Time (chosen right after address in Mode A)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(retry ? new Date(retry.date+'T12:00:00+07:00').toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : CALENDAR_DAYS[1].label)
  ; const [selectedDateIso, setSelectedDateIso] = useState(retry?.date || CALENDAR_DAYS[1].iso);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(retry?.time || '09:00');
  const [discoveryMinutes,setDiscoveryMinutes]=useState(retry?.durationMinutes || 120);

  // Duration in hours (2h, 3h, 4h)
  const [selectedDurationHours, setSelectedDurationHours] = useState<number>(packages.find(p => p.id === retry?.packageId)?.durationHours || packages[0]?.durationHours || 1);

  // Staff Filters (Star rating & Age filters)
  const [starFilter, setStarFilter] = useState<'ALL' | '4.8' | '4.9' | '5.0'>('ALL');
  const [ageFilter, setAgeFilter] = useState<'ALL' | 'UNDER_30' | '31_45' | 'OVER_45'>('ALL');

  // Selected Staff
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    params.staffId || ''
  );
  const selectedStaff =
    availableStaffs.find((s) => s.id === selectedStaffId) || (pickedStaff?.id === selectedStaffId ? pickedStaff : directory.find(s=>s.id===selectedStaffId));

  // Service Package & Staff count (Mode B)
  const staffReviewResource=usePublicBookingResource<{id:number;rating:number;comment:string;createdAt:string}[]>('/staff/'+(selectedStaff?.id || '0')+'/reviews', selectedMode==='MODE_A' && currentStep===4 && !!selectedStaff?.id);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    packages.find(p => p.id === (retry?.packageId || params.packageId))?.id || packages[0]?.id || ''
  );
  const selectedPackage =
    packages.find((p) => p.id === selectedPackageId) || packages[0];
  const [requiredStaffCount, setRequiredStaffCount] = useState<number>(selectedPackage?.defaultStaffCount || 1);

  // Shared local selection for both booking modes. Nothing is preselected or sent to an API.
  const [selectedExtraKeys, setSelectedExtraKeys] = useState<string[]>(() => {if(retry)return retry.extraKeys;try{return JSON.parse(params.addOnIds || '[]').filter((id:unknown)=>typeof id==='string' && serviceAddOns.some(a=>a.id===id)).map((id:string)=>'addon:'+id);}catch{return [];} });
  const extraTotals = useMemo(() => getExtraTotals(extraOptions, selectedExtraKeys), [extraOptions,selectedExtraKeys]);
  const selectedAddOnIds = extraTotals.selected.filter(e => e.kind === 'ADD_ON').map(e => e.id);
  const selectedRelatedServiceIds = extraTotals.selected.filter(e => e.kind === 'SERVICE').map(e => e.id);
  const [favouritePending, setFavouritePending] = useState<{ packageId: string; keys: string[] } | null>(null);
  const extraMinutesFor = (keys: string[]) => getExtraTotals(extraOptions, keys).selected.reduce((sum, item) => sum + (item.kind === 'ADD_ON' ? item.minutes : catalog.details.find(detail => String(detail.service.id) === item.id)?.service.estimatedDurationMinutes || item.minutes), 0);
  const toggleExtra = (key: string) => {
    const next = toggleBookingExtra(extraOptions, selectedExtraKeys, key);
    if(selectedMode === 'MODE_A' && actualPackage && favouriteDurationIssue(actualPackage.durationMinutes * quantity, extraMinutesFor(next), next.length)) {
      setFavouritePending({ packageId: actualPackage.id, keys: next }); return false;
    }
    setSelectedExtraKeys(next); return true;
  };
  const selectFavouritePackage = (hours: number) => {
    const pack = packages.find(p => p.durationHours === hours);
    if(!pack) return;
    if(favouriteDurationIssue(pack.durationMinutes * quantity, extraMinutesFor(selectedExtraKeys), selectedExtraKeys.length)) {
      setFavouritePending({ packageId: pack.id, keys: selectedExtraKeys }); return;
    }
    setSelectedDurationHours(hours); setSelectedPackageId(pack.id);
  };
  const chooseService = (id: string) => {
    if (id === service.id) return;
    setSelectedServiceId(id);
    setSelectedPackageId(getPackagesByServiceId(id)[0]?.id || '');
    // A different primary service must not silently retain/charge unrelated extras.
    setSelectedExtraKeys([]); setAnswers({}); setRequiredStaffCount(getPackagesByServiceId(id)[0]?.defaultStaffCount || 1);setSelectedDurationHours(getPackagesByServiceId(id)[0]?.durationHours || 1);
  };

  // Promotion / Voucher (integrated directly in Order Summary)
  const [promoInput, setPromoInput] = useState<string>(retry?.promotionCode || '');
  const [selectedPromoCode, setSelectedPromoCode] = useState<string>(retry?.promotionCode || '');
  const [promoFeedback,setPromoFeedback]=useState(''),[promotionFailures,setPromotionFailures]=useState<Record<string,string>>({});
  const [quoteLoading,setQuoteLoading]=useState(false),[pricingAttempt,setPricingAttempt]=useState(0);
  const pricingGeneration=useRef(0),quoteAbort=useRef<AbortController|null>(null);

  // Customer Notes
  const [customerNote, setCustomerNote] = useState<string>(retry?.notes || '');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  // Copy order code feedback
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Animated effects: Radar, clock, bounce
  const radarWave1 = useRef(new Animated.Value(0.2)).current;
  const radarWave2 = useRef(new Animated.Value(0.2)).current;
  const radarWave3 = useRef(new Animated.Value(0.2)).current;
  const radarOpacity1 = useRef(new Animated.Value(1)).current;
  const radarOpacity2 = useRef(new Animated.Value(1)).current;
  const radarOpacity3 = useRef(new Animated.Value(1)).current;
  const clockSpinAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0.3)).current;

  const [radarStatusText, setRadarStatusText] = useState('Đang tìm nhân viên phù hợp năng lực, khu vực và lịch làm việc...');
  // Mode B stays in MATCHING until a staff member accepts it in the staff flow.
  // The local flag only exposes that state in this prototype preview.
  const [isModeBStaffAccepted, setIsModeBStaffAccepted] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<ConnectedBooking | null>(null);
  const modeBMatchedStaff = directory.find(s => s.id === createdBooking?.staffId);
  const [answers, setAnswers] = useState<Record<string, unknown>>(() => {if(retry)return retry.answers;try {const data=JSON.parse(params.answers || '{}');return data && typeof data==='object' && !Array.isArray(data)?data:{};}catch{return {};}});
  const [quote, setQuote] = useState<{ baseAmount:number; addOnAmount:number; discountAmount:number; totalAmount:number; durationMinutes:number } | null>(null);
  const [quoteResolvedKey, setQuoteResolvedKey] = useState('');
  const [timingNotice, setTimingNotice] = useState<BookingTimingNotice | null>(null);
  const [quoteError, setQuoteError] = useState(''), [submitError, setSubmitError] = useState(''), [saving,setSaving] = useState(false);
  const requestRef = useRef<{body:string;key:string} | null>(null);
  const actualPackage = selectedMode === 'MODE_A' ? packages.find(p => p.durationHours === selectedDurationHours) || selectedPackage : selectedPackage;
  let configuration:Record<string,unknown>=retry?.configuration || {};if(!retry)try{const parsed=JSON.parse(params.customConfig || '{}');if(parsed && typeof parsed==='object' && !Array.isArray(parsed))configuration=parsed;}catch{}
  const configuredServiceId=retry?.serviceId || catalog.resolveId(params.serviceId);
  const quantity=service.id===configuredServiceId && ['AC_CLEANING','AC_MAINTENANCE'].includes(service.dynamicFieldType || '') ? Number(configuration.acQuantity || 1) : 1;
  const quoteBody = { quantity,configuration:service.id===configuredServiceId?configuration:{},serviceId:service.id, packageId:actualPackage?.id, requiredStaffCount: selectedMode === 'MODE_A' ? 1 : requiredStaffCount, addOnIds:selectedAddOnIds, relatedServiceIds:selectedRelatedServiceIds, promotionCode:selectedPromoCode, answers };
  const quoteKey = JSON.stringify(quoteBody);
  const startsAt = selectedDateIso+'T'+selectedTimeSlot+':00+07:00';

  const baseBookingMinutes=(actualPackage?.durationMinutes||60)*quantity;
  const computedBookingMinutes=roundedBookingMinutes(baseBookingMinutes, extraMinutesFor(selectedExtraKeys));
  const quoteReady=!!quote && quoteResolvedKey===quoteKey;
  const timePickerMinutes=selectedMode==='MODE_A'&&currentStep===1?discoveryMinutes:quoteReady?quote!.durationMinutes:computedBookingMinutes;
  const selectionTimingNotice=selectedMode==='MODE_A'&&currentStep===5?bookingTimingNotice({startsAt,baseMinutes:baseBookingMinutes,totalMinutes:quoteReady?quote!.durationMinutes:computedBookingMinutes,minimumMinutes:Math.min(...packages.map(p=>p.durationMinutes*quantity)),availableUntil:selectedStaff?.availableUntil,availableUntilReason:selectedStaff?.availableUntilReason,staffName:selectedStaff?.fullName}):null;
  const favouriteIssue=selectedMode==='MODE_A'?favouriteDurationIssue(baseBookingMinutes,extraMinutesFor(selectedExtraKeys),selectedExtraKeys.length):'';
  const pendingPackage=packages.find(p=>p.id===favouritePending?.packageId);
  const pendingExtraMinutes=extraMinutesFor(favouritePending?.keys || []);
  const availableMinutes=selectedStaff?.availableUntil?Math.max(0,(Date.parse(selectedStaff.availableUntil)-Date.parse(startsAt))/60000):240;
  const pendingShorter=pendingPackage?shorterFavouritePackage(packages,pendingPackage.durationMinutes*quantity,pendingExtraMinutes,favouritePending?.keys.length || 0,quantity,Math.min(240,availableMinutes)):undefined;
  const keepFavouritePackage=()=>{if(pendingPackage){const preserve=actualPackage?.id===pendingPackage.id&&!favouriteIssue;setSelectedDurationHours(pendingPackage.durationHours);setSelectedPackageId(pendingPackage.id);if(!preserve)setSelectedExtraKeys([]);}setFavouritePending(null);setSubmitError('');};
  const lowerFavouritePackage=()=>{if(!pendingShorter||!favouritePending)return;setSelectedDurationHours(pendingShorter.durationHours);setSelectedPackageId(pendingShorter.id);setSelectedExtraKeys(favouritePending.keys);setFavouritePending(null);setSubmitError('');};
  const selectionWarning=favouriteIssue || selectionTimingNotice?.message || submitError || quoteError || staffError || (quoteReady&&!staffLoading&&!availableStaffs.find(item=>item.id===selectedStaffId)?.eligibleServices?.some(item=>item.id===service.id)?'Nhân viên không rảnh đủ thời lượng hoặc không làm được dịch vụ này. Chọn lại dịch vụ/thời lượng hoặc quay lại chọn nhân viên.':'');

  const basePricingKey=JSON.stringify({...quoteBody,promotionCode:''});
  useEffect(()=>{setPromotionFailures({});setPromoFeedback('');},[basePricingKey]);
  const quoteEnabled=!createdBooking && selectedMode!==null && (selectedMode==='MODE_B'||currentStep>=5);
  useEffect(() => {
    if(!quoteEnabled){if(!createdBooking){setQuote(null);setQuoteResolvedKey('');setQuoteLoading(false);}return;}
    const controller=new AbortController(),generation=++pricingGeneration.current;quoteAbort.current=controller;let active=true;
    setQuoteLoading(true);setQuoteError('');
    const timer=setTimeout(()=>{
      void operationRequest<typeof quote>('catalog','/quote-preview','POST',JSON.parse(quoteKey),controller.signal).then(result=>{
        if(!active||generation!==pricingGeneration.current)return;
        setQuote(result);setQuoteResolvedKey(quoteKey);setQuoteError('');if(selectedPromoCode)setPromoFeedback('');
        if(selectedPromoCode)setPromotionFailures(previous=>{const next={...previous};delete next[selectedPromoCode];return next;});
      }).catch(error=>{
        if(!active||controller.signal.aborted||generation!==pricingGeneration.current)return;
        const message=error instanceof Error?error.message:'Chưa tính được giá đơn.';
        if(selectedPromoCode){setPromotionFailures(previous=>({...previous,[selectedPromoCode]:message}));setPromoFeedback(message);setSelectedPromoCode('');}
        else{setQuote(null);setQuoteResolvedKey('');setQuoteError(message);}
      }).finally(()=>{if(active&&generation===pricingGeneration.current)setQuoteLoading(false);});
    },180);
    return()=>{active=false;clearTimeout(timer);controller.abort();};
  },[quoteKey,quoteEnabled,pricingAttempt]);
  const directoryEnabled=selectedMode==='MODE_B'&&!!createdBooking?.staffId;
  useEffect(() => { if(!directoryEnabled)return;let active=true; void Promise.all([operationRequest<Record<string,unknown>[]>('identity','/staff-directory'),operationRequest<Record<string,unknown>[]>('booking','/public/staff-stats')]).then(([rows,stats])=>{if(active)setDirectory(rows.map(raw=>staffView({...raw,...stats.find(x=>String(x.staffId)===String(raw.id))})));}).catch(e=>{if(active)setSubmitError(e.message)}); return()=>{active=false;}; },[directoryEnabled]);
  const staffSearchMinutes=selectedMode==='MODE_A'&&currentStep<5?discoveryMinutes:quoteReady?quote!.durationMinutes:computedBookingMinutes;
  const searchTimeValid=!customerSlotIssue(startsAt,staffSearchMinutes,bookingClock);
  useEffect(() => {
    if(selectedMode!=='MODE_A'||currentStep<3||createdBooking)return;
    const controller=new AbortController();let active=true;const issue=customerSlotIssue(startsAt,staffSearchMinutes);
    setStaffError('');setAvailableStaffs([]);
    if(issue){setStaffError(issue);setStaffLoading(false);return;}
    setStaffLoading(true);
    const query=new URLSearchParams({addressId:selectedAddressId,startsAt,durationMinutes:String(staffSearchMinutes)});
    if(serviceFilters.length===1 && !retry)query.set('serviceId',serviceFilters[0]);
    void operationRequest<Record<string,unknown>[]>('booking','/customer/staff?'+query,'GET',undefined,controller.signal)
      .then(rows=>{if(active)setAvailableStaffs(rows.map(staffView));})
      .catch(error=>{if(active)setStaffError(error.message);})
      .finally(()=>{if(active)setStaffLoading(false);});
    return()=>{active=false;controller.abort();};
  },[selectedMode,selectedAddressId,startsAt,staffSearchMinutes,staffAttempt,currentStep<3,!!createdBooking,searchTimeValid,serviceFilters]);
  useEffect(() => { if(!createdBooking || !['PENDING','MATCHING','STAFF_ASSIGNED'].includes(createdBooking.status)) return; let active=true,inFlight=false; const poll=async()=>{if(inFlight)return;inFlight=true;try{const next=await CustomerBookings.detail(createdBooking.id);if(!active)return;setCreatedBooking(next);if(['CONFIRMED','IN_PROGRESS','COMPLETED'].includes(next.status)){if(selectedMode==='MODE_A')setCurrentStep(9);else setIsModeBStaffAccepted(true);}else if(['CANCELLED','NO_STAFF_FOUND','REJECTED'].includes(next.status))setRadarStatusText('Đơn đã kết thúc: '+next.status);}catch(e){if(active)setSubmitError(e instanceof Error?e.message:'Chưa tải được trạng thái đơn.');}finally{inFlight=false;}}; const timer=setInterval(()=>void poll(),4000); return()=>{active=false;clearInterval(timer);}; },[createdBooking?.id,createdBooking?.status,selectedMode]);
  const validateBookingTiming = () => {
    if(selectedMode==='MODE_A' && currentStep>=5 && favouriteIssue){setFavouritePending({packageId:actualPackage?.id || '',keys:selectedExtraKeys});return false;}
    const fullSelection = selectedMode === 'MODE_A' ? currentStep >= 5 : currentStep >= 3;
    const baseMinutes=baseBookingMinutes;
    const computedMinutes=computedBookingMinutes;
    const durationRejected=quoteError.includes('Thời lượng vượt 12 giờ') && computedMinutes>720;
    if(fullSelection && !quoteReady && !durationRejected) {
      setTimingNotice({kind:'STATUS',title:quoteError?'Chưa kiểm tra được thời lượng':'Đang tính tổng thời lượng',message:quoteError || 'Hệ thống đang tính thời gian gói chính và các dịch vụ thêm. Vui lòng chờ một chút rồi xác nhận lại.'});return false;
    }
    const minutes = fullSelection ? quoteReady?quote!.durationMinutes:computedMinutes : discoveryMinutes;
    const staff = selectedMode === 'MODE_A' && currentStep >= 4 ? selectedStaff : undefined;
    const notice = bookingTimingNotice({startsAt,baseMinutes:fullSelection?baseMinutes:minutes,totalMinutes:minutes,minimumMinutes:Math.min(...packages.map(p=>p.durationMinutes*quantity)),availableUntil:staff?.availableUntil,availableUntilReason:staff?.availableUntilReason,staffName:staff?.fullName});
    if(notice){setSubmitError('');setTimingNotice(notice);return false;}
    if(selectedMode==='MODE_A' && currentStep>=5){
      const current=availableStaffs.find(item=>item.id===selectedStaffId);
      if(staffLoading||staffError||!current?.eligibleServices?.some(item=>item.id===service.id)){
        setTimingNotice({kind:'STATUS',title:staffLoading?'Đang kiểm tra lịch nhân viên':'Nhân viên chưa phù hợp với lựa chọn này',message:staffLoading?'Vui lòng chờ hệ thống kiểm tra lại toàn bộ thời lượng rồi xác nhận lại.':staffError||'Lịch hoặc điều kiện nhận việc của nhân viên đã thay đổi. Vui lòng chọn lại nhân viên, dịch vụ hoặc ngày giờ phù hợp.'});return false;
      }
    }
    return true;
  };
  const submitBooking = async () => {
    if(saving || !validateBookingTiming())return; setSaving(true);setSubmitError('');
    try { const timeIssue=customerSlotIssue(startsAt,quote?.durationMinutes||actualPackage?.durationMinutes||60);if(timeIssue)throw new Error(timeIssue);
      if(selectedMode==='MODE_A'&&(staffLoading||staffError||!availableStaffs.find(item=>item.id===selectedStaffId)?.eligibleServices?.some(item=>item.id===service.id)))throw new Error(staffError||'Vui lòng kiểm tra lại nhân viên phù hợp trước khi đặt đơn.');
      if(!quote)throw new Error(quoteError || 'Đang chờ báo giá từ backend.');
      if(selectedMode==='MODE_A' && !selectedStaff) throw new Error('Vui lòng chọn nhân viên phù hợp.');
      const body={...JSON.parse(quoteKey),mode:selectedMode,addressId:selectedAddressId,startsAt,staffId:selectedMode==='MODE_A'?selectedStaff?.id:undefined,paymentMethod:paymentMethod==='CASH'?'CASH':'BANK_TRANSFER_QR',notes:customerNote};
      const serialized=JSON.stringify(body);if(requestRef.current?.body!==serialized)requestRef.current={body:serialized,key:'mobile-'+Date.now()+'-'+Math.random().toString(36).slice(2)};
      const raw=await operationRequest<Record<string,unknown>>('booking','/bookings','POST',{...body,requestKey:requestRef.current!.key}); setCreatedBooking(bookingView(raw)); await CustomerBookings.load().catch(()=>{});if(selectedMode==='MODE_A')router.replace({pathname:'/booking/waiting',params:{id:String(raw.id)}});else setCurrentStep(6);
    } catch(e) {setSubmitError(e instanceof Error?e.message:'Chưa tạo được đơn.');} finally{setSaving(false);}
  };
  const CLEANING_DURATIONS = packages.filter(p=>p.durationMinutes*quantity<=240&&(p.defaultStaffCount||1)===1).map(p=>({hours:p.durationHours,title:p.name,area:p.maxArea || '',unitType:p.recommendedFor || '',desc:p.description,isPopular:false,price:p.price}));

  useEffect(() => {
    // Mode A Step 8: Waiting for staff response
    if (selectedMode === 'MODE_A' && currentStep === 8) {
      Animated.loop(
        Animated.timing(clockSpinAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      return () => clockSpinAnim.stopAnimation();
    }

    // Mode B Step 6: Searching radar
    if (selectedMode === 'MODE_B' && currentStep === 6 && !isModeBStaffAccepted) {
      const loop1 = Animated.loop(
        Animated.parallel([
          Animated.timing(radarWave1, {
            toValue: 2.4,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(radarOpacity1, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );

      const loop2 = Animated.loop(
        Animated.sequence([
          Animated.delay(500),
          Animated.parallel([
            Animated.timing(radarWave2, {
              toValue: 2.4,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(radarOpacity2, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      const loop3 = Animated.loop(
        Animated.sequence([
          Animated.delay(1000),
          Animated.parallel([
            Animated.timing(radarWave3, {
              toValue: 2.4,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(radarOpacity3, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      loop1.start();
      loop2.start();
      loop3.start();

      return () => { loop1.stop(); loop2.stop(); loop3.stop(); };
    }

    // Success screen after the staff confirms the booking.
    if (
      (selectedMode === 'MODE_A' && currentStep === 9) ||
      (selectedMode === 'MODE_B' && currentStep === 7)
    ) {
      Animated.spring(successScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedMode, currentStep]);

  const basePrice = quoteReady?quote!.baseAmount:(actualPackage?.price||service.basePrice)*quantity*Math.ceil((selectedMode==='MODE_A'?1:requiredStaffCount)/(actualPackage?.defaultStaffCount||1));
  const addOnsTotal = quoteReady?quote!.addOnAmount:extraTotals.selected.reduce((sum,item)=>sum+(item.kind==='ADD_ON'?item.price:catalog.services.find(s=>s.id===item.id)?.basePrice||item.price),0);
  const relatedServicesTotal = 0;
  const subtotal = basePrice + addOnsTotal;
  const discountAmount = quoteReady?quote!.discountAmount:0;
  const totalAmount = quoteReady?quote!.totalAmount:basePrice+addOnsTotal;

  const resetLaterSteps = (destination: number) => {
    if(createdBooking)return;
    const sections=laterBookingSections(selectedMode||'MODE_A',destination);
    pricingGeneration.current++;quoteAbort.current?.abort();setPricingAttempt(value=>value+1);
    setQuote(null);setQuoteResolvedKey('');setQuoteError('');setQuoteLoading(false);
    setSubmitError('');setTimingNotice(null);setIsCopied(false);
    if(sections.has('payment'))setPaymentMethod('CASH');
    if(sections.has('summary')){setSelectedPromoCode('');setPromoInput('');setPromoFeedback('');setPromotionFailures({});setCustomerNote('');}
    if(sections.has('answers'))setAnswers({});
    if(sections.has('extras'))setSelectedExtraKeys([]);
    if(sections.has('package')){
      const preferred=destination>=4?selectedStaff?.eligibleServices?.find(item=>serviceFilters.includes(item.id))?.id||selectedStaff?.eligibleServices?.[0]?.id:destination>=2?serviceFilters[0]:undefined;
      const serviceId=selectedMode==='MODE_A'?preferred||catalog.services[0].id:service.id;
      const first=getPackagesByServiceId(serviceId)[0];setSelectedServiceId(serviceId);setSelectedPackageId(first?.id||'');setSelectedDurationHours(first?.durationHours||1);setRequiredStaffCount(first?.defaultStaffCount||1);
    }
    if(sections.has('staff')){setSelectedStaffId('');setPickedStaff(undefined);}
    if(sections.has('staffFilters')){setStarFilter('ALL');setAgeFilter('ALL');setAvailableStaffs([]);setStaffError('');setStaffLoading(false);}
    if(sections.has('preferences'))setServiceFilters([]);
    if(sections.has('time')){const days=calendarDays();setSelectedDateStr(days[1].label);setSelectedDateIso(days[1].iso);setSelectedTimeSlot('09:00');setDiscoveryMinutes(120);}
    if(sections.has('address'))setSelectedAddressId(addresses.find(a=>a.isDefault)?.id||addresses[0]?.id||'');
  };

  // Back navigation
  const handleBack = () => {
    if (selectedMode === null) {
      goBack();
      return;
    }
    if (currentStep > 0) {
      triggerStepTransition(currentStep - 1);
    } else {
      if (!params.mode && !params.serviceId && !params.staffId) {
        resetLaterSteps(-1);setSelectedMode(null);
      } else {
        goBack();
      }
    }
  };

  const backHandlerRef=useRef(handleBack);backHandlerRef.current=handleBack;
  useFocusEffect(useCallback(()=>{const subscription=BackHandler.addEventListener('hardwareBackPress',()=>{backHandlerRef.current();return true;});return()=>subscription.remove();},[]));

  // Copy booking code
  const handleCopyCode = (code: string) => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    Alert.alert('Mã đơn hàng', code);
  };

  // Filter staff list according to user preferences
  const serviceFilterOptions=useMemo(()=>catalog.services.filter(item=>catalog.packages.some(p=>p.serviceId===item.id)),[catalog.services,catalog.packages]);
  const filteredStaffs = useMemo(()=>availableStaffs.filter((s) => {
    if (s.id === retry?.previousStaffId) return false;
    if (retry && selectedServiceId === retry.serviceId) {
      const requiredServices = [service.id, ...selectedRelatedServiceIds];
      if (!requiredServices.every(id => s.eligibleServices?.some(skill => skill.id === id))) return false;
    }
    if(serviceFilters.length&&!s.eligibleServices?.some(skill=>serviceFilters.includes(skill.id)))return false;
    // Star filter
    if (starFilter === '4.8' && s.rating < 4.8) return false;
    if (starFilter === '4.9' && s.rating < 4.9) return false;
    if (starFilter === '5.0' && s.rating < 5.0) return false;

    // Age filter
    const age = staffAge(s); if(ageFilter!=='ALL' && !age)return false;
    if (ageFilter === 'UNDER_30' && age !== null && age > 30) return false;
    if (ageFilter === '31_45' && (age !== null && (age < 31 || age > 45))) return false;
    if (ageFilter === 'OVER_45' && age !== null && age <= 45) return false;

    return true;
  }),[availableStaffs,serviceFilters,starFilter,ageFilter,bookingClock,retry,selectedServiceId,selectedExtraKeys]);

  // Header with visual step progress bar
  const renderHeader = (title: string, stepCurrent: number, stepTotal: number) => {
    const progressPercent = `${Math.round(((stepCurrent + 1) / stepTotal) * 100)}%`;
    return (
      <View style={styles.headerWrapper}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Quay lại bước trước" style={styles.backButton} onPress={handleBack} hitSlop={8}>
            <IconSymbol name="arrowBack" size={20} color={BrandColors.gray900} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.headerStepBadge}>
              Bước {stepCurrent + 1} / {stepTotal}
            </Text>
          </View>
          <Pressable
            style={styles.bellButton}
            onPress={() => router.push('/notifications')}
            hitSlop={8}>
            <IconSymbol name="bell" size={18} color={BrandColors.gray700} />
            <View style={styles.bellDot} />
          </Pressable>
        </View>

        {!(selectedMode==='MODE_A'&&currentStep===5) && !!(submitError || ((selectedMode==='MODE_A'?currentStep>=5:currentStep>=4)&&quoteError)) && <Text style={{color:'#B91C1C',padding:12}}>{submitError || quoteError}</Text>}
        {/* Dynamic Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: progressPercent as any }]} />
        </View>
      </View>
    );
  };

  // Wrapper for step transitions (instant & buttery-smooth)
  const renderAnimatedStep = (content: React.ReactNode) => (
    <View style={{ flex: 1 }}>{content}{favouritePending && <FavouriteDurationPopup visible={true} fullPackage={(pendingPackage?.durationMinutes || 0)*quantity>=240} packageName={pendingPackage?.name || 'gói hiện tại'} shorterName={pendingShorter?.name} keep={keepFavouritePackage} lower={lowerFavouritePackage} />}<BookingTimingPopup notice={timingNotice} close={()=>setTimingNotice(null)} adjust={()=>{const kind=timingNotice?.kind;setTimingNotice(null);setSubmitError('');triggerStepTransition(selectedMode==='MODE_A'?5:kind==='EXTRAS'?1:0);}} changeTime={()=>{setTimingNotice(null);setSubmitError('');triggerStepTransition(selectedMode==='MODE_A'?1:3);}} /></View>
  );

  const applyPromotion = (input: string) => {
    const code=input.trim().toUpperCase();
    if(!code){setPromoFeedback('Vui lòng nhập mã ưu đãi.');return;}
    const promotion=catalog.promotions.find(item=>item.code.toUpperCase()===code);
    const amount=quoteReady?quote!.baseAmount+quote!.addOnAmount:(actualPackage?.price||0)*quantity+extraTotals.addOnsTotal+extraTotals.servicesTotal;
    const issue=promotion?promotionIssue(promotion,service.id,amount):'';
    if(issue){setPromoFeedback(issue);setPromotionFailures(previous=>({...previous,[code]:issue}));return;}
    setPromoInput(code);setPromoFeedback('');setSelectedPromoCode(code);setPricingAttempt(value=>value+1);
  };
  const renderVoucherSectionInSummary = () => <View>
    <BookingPromotions promotions={catalog.promotions} services={catalog.services} serviceId={service.id} amount={quoteReady?quote!.baseAmount+quote!.addOnAmount:(actualPackage?.price||0)*quantity+extraTotals.addOnsTotal+extraTotals.servicesTotal} input={promoInput} changeInput={setPromoInput} selectedCode={selectedPromoCode} applied={!!selectedPromoCode&&quoteReady} busy={quoteLoading} feedback={promoFeedback} failures={promotionFailures} apply={applyPromotion} clear={()=>{setSelectedPromoCode('');setPromoInput('');setPromoFeedback('');}} />
  </View>;

  // =========================================================================
  // FLOW 0: Screen Chọn cách bắt đầu (Mode A vs Mode B)
  // =========================================================================
  if (selectedMode === null) {
    return (
      <LinearGradient
        colors={BrandColors.softBgGradient}
        locations={BrandColors.softBgGradientLocations}
        style={styles.gradientContainer}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Top Header */}
          <View style={styles.entryHeader}>
            <Pressable style={styles.backButton} onPress={goBack} hitSlop={8}>
              <IconSymbol name="arrowBack" size={20} color={BrandColors.gray900} />
            </Pressable>
            <View style={styles.brandBadge}>
              <View style={styles.brandDot} />
              <Text style={styles.brandTitle}>CleanMaster</Text>
            </View>
            <Pressable
              style={styles.giftBadgeBtn}
              onPress={() => Alert.alert('Ưu đãi đang có', catalog.promotions.length ? catalog.promotions.map(p=>p.code+': '+p.description).join('\n') : 'Chưa có mã ưu đãi đang hoạt động.')}>
              <IconSymbol name="gift" size={16} color={BrandColors.primary} />
              <Text style={styles.giftBadgeText}>Ưu đãi</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.entryContent} showsVerticalScrollIndicator={false}>
            {/* Banner with Linear Gradient */}
            <View style={styles.entryBanner}>
              <Image
                source={remoteImageSource('https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80')}
                style={styles.entryBannerImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.75)']}
                style={styles.entryBannerOverlay}>
                <View style={styles.bannerTagPill}>
                  <Text style={styles.bannerTagText}>⚡ ĐẶT NHANH 60 GIÂY</Text>
                </View>
                <Text style={styles.entryBannerHeading}>CleanMaster Mát Lành</Text>
                <Text style={styles.entryBannerSubtitle}>
                  Dịch vụ dọn dẹp chuyên nghiệp, minh bạch & tận tâm
                </Text>
              </LinearGradient>
            </View>

            {/* Prompt Section */}
            <Text style={styles.entryQuestion}>Bạn muốn bắt đầu như thế nào?</Text>

            {/* Option 1: Chọn nhân viên (MODE A) */}
            <Pressable
              style={[styles.modeCard, styles.modeCardActive]}
              onPress={() => {
                setSelectedMode('MODE_A');
                setCurrentStep(0);
              }}>
              <LinearGradient
                colors={BrandColors.primaryGradient}
                style={styles.modeIconCircleTeal}>
                <IconSymbol name="user" size={24} color={BrandColors.white} />
              </LinearGradient>
              <View style={styles.modeTextContainer}>
                <View style={styles.modeTitleRow}>
                  <Text style={styles.modeCardTitle}>Chọn nhân viên</Text>
                  <View style={styles.modeBadgeModeA}>
                    <Text style={styles.modeBadgeTextA}>Tự chọn</Text>
                  </View>
                </View>
                <Text style={styles.modeCardSubtitle}>
                  Chọn vị trí và ngày giờ, hệ thống lọc người giúp việc phù hợp gần bạn.
                </Text>
              </View>
              <IconSymbol name="chevronRight" size={18} color={BrandColors.primary} />
            </Pressable>

            {/* Option 2: Chọn dịch vụ (MODE B) */}
            <Pressable
              style={styles.modeCard}
              onPress={() => {
                setSelectedMode('MODE_B');
                setCurrentStep(0);
              }}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.modeIconCircleTeal}>
                <IconSymbol name="sparkles" size={24} color={BrandColors.white} />
              </LinearGradient>
              <View style={styles.modeTextContainer}>
                <View style={styles.modeTitleRow}>
                  <Text style={styles.modeCardTitle}>Chọn dịch vụ</Text>
                  <View style={styles.modeBadgeModeB}>
                    <Text style={styles.modeBadgeTextB}>Tự động</Text>
                  </View>
                </View>
                <Text style={styles.modeCardSubtitle}>
                  Chọn gói công việc cần làm, hệ thống tự động ghép nhân viên phù hợp.
                </Text>
              </View>
              <IconSymbol name="chevronRight" size={18} color={BrandColors.gray400} />
            </Pressable>

            {/* Trust points card */}
            <View style={styles.trustBox}>
              <View style={styles.trustItem}>
                <IconSymbol name="shield" size={18} color={BrandColors.primary} />
                <Text style={styles.trustText}>Hồ sơ do Admin duyệt</Text>
              </View>
              <View style={styles.trustItem}>
                <IconSymbol name="clock" size={18} color={BrandColors.primary} />
                <Text style={styles.trustText}>Đúng giờ cam kết</Text>
              </View>
              <View style={styles.trustItem}>
                <IconSymbol name="star" size={18} color={BrandColors.accent} />
                <Text style={styles.trustText}>Đánh giá từ khách hàng</Text>
              </View>
              <View style={styles.trustItem}>
                <IconSymbol name="award" size={18} color={BrandColors.primary} />
                <Text style={styles.trustText}>Bảo hành hoàn tiền</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (selectedMode === 'MODE_A' && currentStep >= 4 && !selectedStaff) {
    return (
      <LinearGradient
        colors={BrandColors.softBgGradient}
        locations={BrandColors.softBgGradientLocations}
        style={styles.gradientContainer}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.stateCenterContainer}>
            <View style={styles.stateIconCircle}>
              <IconSymbol name="user" size={38} color={BrandColors.primary} />
            </View>
            <Text style={styles.stateTitle}>Chưa chọn nhân viên</Text>
            <Text style={styles.stateSubtitle}>
              Chưa có nhân viên phù hợp khung giờ và dịch vụ đã chọn.
            </Text>
            <Pressable
              style={styles.statePrimaryBtn}
              onPress={() => triggerStepTransition(3)}>
              <LinearGradient colors={BrandColors.primaryGradient} style={styles.stateGradientBtn}>
                <Text style={styles.statePrimaryBtnText}>Quay lại chọn nhân viên</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }
  // =========================================================================
  // ===================== LUỒNG MODE A: CHỌN NHÂN VIÊN =======================
  // =========================================================================
  if (selectedMode === 'MODE_A') {
    // ---------------- STEP 0: CHỌN ĐỊA CHỈ (Mode A) ----------------
    if (currentStep === 0) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Chọn địa chỉ làm việc', 0, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.sectionHeaderTitle}>Địa chỉ đã lưu</Text>

                  {addresses.map((addr) => {
                    const isSelected = addr.id === selectedAddressId;
                    const isHome = addr.title.toLowerCase().includes('nhà');
                    const isOffice =
                      addr.title.toLowerCase().includes('việc') || addr.title.toLowerCase().includes('ty');
                    return (
                      <Pressable
                        key={addr.id}
                        style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                        onPress={() => setSelectedAddressId(addr.id)}>
                        <View
                          style={[styles.addressIconCircle, isSelected && styles.addressIconCircleSelected]}>
                          <IconSymbol
                            name={isHome ? 'home' : isOffice ? 'office' : 'location'}
                            size={22}
                            color={isSelected ? BrandColors.primary : BrandColors.gray600}
                          />
                        </View>
                        <View style={styles.addressInfo}>
                          <View style={styles.addressTitleRow}>
                            <Text style={styles.addressTitle}>{addr.title}</Text>
                            {addr.isDefault && (
                              <View style={styles.defaultPill}>
                                <Text style={styles.defaultPillText}>Mặc định</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.addressDetail}>{addr.fullAddress}</Text>
                        </View>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioInnerDot} />}
                        </View>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    style={styles.addAddressDashedBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/account/addresses',
                        params: {
                          fromBooking: '1',
                          mode: selectedMode || undefined,
                          serviceId: service.id,
                          staffId: selectedStaffId || undefined,
                        },
                      })
                    }>
                    <IconSymbol name="plus" size={16} color={BrandColors.primary} />
                    <Text style={styles.addAddressDashedText}>Thêm địa chỉ mới</Text>
                  </Pressable>
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(1)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiếp tục (Chọn ngày & giờ)</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 1: CHỌN NGÀY & GIỜ (Mode A) ----------------
    if (currentStep === 1) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Chọn ngày & giờ', 1, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  {/* Calendar Box */}
                  <View style={styles.calendarCard}>
                    <View style={styles.calendarHeader}>
                      <View style={styles.calendarMonthWrapper}>
                        <IconSymbol name="calendar" size={18} color={BrandColors.primary} />
                        <Text style={styles.calendarMonthText}>{new Date(selectedDateIso+'T12:00:00+07:00').toLocaleDateString('vi-VN',{month:'long',year:'numeric'})}</Text>
                      </View>
                      <View style={styles.calendarArrows}>
                        <Pressable style={styles.arrowBtn} hitSlop={6}>
                          <Text style={styles.arrowText}>‹</Text>
                        </Pressable>
                        <Pressable style={styles.arrowBtn} hitSlop={6}>
                          <Text style={styles.arrowText}>›</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.calendarGrid}>
                      {CALENDAR_DAYS.map((day, idx) => {
                        const isSelected = day.iso === selectedDateIso;
                        return (
                          <Pressable
                            key={idx}
                            style={[styles.calendarDayCell, isSelected && styles.calendarDaySelected]}
                            disabled={!day.isCurrentMonth} onPress={() => {setSelectedDateStr(day.label);setSelectedDateIso(day.iso);}}>
                            <Text
                              style={[
                                styles.calendarDayName,
                                isSelected && styles.calendarDayTextSelected,
                              ]}>
                              {day.dayName}
                            </Text>
                            <Text
                              style={[
                                styles.calendarDayNum,
                                !day.isCurrentMonth && styles.calendarDayNumMuted,
                                isSelected && styles.calendarDayTextSelected,
                              ]}>
                              {day.dateNum}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Time Slots */}
                  <Text style={styles.sectionHeaderTitle}>Giờ bắt đầu làm việc</Text><Text style={styles.stepSubtitleNote}>Đặt trước tối thiểu 2 giờ • Làm việc trong 08:00–20:00. Giờ không hợp lệ được khóa.</Text>
                  <View style={styles.timeSlotGrid}>
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = slot === selectedTimeSlot;
                      const slotIssue=customerSlotIssue(selectedDateIso+'T'+slot+':00+07:00',timePickerMinutes,bookingClock);
                      return (
                        <Pressable
                          key={slot}
                          disabled={!!slotIssue} accessibilityState={{disabled:!!slotIssue,selected:isSelected}}
                          style={[styles.timeSlotPill, isSelected && styles.timeSlotPillSelected,!!slotIssue&&{opacity:0.35}]}
                          onPress={() => setSelectedTimeSlot(slot)}>
                          <IconSymbol
                            name="clock"
                            size={14}
                            color={isSelected ? BrandColors.white : BrandColors.gray500}
                          />
                          <Text
                            style={[
                              styles.timeSlotText,
                              isSelected && styles.timeSlotTextSelected,
                            ]}>
                            {slot}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.sectionHeaderTitle}>Thời lượng dự kiến</Text>
                  <View style={styles.skillWrap}>{[60,120,180,240].map(minutes=><Pressable key={minutes} accessibilityRole="button" accessibilityState={{selected:discoveryMinutes===minutes}} style={[styles.filterChip,discoveryMinutes===minutes&&styles.filterChipActive]} onPress={()=>setDiscoveryMinutes(minutes)}><Text style={[styles.filterChipText,discoveryMinutes===minutes&&styles.filterChipTextActive]}>{minutes/60} giờ</Text></Pressable>)}</View>
                  <Text style={styles.stepSubtitleNote}>Chỉ hiện nhân viên rảnh trọn {discoveryMinutes/60} giờ từ {selectedTimeSlot}. Khi chọn gói hoặc thêm dịch vụ, hệ thống sẽ kiểm tra lại toàn bộ thời lượng thực tế.</Text>
                  {/* Matching Note */}
                  <View style={styles.matchingNoticeBox}>
                    <IconSymbol name="info" size={18} color={BrandColors.primary} />
                    <Text style={styles.matchingNoticeText}>
                      Hệ thống sẽ tự động lọc danh sách người giúp việc có lịch trống lúc{' '}
                      <Text style={{ fontWeight: '700', color: BrandColors.primaryDark }}>
                        {selectedTimeSlot}
                      </Text>{' '}
                      gần khu vực{' '}
                      <Text style={{ fontWeight: '700', color: BrandColors.primaryDark }}>
                        {selectedAddress.title}
                      </Text>
                      .
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(2)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiếp tục chọn dịch vụ</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 2: CHỌN DỊCH VỤ ƯU TIÊN (Mode A) ----------------
    if (currentStep === 2) {
      return <LinearGradient colors={BrandColors.softBgGradient} locations={BrandColors.softBgGradientLocations} style={styles.gradientContainer}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {renderHeader('Chọn dịch vụ ưu tiên', 2, 9)}
          {renderAnimatedStep(<View style={styles.stepContainer}>
            <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <ServicePreferencePicker services={serviceFilterOptions} selectedIds={serviceFilters} onChange={ids => {
                setServiceFilters(ids); setSelectedStaffId(''); setPickedStaff(undefined); setSubmitError('');
              }} />
            </ScrollView>
            <View style={styles.bottomBar}>
              <Pressable accessibilityRole="button" style={styles.ctaPrimaryBtn} onPress={() => triggerStepTransition(3)}>
                <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                  <Text style={styles.ctaPrimaryText}>Tìm nhân viên phù hợp</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>)}
        </SafeAreaView>
      </LinearGradient>;
    }

    // ---------------- STEP 3: DANH SÁCH NHÂN VIÊN PHÙ HỢP (Mode A) ----------------
    if (currentStep === 3) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Nhân viên khả dụng', 3, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                {/* Auto Filter Banner */}
                <View style={styles.autoFilterBanner}>
                  <IconSymbol name="sparkles" size={16} color={BrandColors.primary} />
                  <Text style={styles.autoFilterText} numberOfLines={1}>
                    Đã lọc người giúp việc rảnh lúc {selectedTimeSlot} tại {selectedAddress.title}
                  </Text>
                </View>

                {/* Star & Age Filter Bar */}
                <View style={styles.filterSectionWrapper}>
                  {/* Star Rating Filters */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterChipScrollRow}>
                    <Text style={styles.filterCategoryLabel}>Số sao:</Text>
                    <Pressable
                      style={[styles.filterChip, starFilter === 'ALL' && styles.filterChipActive]}
                      onPress={() => setStarFilter('ALL')}>
                      <Text
                        style={[
                          styles.filterChipText,
                          starFilter === 'ALL' && styles.filterChipTextActive,
                        ]}>
                        Tất cả sao
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.filterChip, starFilter === '4.8' && styles.filterChipActive]}
                      onPress={() => setStarFilter('4.8')}>
                      <Text
                        style={[
                          styles.filterChipText,
                          starFilter === '4.8' && styles.filterChipTextActive,
                        ]}>
                        ⭐ 4.8★+
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.filterChip, starFilter === '4.9' && styles.filterChipActive]}
                      onPress={() => setStarFilter('4.9')}>
                      <Text
                        style={[
                          styles.filterChipText,
                          starFilter === '4.9' && styles.filterChipTextActive,
                        ]}>
                        ⭐ 4.9★+
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.filterChip, starFilter === '5.0' && styles.filterChipActive]}
                      onPress={() => setStarFilter('5.0')}>
                      <Text
                        style={[
                          styles.filterChipText,
                          starFilter === '5.0' && styles.filterChipTextActive,
                        ]}>
                        ⭐ 5.0★
                      </Text>
                    </Pressable>
                  </ScrollView>

                  {/* Age Filters */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterChipScrollRow}>
                    <Text style={styles.filterCategoryLabel}>Độ tuổi:</Text>
                    <Pressable
                      style={[styles.filterChip, ageFilter === 'ALL' && styles.filterChipActive]}
                      onPress={() => setAgeFilter('ALL')}>
                      <Text
                        style={[
                          styles.filterChipText,
                          ageFilter === 'ALL' && styles.filterChipTextActive,
                        ]}>
                        Tất cả tuổi
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.filterChip, ageFilter === 'UNDER_30' && styles.filterChipActive]}
                      onPress={() => setAgeFilter('UNDER_30')}>
                      <Text
                        style={[
                          styles.filterChipText,
                          ageFilter === 'UNDER_30' && styles.filterChipTextActive,
                        ]}>
                        20 – 30 tuổi
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.filterChip, ageFilter === '31_45' && styles.filterChipActive]}
                      onPress={() => setAgeFilter('31_45')}>
                      <Text
                        style={[
                          styles.filterChipText,
                          ageFilter === '31_45' && styles.filterChipTextActive,
                        ]}>
                        31 – 45 tuổi
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.filterChip, ageFilter === 'OVER_45' && styles.filterChipActive]}
                      onPress={() => setAgeFilter('OVER_45')}>
                      <Text
                        style={[
                          styles.filterChipText,
                          ageFilter === 'OVER_45' && styles.filterChipTextActive,
                        ]}>
                        Trên 45 tuổi
                      </Text>
                    </Pressable>
                  </ScrollView>
                </View>

                {/* Staff Cards */}
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  {retry && <View style={styles.retrySummary}>
                    <Text style={styles.retryHeading}>Đã giữ thông tin đơn trước</Text>
                    <Text style={styles.retryText}>{selectedDateStr} lúc {selectedTimeSlot} • {discoveryMinutes} phút</Text>
                    <Text style={styles.retryText}>{service.name} • {actualPackage?.name}</Text>
                    {extraTotals.selected.length > 0 && <Text style={styles.retryText}>Dịch vụ thêm: {extraTotals.selected.map(item => item.name).join(', ')}</Text>}
                    <Text style={styles.retryText}>{selectedAddress.fullAddress || selectedAddress.streetAddress}</Text>
                    <View style={styles.previousStaff} accessibilityLabel={`${retry.previousStaffName}: đã hết thời gian nhận đơn, không thể chọn lại trong lần tìm này`}>
                      <IconSymbol name="clock" size={18} color="#B45309" />
                      <View style={{ flex: 1 }}><Text style={styles.retryHeading}>{retry.previousStaffName}</Text><Text style={styles.previousStaffText}>Đã chọn trước đó • Không nhận đơn đúng hạn</Text><Text style={styles.previousStaffText}>Không chọn lại trong lần tìm này</Text></View>
                    </View>
                    <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)')} style={styles.retryCancel}><Text style={styles.retryCancelText}>Hủy đặt dịch vụ, về trang chủ</Text></Pressable>
                  </View>}
                  {staffLoading ? <View style={styles.emptyFilterBox}><ActivityIndicator color={BrandColors.primary}/><Text style={styles.emptyFilterText}>Đang kiểm tra lịch rảnh, khu vực và dịch vụ của nhân viên…</Text></View> : staffError ? <View style={styles.emptyFilterBox}><Text style={styles.emptyFilterText}>{staffError}</Text><Pressable style={styles.resetFilterBtn} onPress={()=>setStaffAttempt(value=>value+1)}><Text style={styles.resetFilterBtnText}>Thử lại</Text></Pressable></View> : filteredStaffs.length === 0 ? (
                    <View style={styles.emptyFilterBox}>
                      <IconSymbol name="warning" size={32} color={BrandColors.gray400} />
                      <Text style={styles.emptyFilterText}>Không có nhân viên phù hợp với bộ lọc</Text>
                      <Pressable
                        style={styles.resetFilterBtn}
                        onPress={() => {
                          setStarFilter('ALL');
                          setAgeFilter('ALL');
                        }}>
                        <Text style={styles.resetFilterBtnText}>Đặt lại sao và độ tuổi</Text>
                      </Pressable>
                      <Pressable style={styles.resetFilterBtn} onPress={() => triggerStepTransition(2)}><Text style={styles.resetFilterBtnText}>Thay đổi dịch vụ ưu tiên</Text></Pressable>
                    </View>
                  ) : (
                    <>
                      <View style={styles.topStaffNoticeRow}>
                        <IconSymbol name="sparkles" size={14} color={BrandColors.primary} />
                        <Text style={styles.topStaffNoticeText}>
                          Có {filteredStaffs.length} nhân viên phù hợp địa chỉ và khung giờ đã chọn
                        </Text>
                      </View>
                      {filteredStaffs.map((staff) => {
                        const isSelected = selectedStaffId === staff.id;
                        return (
                          <Pressable
                            key={staff.id}
                            style={[styles.bigStaffCard, isSelected && styles.bigStaffCardSelected]}
                            onPress={() => {
                              setSelectedStaffId(staff.id);setPickedStaff(staff);
                              const preferred=staff.eligibleServices?.find(item=>serviceFilters.includes(item.id))||staff.eligibleServices?.find(item=>item.id===service.id)||staff.eligibleServices?.[0];
                              if(preferred){chooseService(preferred.id);if(!retry || preferred.id!==retry.serviceId){const pack=getPackagesByServiceId(preferred.id).find(item=>item.durationMinutes===discoveryMinutes)||getPackagesByServiceId(preferred.id)[0];if(pack)setSelectedDurationHours(pack.durationHours);}}
                              triggerStepTransition(4);
                            }}>
                            {/* Top: Avatar lớn + Thông tin chính */}
                            <View style={styles.bigStaffTopRow}>
                              <View style={styles.bigAvatarBox}>
                                <Image source={remoteImageSource(staff.avatar)} style={styles.bigAvatarImg} />
                                <View style={styles.bigOnlineDot} />
                              </View>

                              <View style={styles.bigStaffInfoCol}>
                                <View style={styles.bigStaffNameRow}>
                                  <Text style={styles.bigStaffFullName}>{staff.fullName}</Text>
                                </View>

                                <Text style={styles.bigStaffMetaText}>
                                  {staffAgeLabel(staff)} • {staff.experienceYears} năm kinh nghiệm
                                </Text>

                                <View style={styles.bigRatingRow}>
                                  <Text style={styles.bigRatingBadge}>⭐ {staff.rating}★</Text>
                                  <Text style={styles.bigReviewCount}>({staff.reviewCount} đánh giá)</Text>
                                </View>
                              </View>
                            </View>

                            {/* Tags / Kỹ năng tiêu biểu */}
                            {staff.specialties && staff.specialties.length > 0 && (
                              <View style={styles.bigSpecialtiesRow}>
                                {staff.specialties.map((sp: string, idx: number) => (
                                  <View key={idx} style={styles.bigSpecialtyPill}>
                                    <Text style={styles.bigSpecialtyPillText}>✓ {sp}</Text>
                                  </View>
                                ))}
                              </View>
                            )}

                            {/* Lời giới thiệu ngắn (Bio) */}
                            {staff.bio ? (
                              <Text numberOfLines={2} style={styles.bigStaffBio}>
                                "{staff.bio}"
                              </Text>
                            ) : null}

                            {/* Divider */}
                            <View style={styles.bigStaffDivider} />

                            {/* Footer: Giá & Nút chọn */}
                            <View style={styles.bigStaffFooter}>
                              <View>
                                <Text style={styles.bigPriceLabel}>Giá gói dịch vụ</Text>
                                <View style={styles.bigPriceRow}>
                                  <Text style={styles.bigPriceValue}>{formatVND(actualPackage?.price || service.basePrice)}</Text>
                                  <Text style={styles.bigPriceUnit}>/ gói</Text>
                                </View>
                              </View>

                              <View style={styles.bigSelectBtn}>
                                <Text style={styles.bigSelectBtnText}>Chọn & Xem hồ sơ ›</Text>
                              </View>
                            </View>
                          </Pressable>
                        );
                      })}
                    </>
                  )}
                </ScrollView>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    if (!selectedStaff) return null;

    // ---------------- STEP 4: XEM KĨ PROFILE NHÂN VIÊN (Mode A) ----------------
    if (currentStep === 4) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Hồ sơ nhân viên', 4, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  {/* Profile Avatar & Name */}
                  <View style={styles.detailProfileHeader}>
                    <View style={styles.detailLargeAvatarWrapper}>
                      <Image source={remoteImageSource(selectedStaff.avatar)} style={styles.detailLargeAvatar} />
                      <View style={styles.verifiedBadgeCircle}>
                        <IconSymbol name="check" size={14} color="#FFFFFF" />
                      </View>
                    </View>
                    <Text style={styles.detailFullName}>
                      {selectedStaff.fullName}{' '}
                      <Text style={styles.detailAge}>{staffAgeLabel(selectedStaff)}</Text>
                    </Text>
                    <View style={styles.detailTagRow}>
                      <Text style={styles.detailExpText}>• {selectedStaff.experienceYears} năm kinh nghiệm</Text>
                    </View>
                  </View>

                  {/* 4 Metric Cards */}
                  <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                      <IconSymbol name="star" size={16} color={BrandColors.accent} />
                      <Text style={styles.statValue}>{selectedStaff.rating}★</Text>
                      <Text style={styles.statLabel}>Đánh giá</Text>
                    </View>
                    <View style={styles.statCard}>
                      <IconSymbol name="clock" size={16} color={BrandColors.primary} />
                      <Text style={styles.statValue}>{selectedStaff.experienceYears}</Text>
                      <Text style={styles.statLabel}>Năm kinh nghiệm</Text>
                    </View>
                    <View style={styles.statCard}>
                      <IconSymbol name="award" size={16} color={BrandColors.primary} />
                      <Text style={styles.statValue}>{selectedStaff.completedBookingsCount || 0}+</Text>
                      <Text style={styles.statLabel}>Đơn hàng</Text>
                    </View>
                    <View style={styles.statCard}>
                      <IconSymbol name="shield" size={16} color={BrandColors.primary} />
                      <Text style={styles.statValue}>{staffAge(selectedStaff) ?? '—'}</Text>
                      <Text style={styles.statLabel}>Tuổi</Text>
                    </View>
                  </View>

                  <View style={styles.bioCard}><Text style={styles.bioHeading}>Thông tin nhân viên</Text><Text style={styles.bioContent}>Độ tuổi: {staffAgeLabel(selectedStaff)}</Text><Text style={styles.bioContent}>Giới tính: {selectedStaff.gender === 'FEMALE' ? 'Nữ' : selectedStaff.gender === 'MALE' ? 'Nam' : 'Khác'}</Text>{!!selectedStaff.operatingDistricts.length&&<Text style={styles.bioContent}>Khu vực làm việc: {selectedStaff.operatingDistricts.join(', ')}</Text>}</View>
                  {/* Bio Section */}
                  <View style={styles.bioCard}>
                    <View style={styles.bioHeaderRow}>
                      <IconSymbol name="clean" size={16} color={BrandColors.primary} />
                      <Text style={styles.bioHeading}>Giới thiệu bản thân</Text>
                    </View>
                    <Text style={styles.bioContent}>
                      {selectedStaff.bio ||
                        'Nhân viên chưa cập nhật giới thiệu.'}
                    </Text>
                  </View>

                  {/* Skills Pills */}
                  <View style={styles.bioCard}>
                    <View style={styles.bioHeaderRow}>
                      <IconSymbol name="sparkles" size={16} color={BrandColors.primary} />
                      <Text style={styles.bioHeading}>Kỹ năng chuyên môn</Text>
                    </View>
                    <View style={styles.skillWrap}>
                      {selectedStaff.competencies.map(
                        (skill, i) => (
                          <View key={i} style={styles.skillPillLarge}>
                            <IconSymbol name="check" size={12} color={BrandColors.primary} />
                            <Text style={styles.skillPillLargeText}>{skill}</Text>
                          </View>
                        )
                      )}
                    </View>
                  </View>

                  {/* Recent Customer Reviews */}
                  <View style={styles.bioCard}>
                    <View style={styles.bioHeaderRow}>
                      <IconSymbol name="chat" size={16} color={BrandColors.primary} />
                      <Text style={styles.bioHeading}>Đánh giá từ khách hàng gần đây</Text>
                    </View>
                    {!!staffReviewResource.error && <Text>{staffReviewResource.error}</Text>}
                    {!staffReviewResource.data?.length && <Text>Chưa có nhận xét được công bố.</Text>}
                    {(staffReviewResource.data || []).slice(0,3).map(review=><View key={review.id} style={styles.reviewSnippet}><View style={styles.reviewAuthorRow}><Text style={styles.reviewAuthor}>Khách hàng</Text><RatingStars rating={review.rating} size={12}/></View><Text style={styles.reviewSnippetText}>{review.comment}</Text></View>)}

                  </View>

                  {/* Security Guarantee Pill */}
                  <View style={styles.securityNoticeCard}>
                    <IconSymbol name="shield" size={20} color={BrandColors.success} />
                    <Text style={styles.securityNoticeText}>
                      Thông tin năng lực hiển thị theo phê duyệt được lưu trên hệ thống.
                    </Text>
                  </View>
                </ScrollView>

                {/* Continue to Add-on step */}
                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(5)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>
                        Chọn {selectedStaff.fullName} & Chọn giờ làm / Add-on
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 5: CHỌN THỜI LƯỢNG 2,3,4 TIẾNG & DỊCH VỤ BỔ TRỢ (Mode A) ----------------
    // YÊU CẦU:
    // 1. Thêm phần chọn thời gian dọn dẹp 2, 3, 4 tiếng phù hợp với từng mét vuông diện tích, chú thích đi cùng
    // 2. Thêm ô "Không chọn" để khách có thể không chọn add-on
    // 3. Dưới nút tiếp theo có hiển thị số tiền ước tính luôn cập nhật khi thêm bớt addon
    if (currentStep === 5) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Thời lượng & Dịch vụ bổ trợ', 5, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={[styles.stepContent,selectionWarning?{paddingBottom:180}:undefined]} showsVerticalScrollIndicator={false}>
                  <Text style={styles.sectionHeaderTitle}>Dịch vụ nhân viên có thể thực hiện</Text>
                  <View style={styles.skillWrap}>{(pickedStaff?.eligibleServices||selectedStaff.eligibleServices||[]).map(item=><Pressable key={item.id} style={[styles.filterChip,item.id===service.id&&styles.filterChipActive]} onPress={()=>chooseService(item.id)}><Text style={[styles.filterChipText,item.id===service.id&&styles.filterChipTextActive]}>{item.id===service.id?'✓ ':''}{item.name}</Text></Pressable>)}</View>
                  <ServiceQuestions fields={catalog.details.find(d=>String(d.service.id)===service.id)?.requirements || []} values={answers} change={setAnswers} />
                  {staffLoading&&<Text style={styles.stepSubtitleNote}>Đang kiểm tra lại toàn bộ thời lượng…</Text>}
                  {/* Duration selection */}
                  <Text style={styles.sectionHeaderTitle}>Gói dịch vụ & Thời lượng</Text>
                  <Text style={styles.stepSubtitleNote}>
                    Chọn gói và thời lượng phù hợp với nhu cầu của bạn
                  </Text>

                  <View style={styles.durationCardsContainer}>
                    {CLEANING_DURATIONS.map((dur) => {
                      const isSelected = selectedDurationHours === dur.hours;
                      return (
                        <Pressable
                          key={dur.hours}
                          style={[styles.durationCard, isSelected && styles.durationCardSelected]}
                          onPress={() => selectFavouritePackage(dur.hours)}>
                          <View style={styles.durationCardHeader}>
                            <View style={styles.durationTitleGroup}>
                              <Text
                                style={[
                                  styles.durationHoursText,
                                  isSelected && styles.durationHoursTextSelected,
                                ]}>
                                {dur.title}
                              </Text>
                              <View style={[styles.durationClockBadge, isSelected && styles.areaBadgeSelected]}>
                                <IconSymbol name="clock" size={14} color={isSelected ? BrandColors.primaryDark : BrandColors.gray600} />
                              </View>
                              {!!dur.area && <View style={[styles.areaBadge, isSelected && styles.areaBadgeSelected]}>
                                <Text
                                  style={[
                                    styles.areaBadgeText,
                                    isSelected && styles.areaBadgeTextSelected,
                                  ]}>
                                  {dur.area}
                                </Text>
                              </View>}
                            </View>
                            {dur.isPopular && (
                              <View style={styles.popularBadge}>
                                <Text style={styles.popularBadgeText}>Phổ biến nhất</Text>
                              </View>
                            )}
                          </View>

                          <Text style={styles.durationUnitType}>{dur.unitType}</Text>
                          <Text style={styles.durationDesc}>{dur.desc}</Text>

                          <View style={styles.durationCardFooter}>
                            <Text
                              style={[
                                styles.durationPriceText,
                                isSelected && styles.durationPriceTextSelected,
                              ]}>
                              {formatVND(dur.price)}
                            </Text>
                            <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                              {isSelected && <View style={styles.radioInnerDot} />}
                            </View>
                          </View>
                        {isSelected && !!selectionWarning && selectionTimingNotice?.kind!=='EXTRAS' && <View style={styles.selectionWarningBox}><Text accessibilityRole="alert" style={styles.selectionWarningText}>{selectionWarning}</Text></View>}
                        </Pressable>
                      );
                    })}
                  </View>

                  <SmartExtras
                    warning={favouriteIssue || (selectionTimingNotice?.kind==='EXTRAS'?selectionWarning:undefined)}
                    key={service.id}
                    options={selectedMode==='MODE_A'?extraOptions.filter(option=>option.kind!=='SERVICE'||pickedStaff?.eligibleServices?.some(skill=>skill.id===option.id)):extraOptions}
                    selectedKeys={selectedExtraKeys}
                    onToggle={toggleExtra}
                    onClear={() => setSelectedExtraKeys([])}
                  />
                </ScrollView>

                {/* USER REQUIREMENT 4: DƯỚI NÚT TIẾP THEO CÓ HIỂN THỊ SỐ TIỀN ƯỚC TÍNH LUÔN CẬP NHẬT KHI THÊM BỚT ADDON */}
                <View style={styles.bottomBarWithEstimate}>
                  <View style={styles.estimateCol}>
                    <Text style={styles.estimateLabel}>Tạm tính ước tính:</Text>
                    <Text style={styles.estimateAmountVal}>{formatVND(subtotal)}</Text>
                    <Text style={styles.estimateNoteText}>
                      {selectedDurationHours} giờ • {service.name} ({formatVND(basePrice)})
                      {extraTotals.selected.length > 0 ? ` + ${extraTotals.selected.length} mục chọn thêm` : ' • Không chọn thêm'}
                    </Text>
                    {!!selectionWarning && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.selectionWarningText}>{selectionTimingNotice?.title || selectionWarning}{selectionTimingNotice?.kind==='EXTRAS'?' · Bỏ bớt dịch vụ thêm.':selectionTimingNotice?.kind==='PACKAGE'?' · Chọn gói ngắn hơn.':selectionTimingNotice?.kind==='DATE'||selectionTimingNotice?.kind==='TIME'?' · Chọn lại ngày giờ.':''}</Text>}
                  </View>
                  <Pressable
                    style={styles.ctaEstimateBtn}
                    onPress={() => triggerStepTransition(6)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiếp tục (Tóm tắt) ›</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 6: TÓM TẮT ĐƠN HÀNG & MÃ GIẢM GIÁ (Mode A) ----------------
    if (currentStep === 6) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Tóm tắt đơn hàng', 6, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  {/* Selected Staff Card */}
                  <View style={styles.summaryStaffCard}>
                    <Image source={remoteImageSource(selectedStaff.avatar)} style={styles.summaryStaffAvatar} />
                    <View style={styles.summaryStaffMeta}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.summaryStaffName}>{selectedStaff.fullName}</Text>
                        <Badge label="Tự chọn nhân viên" variant="primary" size="sm" />
                      </View>
                      <Text style={styles.summaryStaffSub}>
                        {staffAgeLabel(selectedStaff)} • {selectedStaff.rating}★
                      </Text>
                    </View>
                  </View>

                  {/* Schedule & Address Info */}
                  <View style={styles.summaryDetailCard}>
                    <View style={styles.summaryInfoRow}>
                      <IconSymbol name="calendar" size={18} color={BrandColors.primary} />
                      <Text style={styles.summaryInfoText}>
                        {selectedDateStr} lúc {selectedTimeSlot} ({selectedDurationHours} giờ dọn dẹp)
                      </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryInfoRow}>
                      <IconSymbol name="location" size={18} color={BrandColors.primary} />
                      <Text style={styles.summaryInfoText}>{selectedAddress.fullAddress}</Text>
                    </View>
                  </View>

                  {/* Integrated Voucher Section */}
                  {renderVoucherSectionInSummary()}

                  {/* Price Breakdown with realtime discount */}
                  <View style={styles.priceBreakdownCard}>
                    <Text style={styles.priceBreakdownTitle}>Chi tiết thanh toán</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceKey}>Dọn dẹp ca lẻ ({selectedDurationHours} giờ)</Text>
                      <Text style={styles.priceVal}>{formatVND(basePrice)}</Text>
                    </View>
                    {addOnsTotal > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceKey}>Dịch vụ bổ trợ ({selectedAddOnIds.length})</Text>
                        <Text style={styles.priceVal}>+{formatVND(addOnsTotal)}</Text>
                      </View>
                    )}
                    {relatedServicesTotal > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceKey}>Dịch vụ liên quan ({selectedRelatedServiceIds.length})</Text>
                        <Text style={styles.priceVal}>+{formatVND(relatedServicesTotal)}</Text>
                      </View>
                    )}
                    {discountAmount > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceKeyDiscount}>
                          Ưu đãi giảm giá ({selectedPromoCode})
                        </Text>
                        <Text style={styles.priceValDiscount}>-{formatVND(discountAmount)}</Text>
                      </View>
                    )}
                    <View style={styles.priceRow}>
                      <Text style={styles.priceKey}>VAT & Phí dịch vụ</Text>
                      <Text style={styles.priceVal}>Đã bao gồm</Text>
                    </View>
                    <View style={styles.priceDivider} />
                    <View style={styles.priceTotalRow}>
                      <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                      <Text style={styles.totalAmount}>{quote ? formatVND(totalAmount) : 'Chờ báo giá'}</Text>
                    </View>
                  </View>

                  {/* Customer Notes Field */}
                  <View style={styles.noteInputCard}>
                    <Text style={styles.noteInputLabel}>Ghi chú cho nhân viên (Tùy chọn)</Text>
                    <TextInput
                      style={styles.noteTextInput}
                      placeholder="Ví dụ: Căn hộ tầng 8, nhà có mèo, vui lòng gọi trước 10 phút..."
                      placeholderTextColor="#9CA3AF"
                      value={customerNote}
                      onChangeText={setCustomerNote}
                      multiline
                    />
                  </View>
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(7)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiến hành thanh toán</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 7: PHƯƠNG THỨC THANH TOÁN (Mode A) ----------------
    if (currentStep === 7) {
      const paymentMethods: { id: PaymentMethod; name: string; desc: string; icon: string }[] = [
        {
          id: 'VNPAY',
          name: 'VNPay (Quét mã QR)',
          desc: 'Thanh toán trực tiếp qua ứng dụng ngân hàng',
          icon: 'creditCard',
        },
        {
          id: 'MOMO',
          name: 'Ví MoMo',
          desc: 'Liên kết ví điện tử MoMo siêu tốc',
          icon: 'wallet',
        },
        {
          id: 'ZALOPAY',
          name: 'Ví ZaloPay',
          desc: 'Thanh toán an toàn qua ZaloPay',
          icon: 'wallet',
        },
        {
          id: 'CASH',
          name: 'Tiền mặt',
          desc: 'Thanh toán cho nhân viên sau khi hoàn thành',
          icon: 'cash',
        },
      ];

      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Phương thức thanh toán', 7, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.sectionHeaderTitle}>Chọn cổng thanh toán</Text>

                  {paymentMethods.map((pm) => {
                    const isSelected = pm.id === paymentMethod;
                    return (
                      <Pressable
                        key={pm.id}
                        style={[
                          styles.paymentMethodCard,
                          isSelected && styles.paymentMethodCardSelected,
                        ]}
                        onPress={() => setPaymentMethod(pm.id)}>
                        <View
                          style={[
                            styles.paymentIconBox,
                            isSelected && styles.paymentIconBoxSelected,
                          ]}>
                          <IconSymbol
                            name={pm.icon}
                            size={22}
                            color={isSelected ? BrandColors.primary : BrandColors.gray700}
                          />
                        </View>
                        <View style={styles.paymentInfo}>
                          <Text style={styles.paymentName}>{pm.name}</Text>
                          <Text style={styles.paymentDesc}>{pm.desc}</Text>
                        </View>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioInnerDot} />}
                        </View>
                      </Pressable>
                    );
                  })}

                  {/* Guarantee banner */}
                  <View style={styles.guaranteeBox}>
                    <IconSymbol name="shield" size={24} color={BrandColors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.guaranteeTitle}>Hỗ trợ xử lý phản hồi</Text>
                      <Text style={styles.guaranteeDesc}>
                        Phản hồi sẽ được tiếp nhận và xử lý theo kết quả nghiệm thu và giao dịch thực tế.
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    disabled={saving || !quote} onPress={() => void submitBooking()}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Xác nhận & Đặt ca ({quote ? formatVND(totalAmount) : 'Chờ báo giá'})</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 8: CHỜ XÁC NHẬN TỪ NHÂN VIÊN (Mode A) ----------------
    if (currentStep === 8 && createdBooking) return <StaffResponseWaiting bookingId={createdBooking.id} />;

    // ---------------- STEP 9: ĐẶT LỊCH THÀNH CÔNG (Mode A) ----------------
    if (currentStep === 9) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView contentContainerStyle={styles.successContent} showsVerticalScrollIndicator={false}>
              {/* Animated Success Checkmark */}
              <Animated.View style={[styles.successCheckCircle, { transform: [{ scale: successScaleAnim }] }]}>
                <IconSymbol name="check" size={48} color="#FFFFFF" />
              </Animated.View>

              <Text style={styles.successHeading}>ĐẶT LỊCH THÀNH CÔNG!</Text>
              <Text style={styles.successSubheading}>
                {selectedStaff.fullName} đã tiếp nhận đơn và sẽ có mặt đúng giờ hẹn.
              </Text>

              {/* Order Code Box */}
              <View style={styles.orderCodeBox}>
                <View>
                  <Text style={styles.orderCodeLabel}>MÃ ĐƠN HÀNG</Text>
                  <Text style={styles.orderCodeVal}>{createdBooking?.bookingCode}</Text>
                </View>
                <Pressable
                  style={styles.copyBtn}
                  onPress={() => handleCopyCode(createdBooking?.bookingCode || '')}>
                  <IconSymbol name="copy" size={16} color={BrandColors.primary} />
                  <Text style={styles.copyBtnText}>{isCopied ? 'Đã chép ✓' : 'Sao chép'}</Text>
                </Pressable>
              </View>

              {/* Summary Card */}
              <View style={styles.successDetailCard}>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Nhân viên</Text>
                  <Text style={styles.successValBold}>{selectedStaff.fullName}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Thời gian</Text>
                  <Text style={styles.successVal}>
                    {selectedDateStr} • {selectedTimeSlot} ({selectedDurationHours} giờ)
                  </Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Địa chỉ</Text>
                  <Text style={styles.successVal}>{selectedAddress.fullAddress}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Tổng thanh toán</Text>
                  <Text style={styles.successTotal}>{quote ? formatVND(totalAmount) : 'Chờ báo giá'}</Text>
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.successBtnColumn}>
                <Pressable
                  style={styles.ctaPrimaryBtn}
                  onPress={() => router.push('/booking/bk-001')}>
                  <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                    <Text style={styles.ctaPrimaryText}>Theo dõi ca làm việc</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={styles.ctaSecondaryBtn}
                  onPress={() => router.replace('/(tabs)')}>
                  <Text style={styles.ctaSecondaryText}>Về trang chủ</Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      );
    }
  }

  // =========================================================================
  // ===================== LUỒNG MODE B: CHỌN DỊCH VỤ =========================
  // =========================================================================
  if (selectedMode === 'MODE_B') {
    // ---------------- STEP 0: GÓI DIỆN TÍCH & SỐ LƯỢNG NHÂN VIÊN (Mode B) ----------------
    if (currentStep === 0) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Gói diện tích & Số lượng', 0, 8)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  {/* Selected service banner */}
                  <View style={styles.selectedServiceHeaderCard}>
                    <Image source={remoteImageSource(service.image)} style={styles.selectedServiceHeaderImg} />
                    <View style={styles.selectedServiceHeaderMeta}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.selectedServiceHeaderName}>{service.name}</Text>
                        <Badge label="Dịch vụ đã chọn" variant="success" size="sm" />
                      </View>
                      <Text style={styles.selectedServiceHeaderPrice}>
                        Giá từ {formatVND(service.basePrice)} / {service.unit}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.sectionHeaderTitle}>Chọn gói diện tích</Text>
                  <ServiceQuestions fields={catalog.details.find(d=>String(d.service.id)===service.id)?.requirements || []} values={answers} change={setAnswers} />
                  {packages.map((pkg) => {
                    const isSelected = pkg.id === selectedPackageId;
                    return (
                      <Pressable
                        key={pkg.id}
                        style={[styles.packageCard, isSelected && styles.packageCardSelected]}
                        onPress={() => setSelectedPackageId(pkg.id)}>
                        <View style={styles.packageCardLeft}>
                          <Text style={styles.packageName}>{pkg.name}</Text>
                          <Text style={styles.packageDuration}>
                            Thời lượng: {pkg.durationHours} giờ ({pkg.maxArea || 'Tiêu chuẩn'})
                          </Text>
                        </View>
                        <View style={styles.packageCardRight}>
                          <Text style={styles.packagePrice}>{formatVND(pkg.price)}</Text>
                          <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                            {isSelected && <View style={styles.radioInnerDot} />}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}

                  {/* Staff count stepper */}
                  <Text style={[styles.sectionHeaderTitle, { marginTop: Spacing.four }]}>Số lượng nhân viên</Text>
                  <View style={styles.stepperCard}>
                    <View style={styles.stepperHeaderBadge}>
                      <IconSymbol name="users" size={18} color={BrandColors.primary} />
                      <Text style={styles.stepperLabel}>Số người thực hiện</Text>
                    </View>
                    <View style={styles.stepperControlRow}>
                      <Pressable
                        style={[styles.stepperBtn, requiredStaffCount <= 1 && styles.stepperBtnDisabled]}
                        onPress={() => setRequiredStaffCount(Math.max(1, requiredStaffCount - 1))}
                        hitSlop={8}>
                        <IconSymbol name="minus" size={18} color={BrandColors.primary} />
                      </Pressable>
                      <Text style={styles.stepperValue}>{requiredStaffCount} người</Text>
                      <Pressable
                        style={styles.stepperBtn}
                        onPress={() => setRequiredStaffCount(requiredStaffCount + 1)}
                        hitSlop={8}>
                        <IconSymbol name="plus" size={18} color={BrandColors.primary} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.recommendationBox}>
                    <Text style={styles.recommendationText}>
                      💡 1 nhân viên phù hợp tối ưu với căn hộ dưới 55m². Thêm nhân viên giúp hoàn thành ca nhanh gấp đôi.
                    </Text>
                  </View>
                </ScrollView>

                {/* USER CONSTRAINT: Step 2 is Add-on, right after package & staff count */}
                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(1)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiếp tục (Chọn Add-on)</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 1: DỊCH VỤ BỔ SUNG (ADD-ON) (Mode B) ----------------
    // Đã đẩy lên ngay sau diện tích theo yêu cầu user
    // Thêm ô "Không chọn" và thanh bottom bar ước tính giá cập nhật real-time
    if (currentStep === 1) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Dịch vụ bổ sung (Add-on)', 1, 8)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  <SmartExtras
                    key={service.id}
                    options={extraOptions}
                    selectedKeys={selectedExtraKeys}
                    onToggle={toggleExtra}
                    onClear={() => setSelectedExtraKeys([])}
                  />
                </ScrollView>

                {/* USER REQUIREMENT: Hiển thị số tiền ước tính cập nhật real-time */}
                <View style={styles.bottomBarWithEstimate}>
                  <View style={styles.estimateCol}>
                    <Text style={styles.estimateLabel}>Tạm tính ước tính:</Text>
                    <Text style={styles.estimateAmountVal}>{formatVND(subtotal)}</Text>
                    <Text style={styles.estimateNoteText}>
                      Gói {selectedPackage.name}
                      {extraTotals.selected.length > 0 ? ` + ${extraTotals.selected.length} mục chọn thêm` : ' • Không chọn thêm'}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.ctaEstimateBtn}
                    onPress={() => triggerStepTransition(2)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiếp tục (Địa chỉ) ›</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 2: CHỌN ĐỊA CHỈ (Mode B) ----------------
    if (currentStep === 2) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Địa chỉ làm việc', 2, 8)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.sectionHeaderTitle}>Địa chỉ đã lưu</Text>

                  {addresses.map((addr) => {
                    const isSelected = addr.id === selectedAddressId;
                    const isHome = addr.title.toLowerCase().includes('nhà');
                    const isOffice =
                      addr.title.toLowerCase().includes('việc') || addr.title.toLowerCase().includes('ty');
                    return (
                      <Pressable
                        key={addr.id}
                        style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                        onPress={() => setSelectedAddressId(addr.id)}>
                        <View
                          style={[styles.addressIconCircle, isSelected && styles.addressIconCircleSelected]}>
                          <IconSymbol
                            name={isHome ? 'home' : isOffice ? 'office' : 'location'}
                            size={22}
                            color={isSelected ? BrandColors.primary : BrandColors.gray600}
                          />
                        </View>
                        <View style={styles.addressInfo}>
                          <View style={styles.addressTitleRow}>
                            <Text style={styles.addressTitle}>{addr.title}</Text>
                            {addr.isDefault && (
                              <View style={styles.defaultPill}>
                                <Text style={styles.defaultPillText}>Mặc định</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.addressDetail}>{addr.fullAddress}</Text>
                        </View>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioInnerDot} />}
                        </View>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    style={styles.addAddressDashedBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/account/addresses',
                        params: {
                          fromBooking: '1',
                          mode: selectedMode || undefined,
                          serviceId: service.id,
                        },
                      })
                    }>
                    <IconSymbol name="plus" size={16} color={BrandColors.primary} />
                    <Text style={styles.addAddressDashedText}>Thêm địa chỉ mới</Text>
                  </Pressable>
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(3)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiếp tục (Chọn ngày & giờ)</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 3: CHỌN NGÀY & GIỜ (Mode B) ----------------
    if (currentStep === 3) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Chọn ngày & giờ', 3, 8)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  {/* Calendar */}
                  <View style={styles.calendarCard}>
                    <View style={styles.calendarHeader}>
                      <View style={styles.calendarMonthWrapper}>
                        <IconSymbol name="calendar" size={18} color={BrandColors.primary} />
                        <Text style={styles.calendarMonthText}>{new Date(selectedDateIso+'T12:00:00+07:00').toLocaleDateString('vi-VN',{month:'long',year:'numeric'})}</Text>
                      </View>
                      <View style={styles.calendarArrows}>
                        <Pressable style={styles.arrowBtn} hitSlop={6}>
                          <Text style={styles.arrowText}>‹</Text>
                        </Pressable>
                        <Pressable style={styles.arrowBtn} hitSlop={6}>
                          <Text style={styles.arrowText}>›</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.calendarGrid}>
                      {CALENDAR_DAYS.map((day, idx) => {
                        const isSelected = day.iso === selectedDateIso;
                        return (
                          <Pressable
                            key={idx}
                            style={[styles.calendarDayCell, isSelected && styles.calendarDaySelected]}
                            disabled={!day.isCurrentMonth} onPress={() => {setSelectedDateStr(day.label);setSelectedDateIso(day.iso);}}>
                            <Text
                              style={[
                                styles.calendarDayName,
                                isSelected && styles.calendarDayTextSelected,
                              ]}>
                              {day.dayName}
                            </Text>
                            <Text
                              style={[
                                styles.calendarDayNum,
                                !day.isCurrentMonth && styles.calendarDayNumMuted,
                                isSelected && styles.calendarDayTextSelected,
                              ]}>
                              {day.dateNum}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <Text style={styles.sectionHeaderTitle}>Giờ bắt đầu làm việc</Text><Text style={styles.stepSubtitleNote}>Đặt trước tối thiểu 2 giờ • Làm việc trong 08:00–20:00. Giờ không hợp lệ được khóa.</Text>
                  <View style={styles.timeSlotGrid}>
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = slot === selectedTimeSlot;
                      const slotIssue=customerSlotIssue(selectedDateIso+'T'+slot+':00+07:00',timePickerMinutes,bookingClock);
                      return (
                        <Pressable
                          key={slot}
                          disabled={!!slotIssue} accessibilityState={{disabled:!!slotIssue,selected:isSelected}}
                          style={[styles.timeSlotPill, isSelected && styles.timeSlotPillSelected,!!slotIssue&&{opacity:0.35}]}
                          onPress={() => setSelectedTimeSlot(slot)}>
                          <IconSymbol
                            name="clock"
                            size={14}
                            color={isSelected ? BrandColors.white : BrandColors.gray500}
                          />
                          <Text
                            style={[
                              styles.timeSlotText,
                              isSelected && styles.timeSlotTextSelected,
                            ]}>
                            {slot}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.timeEstCard}>
                    <IconSymbol name="clock" size={18} color={BrandColors.primary} />
                    <Text style={styles.timeEstText}>
                      Thời lượng ước tính: {selectedPackage.durationHours} giờ
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(4)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiếp tục (Xem tóm tắt)</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 4: TÓM TẮT ĐƠN HÀNG & MÃ GIẢM GIÁ (Mode B) ----------------
    if (currentStep === 4) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Tóm tắt đơn hàng', 4, 8)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  {/* Service Card */}
                  <View style={styles.summaryStaffCard}>
                    <Image source={remoteImageSource(service.image)} style={styles.summaryStaffAvatar} />
                    <View style={styles.summaryStaffMeta}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.summaryStaffName}>{service.name}</Text>
                        <Badge label="Hệ thống điều phối" variant="primary" size="sm" />
                      </View>
                      <Text style={styles.summaryStaffSub}>
                        {selectedPackage.name} • {requiredStaffCount} nhân viên
                      </Text>
                    </View>
                  </View>

                  {/* Schedule & Address */}
                  <View style={styles.summaryDetailCard}>
                    <View style={styles.summaryInfoRow}>
                      <IconSymbol name="calendar" size={18} color={BrandColors.primary} />
                      <Text style={styles.summaryInfoText}>
                        {selectedDateStr} lúc {selectedTimeSlot} ({selectedPackage.durationHours} giờ)
                      </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryInfoRow}>
                      <IconSymbol name="location" size={18} color={BrandColors.primary} />
                      <Text style={styles.summaryInfoText}>{selectedAddress.fullAddress}</Text>
                    </View>
                  </View>

                  {/* Integrated Voucher Section */}
                  {renderVoucherSectionInSummary()}

                  {/* Price Breakdown */}
                  <View style={styles.priceBreakdownCard}>
                    <Text style={styles.priceBreakdownTitle}>Chi tiết thanh toán</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceKey}>Gói {selectedPackage.name}</Text>
                      <Text style={styles.priceVal}>{formatVND(selectedPackage.price)}</Text>
                    </View>
                    {requiredStaffCount > 1 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceKey}>Thêm nhân viên (+{requiredStaffCount - 1} người)</Text>
                        <Text style={styles.priceVal}>+{formatVND((requiredStaffCount - 1) * 150000)}</Text>
                      </View>
                    )}
                    {addOnsTotal > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceKey}>Dịch vụ bổ sung ({selectedAddOnIds.length})</Text>
                        <Text style={styles.priceVal}>+{formatVND(addOnsTotal)}</Text>
                      </View>
                    )}
                    {relatedServicesTotal > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceKey}>Dịch vụ liên quan ({selectedRelatedServiceIds.length})</Text>
                        <Text style={styles.priceVal}>+{formatVND(relatedServicesTotal)}</Text>
                      </View>
                    )}
                    {discountAmount > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceKeyDiscount}>
                          Ưu đãi giảm giá ({selectedPromoCode})
                        </Text>
                        <Text style={styles.priceValDiscount}>-{formatVND(discountAmount)}</Text>
                      </View>
                    )}
                    <View style={styles.priceRow}>
                      <Text style={styles.priceKey}>VAT & Phí dịch vụ</Text>
                      <Text style={styles.priceVal}>Đã bao gồm</Text>
                    </View>
                    <View style={styles.priceDivider} />
                    <View style={styles.priceTotalRow}>
                      <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                      <Text style={styles.totalAmount}>{quote ? formatVND(totalAmount) : 'Chờ báo giá'}</Text>
                    </View>
                  </View>

                  {/* Customer Notes */}
                  <View style={styles.noteInputCard}>
                    <Text style={styles.noteInputLabel}>Ghi chú cho người giúp việc (Tùy chọn)</Text>
                    <TextInput
                      style={styles.noteTextInput}
                      placeholder="Ví dụ: Vui lòng mang thêm găng tay cao su, nhà có trẻ nhỏ..."
                      placeholderTextColor="#9CA3AF"
                      value={customerNote}
                      onChangeText={setCustomerNote}
                      multiline
                    />
                  </View>
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(5)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiến hành thanh toán</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 5: PHƯƠNG THỨC THANH TOÁN (Mode B) ----------------
    if (currentStep === 5) {
      const paymentMethods: { id: PaymentMethod; name: string; desc: string; icon: string }[] = [
        {
          id: 'VNPAY',
          name: 'VNPay (Quét mã QR)',
          desc: 'Thanh toán trực tiếp qua ứng dụng ngân hàng',
          icon: 'creditCard',
        },
        {
          id: 'MOMO',
          name: 'Ví MoMo',
          desc: 'Liên kết ví điện tử MoMo siêu tốc',
          icon: 'wallet',
        },
        {
          id: 'ZALOPAY',
          name: 'Ví ZaloPay',
          desc: 'Thanh toán an toàn qua ZaloPay',
          icon: 'wallet',
        },
        {
          id: 'CASH',
          name: 'Tiền mặt',
          desc: 'Thanh toán cho nhân viên sau khi hoàn thành',
          icon: 'cash',
        },
      ];

      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Phương thức thanh toán', 5, 8)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.sectionHeaderTitle}>Chọn cổng thanh toán</Text>

                  {paymentMethods.map((pm) => {
                    const isSelected = pm.id === paymentMethod;
                    return (
                      <Pressable
                        key={pm.id}
                        style={[
                          styles.paymentMethodCard,
                          isSelected && styles.paymentMethodCardSelected,
                        ]}
                        onPress={() => setPaymentMethod(pm.id)}>
                        <View
                          style={[
                            styles.paymentIconBox,
                            isSelected && styles.paymentIconBoxSelected,
                          ]}>
                          <IconSymbol
                            name={pm.icon}
                            size={22}
                            color={isSelected ? BrandColors.primary : BrandColors.gray700}
                          />
                        </View>
                        <View style={styles.paymentInfo}>
                          <Text style={styles.paymentName}>{pm.name}</Text>
                          <Text style={styles.paymentDesc}>{pm.desc}</Text>
                        </View>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioInnerDot} />}
                        </View>
                      </Pressable>
                    );
                  })}

                  <View style={styles.guaranteeBox}>
                    <IconSymbol name="shield" size={24} color={BrandColors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.guaranteeTitle}>Cam kết dịch vụ hoàn hảo</Text>
                      <Text style={styles.guaranteeDesc}>
                        Được nghiệm thu chất lượng vệ sinh trước khi thanh toán. Hỗ trợ xử lý phản hồi theo kết quả nghiệm thu.
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(6)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>
                        Xác nhận & Tìm nhân viên ({quote ? formatVND(totalAmount) : 'Chờ báo giá'})
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 6: RADAR TÌM KIẾM NHÂN VIÊN (Mode B) ----------------
    if (currentStep === 6) {
      if (isModeBStaffAccepted && modeBMatchedStaff) {
        return (
          <LinearGradient
            colors={BrandColors.softBgGradient}
            locations={BrandColors.softBgGradientLocations}
            style={styles.gradientContainer}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
              <ScrollView contentContainerStyle={styles.matchAcceptedContent} showsVerticalScrollIndicator={false}>
                <View style={styles.matchAcceptedIcon}>
                  <IconSymbol name="check" size={34} color={BrandColors.white} />
                </View>
                <Text style={styles.matchAcceptedTitle}>ĐÃ CÓ NHÂN VIÊN NHẬN ĐƠN</Text>
                <Text style={styles.matchAcceptedSubtitle}>
                  Đơn của bạn đã được xác nhận. Nhân viên sẽ có mặt đúng khung giờ đã đặt.
                </Text>

                <View style={styles.matchedStaffCard}>
                  <View style={styles.matchedStaffCardHeader}>
                    <Text style={styles.matchedStaffLabel}>NHÂN VIÊN THỰC HIỆN</Text>
                    <View style={styles.matchedStaffVerified}>
                      <IconSymbol name="shield" size={12} color={BrandColors.primaryDark} />
                      <Text style={styles.matchedStaffVerifiedText}>Đã xác minh</Text>
                    </View>
                  </View>
                  <View style={styles.matchedStaffProfile}>
                    <Image source={remoteImageSource(modeBMatchedStaff.avatar)} style={styles.matchedStaffAvatar} />
                    <View style={styles.matchedStaffInfo}>
                      <Text style={styles.matchedStaffName}>{modeBMatchedStaff.fullName}</Text>
                      <Text style={styles.matchedStaffMeta}>
                        {modeBMatchedStaff.rating.toFixed(1)}★ • {modeBMatchedStaff.reviewCount} lượt đánh giá
                      </Text>
                      <Text style={styles.matchedStaffMeta}>
                        Hoàn thành {modeBMatchedStaff.completionRate}% đơn hàng
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.matchBookingCard}>
                  <Text style={styles.matchBookingCardTitle}>Thông tin ca làm</Text>
                  <View style={styles.matchBookingRow}>
                    <IconSymbol name="clean" size={16} color={BrandColors.primary} />
                    <Text style={styles.matchBookingText}>{service.name} • {selectedPackage.name}</Text>
                  </View>
                  <View style={styles.matchBookingRow}>
                    <IconSymbol name="calendar" size={16} color={BrandColors.primary} />
                    <Text style={styles.matchBookingText}>{selectedDateStr} lúc {selectedTimeSlot}</Text>
                  </View>
                  <View style={styles.matchBookingRow}>
                    <IconSymbol name="location" size={16} color={BrandColors.primary} />
                    <Text style={styles.matchBookingText} numberOfLines={2}>{selectedAddress.fullAddress}</Text>
                  </View>
                </View>

                <View style={styles.matchAcceptedNotice}>
                  <IconSymbol name="info" size={16} color="#1E40AF" />
                  <Text style={styles.matchAcceptedNoticeText}>
                    Bạn có thể nhắn tin hoặc gọi trong ứng dụng khi ca làm chuyển sang trạng thái đã xác nhận.
                  </Text>
                </View>

                <Pressable style={styles.matchHomeButton} onPress={() => router.replace('/')}>
                  <Text style={styles.matchHomeButtonText}>Về trang chủ</Text>
                </Pressable>
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        );
      }

      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.radarContainer}>
              {/* Multi-Wave Animated Radar */}
              <View style={styles.radarCenterArea}>
                <Animated.View
                  style={[
                    styles.radarWaveCircle,
                    { transform: [{ scale: radarWave1 }], opacity: radarOpacity1 },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.radarWaveCircle,
                    { transform: [{ scale: radarWave2 }], opacity: radarOpacity2 },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.radarWaveCircle,
                    { transform: [{ scale: radarWave3 }], opacity: radarOpacity3 },
                  ]}
                />

                <LinearGradient
                  colors={BrandColors.primaryGradient}
                  style={styles.radarCenterBeacon}>
                  <IconSymbol name="sparkles" size={32} color={BrandColors.white} />
                </LinearGradient>
              </View>

              <Text style={styles.radarTitle}>ĐANG TÌM KIẾM NHÂN VIÊN</Text>
              <Text style={styles.radarStatusText}>{radarStatusText}</Text>

              <View style={styles.radarInfoBox}>
                <View style={styles.radarInfoRow}>
                  <IconSymbol name="clean" size={16} color={BrandColors.primary} />
                  <Text style={styles.radarInfoRowText}>
                    {service.name} • {selectedPackage.name}
                  </Text>
                </View>
                <View style={styles.radarInfoRow}>
                  <IconSymbol name="location" size={16} color={BrandColors.primary} />
                  <Text style={styles.radarInfoRowText} numberOfLines={1}>
                    {selectedAddress.fullAddress}
                  </Text>
                </View>
              </View>

              <View style={styles.radarNoteBadge}>
                <Text style={styles.radarNoteText}>
                  Đơn đang chờ nhân viên phù hợp nhận trong luồng ứng dụng dành cho nhân viên.
                </Text>
              </View>

              {__DEV__ && (
                <Pressable
                  style={styles.matchPreviewButton}
                  onPress={() => setIsModeBStaffAccepted(true)}>
                  <Text style={styles.matchPreviewButtonText}>Xem trước khi nhân viên nhận đơn</Text>
                </Pressable>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 7: ĐẶT LỊCH THÀNH CÔNG (Mode B) ----------------
    if (currentStep === 7) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView contentContainerStyle={styles.successContent} showsVerticalScrollIndicator={false}>
              <Animated.View style={[styles.successCheckCircle, { transform: [{ scale: successScaleAnim }] }]}>
                <IconSymbol name="check" size={48} color="#FFFFFF" />
              </Animated.View>

              <Text style={styles.successHeading}>ĐẶT LỊCH THÀNH CÔNG!</Text>
              <Text style={styles.successSubheading}>
                Đơn hàng đã được kết nối thành công với đối tác uy tín của CleanMaster.
              </Text>

              {/* Order Code Box */}
              <View style={styles.orderCodeBox}>
                <View>
                  <Text style={styles.orderCodeLabel}>MÃ ĐƠN HÀNG</Text>
                  <Text style={styles.orderCodeVal}>{createdBooking?.bookingCode}</Text>
                </View>
                <Pressable
                  style={styles.copyBtn}
                  onPress={() => handleCopyCode(createdBooking?.bookingCode || '')}>
                  <IconSymbol name="copy" size={16} color={BrandColors.primary} />
                  <Text style={styles.copyBtnText}>{isCopied ? 'Đã chép ✓' : 'Sao chép'}</Text>
                </Pressable>
              </View>

              {/* Summary Card */}
              <View style={styles.successDetailCard}>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Dịch vụ</Text>
                  <Text style={styles.successValBold}>{service.name}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Gói diện tích</Text>
                  <Text style={styles.successVal}>
                    {selectedPackage.name} ({requiredStaffCount} người)
                  </Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Thời gian</Text>
                  <Text style={styles.successVal}>
                    {selectedDateStr} • {selectedTimeSlot}
                  </Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Địa chỉ</Text>
                  <Text style={styles.successVal}>{selectedAddress.fullAddress}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Tổng thanh toán</Text>
                  <Text style={styles.successTotal}>{quote ? formatVND(totalAmount) : 'Chờ báo giá'}</Text>
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.successBtnColumn}>
                <Pressable
                  style={styles.ctaPrimaryBtn}
                  onPress={() => router.push('/booking/bk-002')}>
                  <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                    <Text style={styles.ctaPrimaryText}>Theo dõi tiến độ đơn</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={styles.ctaSecondaryBtn}
                  onPress={() => router.replace('/(tabs)')}>
                  <Text style={styles.ctaSecondaryText}>Về trang chủ</Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      );
    }
  }

  return null;
}

const styles = StyleSheet.create({
  retrySummary: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 8, marginBottom: 14 },
  retryHeading: { fontSize: 14, fontWeight: '700', color: '#334155' },
  retryText: { fontSize: 13, lineHeight: 19, color: '#475569' },
  previousStaff: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  previousStaffText: { color: '#92400E', fontSize: 12, lineHeight: 18 },
  retryCancel: { padding: 12, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#FECACA' },
  retryCancelText: { color: '#B91C1C', fontSize: 13, fontWeight: '700' },
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // State Screens (Loading, Error, Empty, Login)
  stateCenterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: 12,
  },
  stateIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BrandColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.gray900,
    textAlign: 'center',
  },
  stateLoadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.gray800,
    marginTop: 12,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 13,
    color: BrandColors.gray600,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
    marginBottom: 8,
  },
  statePrimaryBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 260,
    marginTop: 8,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  stateGradientBtn: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statePrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stateBackBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  stateBackBtnText: {
    color: BrandColors.gray600,
    fontSize: 13,
    fontWeight: '600',
  },

  // Header styles
  headerWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.two,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  headerStepBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.primaryDark,
    marginTop: 2,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: BrandColors.danger,
  },
  progressBarTrack: {
    width: '100%',
    height: 3.5,
    backgroundColor: 'rgba(0, 176, 116, 0.12)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: BrandColors.primary,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },

  stepContainer: {
    flex: 1,
  },
  stepContent: {
    padding: Spacing.three,
    paddingBottom: 110,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: Spacing.two,
  },
  stepSubtitleNote: {
    fontSize: 13,
    color: BrandColors.gray600,
    marginBottom: Spacing.three,
  },

  // Flow 0: Entry screen
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.primary,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.primaryDark,
  },
  giftBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  giftBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  entryContent: {
    padding: Spacing.three,
    paddingBottom: 40,
  },
  entryBanner: {
    height: 180,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  entryBannerImage: {
    width: '100%',
    height: '100%',
  },
  entryBannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
    padding: Spacing.three,
  },
  bannerTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: 6,
  },
  bannerTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandColors.white,
    letterSpacing: 0.5,
  },
  entryBannerHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: BrandColors.white,
    marginBottom: 4,
  },
  entryBannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  entryQuestion: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: Spacing.three,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.three,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modeCardActive: {
    borderColor: BrandColors.primary,
    backgroundColor: '#FFFFFF',
  },
  modeIconCircleTeal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modeCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  modeBadgeModeA: {
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  modeBadgeTextA: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  modeBadgeModeB: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  modeBadgeTextB: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  modeCardSubtitle: {
    fontSize: 12,
    color: BrandColors.gray600,
    lineHeight: 16,
  },
  trustBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: Spacing.two,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
    paddingVertical: 6,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray700,
  },

  // Address Step
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.two,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  addressCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  addressIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two,
  },
  addressIconCircleSelected: {
    backgroundColor: '#FFFFFF',
  },
  addressInfo: {
    flex: 1,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  defaultPill: {
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  defaultPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  addressDetail: {
    fontSize: 12,
    color: BrandColors.gray600,
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.two,
  },
  radioCircleSelected: {
    borderColor: BrandColors.primary,
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BrandColors.primary,
  },
  addAddressDashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: BrandColors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginTop: Spacing.two,
  },
  addAddressDashedText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },

  // Notice & Auto Filter Banners
  matchingNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: BrandColors.primaryLight,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: Spacing.three,
  },
  matchingNoticeText: {
    flex: 1,
    fontSize: 12,
    color: BrandColors.primaryDark,
    lineHeight: 18,
  },
  autoFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  autoFilterText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.primaryDark,
  },

  // Filter Section on top of Staff List
  filterSectionWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterChipScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
  },
  filterCategoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.gray500,
    marginRight: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.gray700,
  },
  filterChipTextActive: {
    color: BrandColors.white,
  },

    // Top Staff Notice
  topStaffNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.two,
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
  },
  topStaffNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },

  // Big Staff Card - Spacious, Clean & Premium
  bigStaffCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  bigStaffCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDFA',
  },
  bigStaffTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bigAvatarBox: {
    position: 'relative',
  },
  bigAvatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2E8F0',
  },
  bigOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: BrandColors.success,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bigStaffInfoCol: {
    flex: 1,
  },
  bigStaffNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  bigStaffFullName: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  bigVerifiedPill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bigVerifiedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  bigStaffMetaText: {
    fontSize: 12,
    color: BrandColors.gray600,
    marginBottom: 3,
  },
  bigRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bigRatingBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  bigReviewCount: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  bigSpecialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  bigSpecialtyPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bigSpecialtyPillText: {
    fontSize: 11,
    color: BrandColors.gray700,
    fontWeight: '600',
  },
  bigStaffBio: {
    fontSize: 12,
    color: BrandColors.gray600,
    fontStyle: 'italic',
    lineHeight: 17,
    marginTop: 8,
  },
  bigStaffDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  bigStaffFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bigPriceLabel: {
    fontSize: 10,
    color: BrandColors.gray500,
    fontWeight: '500',
  },
  bigPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  bigPriceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: BrandColors.primary,
  },
  bigPriceUnit: {
    fontSize: 11,
    color: BrandColors.gray500,
    fontWeight: '600',
  },
  bigSelectBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  bigSelectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  emptyFilterBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyFilterText: {
    fontSize: 13,
    color: BrandColors.gray500,
    marginTop: 8,
    marginBottom: 12,
  },
  resetFilterBtn: {
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  resetFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },

  // Staff Detail (Mode A Step 3)
  detailProfileHeader: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailLargeAvatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.two,
  },
  detailLargeAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: BrandColors.primary,
  },
  verifiedBadgeCircle: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  detailFullName: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: 4,
  },
  detailAge: {
    fontSize: 14,
    fontWeight: '400',
    color: BrandColors.gray500,
  },
  detailTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  detailExpText: {
    fontSize: 12,
    color: BrandColors.gray600,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.three,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: BrandColors.gray500,
  },
  bioCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bioHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.two,
  },
  bioHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  bioContent: {
    fontSize: 13,
    color: BrandColors.gray600,
    lineHeight: 18,
  },
  skillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillPillLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  skillPillLargeText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.primaryDark,
  },
  reviewSnippet: {
    backgroundColor: '#F9FAFB',
    padding: Spacing.two,
    borderRadius: BorderRadius.md,
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  reviewSnippetText: {
    fontSize: 12,
    color: BrandColors.gray600,
    fontStyle: 'italic',
  },
  securityNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: Spacing.three,
  },
  securityNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    lineHeight: 16,
  },

  // Calendar & Time
  calendarCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.three,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  calendarMonthWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarMonthText: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  calendarArrows: {
    flexDirection: 'row',
    gap: 6,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 16,
    color: BrandColors.gray700,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDayCell: {
    width: '13.5%',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    marginBottom: 6,
  },
  calendarDaySelected: {
    backgroundColor: BrandColors.primary,
  },
  calendarDayName: {
    fontSize: 10,
    color: BrandColors.gray500,
    marginBottom: 2,
  },
  calendarDayNum: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  calendarDayNumMuted: {
    color: '#D1D5DB',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.three,
  },
  timeSlotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '31%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
  },
  timeSlotPillSelected: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.gray800,
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  timeEstCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BrandColors.primaryLight,
    padding: Spacing.two,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: Spacing.three,
  },
  timeEstText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.primaryDark,
  },

  // USER REQUIREMENT 1: Cards for 2h, 3h, 4h Cleaning Durations
  durationCardsContainer: {
    marginBottom: Spacing.two,
    gap: 8,
  },
  durationCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  durationCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  durationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  durationTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationHoursText: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  durationHoursTextSelected: {
    color: BrandColors.primaryDark,
  },
  durationClockBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  areaBadgeSelected: {
    backgroundColor: '#A7F3D0',
  },
  areaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.gray700,
  },
  areaBadgeTextSelected: {
    color: BrandColors.primaryDark,
  },
  popularBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  durationUnitType: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray800,
    marginBottom: 2,
  },
  durationDesc: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginBottom: 8,
  },
  durationCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 6,
  },
  durationPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  durationPriceTextSelected: {
    color: BrandColors.primary,
  },

  // Add-ons
  addonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.two,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  addonCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  addonImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.three,
  },
  addonInfo: {
    flex: 1,
  },
  addonName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  addonDuration: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginBottom: 4,
  },
  addonPriceBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.two,
  },
  checkboxCircleSelected: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // USER REQUIREMENT 2: Ô "Không chọn" dịch vụ bổ sung
  noAddonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  noAddonCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  noAddonIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two,
  },
  noAddonIconCircleSelected: {
    backgroundColor: '#FFFFFF',
  },
  noAddonInfo: {
    flex: 1,
  },
  noAddonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  noAddonSubtitle: {
    fontSize: 11,
    color: BrandColors.gray500,
    lineHeight: 15,
  },

  selectionWarningBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginTop: 10 },
  selectionWarningText: { color: '#B91C1C', fontSize: 12, lineHeight: 18, marginTop: 5 },

  // USER REQUIREMENT 3: Thanh bottom bar có hiển thị số tiền ước tính cập nhật real-time
  bottomBarWithEstimate: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.85)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  estimateCol: {
    flex: 1,
    marginRight: Spacing.two,
  },
  estimateLabel: {
    fontSize: 11,
    color: BrandColors.gray500,
    fontWeight: '500',
  },
  estimateAmountVal: {
    fontSize: 19,
    fontWeight: '900',
    color: BrandColors.primary,
    letterSpacing: -0.5,
  },
  estimateNoteText: {
    fontSize: 10,
    color: BrandColors.gray500,
    marginTop: 1,
  },
  ctaEstimateBtn: {
    minWidth: 165,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },

  // Voucher Section Integrated into Order Summary
  summaryVoucherSection: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.three,
  },
  summaryVoucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.two,
  },
  summaryVoucherHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.two,
  },
  promoInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    fontSize: 13,
    color: BrandColors.gray900,
  },
  promoApplyBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  promoApplyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voucherHorizontalList: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  miniVoucherCard: {
    width: 145,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniVoucherCardSelected: {
    backgroundColor: BrandColors.primaryLight,
    borderColor: BrandColors.primary,
  },
  miniVoucherTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniVoucherCode: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.gray800,
  },
  miniVoucherCodeSelected: {
    color: BrandColors.primaryDark,
  },
  miniVoucherBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
  },
  miniVoucherBadgeSelected: {
    backgroundColor: BrandColors.primary,
  },
  miniVoucherBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  miniVoucherBadgeTextSelected: {
    color: '#FFFFFF',
  },
  miniVoucherDesc: {
    fontSize: 10,
    color: BrandColors.gray500,
    marginBottom: 6,
  },
  miniVoucherAction: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.gray600,
  },
  miniVoucherActionSelected: {
    color: BrandColors.primaryDark,
  },

  // Summary
  summaryStaffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.three,
  },
  summaryStaffAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: Spacing.two,
  },
  summaryStaffMeta: {
    flex: 1,
  },
  summaryStaffName: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  summaryStaffSub: {
    fontSize: 12,
    color: BrandColors.gray600,
  },
  summaryDetailCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.three,
  },
  summaryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  summaryInfoText: {
    flex: 1,
    fontSize: 13,
    color: BrandColors.gray800,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 6,
  },
  priceBreakdownCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.three,
  },
  priceBreakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: Spacing.two,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  priceKey: {
    fontSize: 13,
    color: BrandColors.gray600,
  },
  priceVal: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.gray800,
  },
  priceKeyDiscount: {
    fontSize: 13,
    color: BrandColors.success,
  },
  priceValDiscount: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.success,
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: Spacing.two,
  },
  priceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  noteInputCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.three,
  },
  noteInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.gray800,
    marginBottom: 6,
  },
  noteTextInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    padding: Spacing.two,
    fontSize: 12,
    color: BrandColors.gray900,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  // Payment
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.two,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  paymentMethodCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  paymentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  paymentIconBoxSelected: {
    backgroundColor: '#FFFFFF',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  paymentDesc: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  guaranteeBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F0FDF4',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: Spacing.two,
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 2,
  },
  guaranteeDesc: {
    fontSize: 11,
    color: '#15803D',
    lineHeight: 16,
  },

  // Mode A Waiting Screen
  waitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  clockAnimBox: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: Spacing.four,
  },
  clockCircleBorder: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: BrandColors.primary,
  },
  waitingAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  waitingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandColors.gray900,
    textAlign: 'center',
    marginBottom: 6,
  },
  waitingSubtitle: {
    fontSize: 13,
    color: BrandColors.gray600,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.four,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  policyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  policyNoticeText: {
    flex: 1,
    fontSize: 11,
    color: BrandColors.gray600,
    lineHeight: 16,
  },

  // Mode B: Service Cards with Image
  serviceCardWithImg: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.three,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  serviceCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  serviceImgThumb: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.three,
  },
  serviceBody: {
    flex: 1,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  serviceTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  serviceDescText: {
    fontSize: 12,
    color: BrandColors.gray600,
    lineHeight: 16,
    marginBottom: 4,
  },
  serviceFooterRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  servicePriceVal: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  serviceUnitText: {
    fontSize: 11,
    color: BrandColors.gray500,
  },

  selectedServiceHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: 12,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedServiceHeaderImg: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
  },
  selectedServiceHeaderMeta: {
    flex: 1,
  },
  selectedServiceHeaderName: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  selectedServiceHeaderPrice: {
    fontSize: 13,
    color: BrandColors.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },

  // Package Card (Mode B)
  packageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.two,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  packageCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  packageCardLeft: {
    flex: 1,
  },
  packageName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  packageDuration: {
    fontSize: 12,
    color: BrandColors.gray500,
  },
  packageCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  packagePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  stepperCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.two,
  },
  stepperHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  stepperControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BrandColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.gray900,
    minWidth: 50,
    textAlign: 'center',
  },
  recommendationBox: {
    backgroundColor: '#EFF6FF',
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: Spacing.two,
  },
  recommendationText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },

  // Radar Screen (Mode B)
  radarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  radarCenterArea: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: Spacing.four,
  },
  radarWaveCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 176, 116, 0.15)',
    borderWidth: 1.5,
    borderColor: BrandColors.primary,
  },
  radarCenterBeacon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  radarTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: BrandColors.gray900,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  radarStatusText: {
    fontSize: 13,
    color: BrandColors.gray600,
    marginBottom: Spacing.four,
    textAlign: 'center',
  },
  radarInfoBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.three,
  },
  radarInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  radarInfoRowText: {
    flex: 1,
    fontSize: 12,
    color: BrandColors.gray800,
  },
  radarNoteBadge: {
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  radarNoteText: {
    fontSize: 11,
    color: BrandColors.primaryDark,
    textAlign: 'center',
  },
  matchPreviewButton: {
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  matchPreviewButtonText: {
    fontSize: 12,
    color: BrandColors.gray500,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  matchAcceptedContent: {
    alignItems: 'center',
    padding: Spacing.four,
    paddingBottom: 48,
  },
  matchAcceptedIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  matchAcceptedTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: BrandColors.gray900,
    textAlign: 'center',
  },
  matchAcceptedSubtitle: {
    fontSize: 13,
    color: BrandColors.gray600,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: Spacing.four,
  },
  matchedStaffCard: {
    width: '100%',
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  matchedStaffCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchedStaffLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandColors.gray500,
    letterSpacing: 0.6,
  },
  matchedStaffVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BrandColors.primaryLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  matchedStaffVerifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  matchedStaffProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchedStaffAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: BrandColors.gray100,
  },
  matchedStaffInfo: {
    flex: 1,
    marginLeft: 12,
  },
  matchedStaffName: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: 3,
  },
  matchedStaffMeta: {
    fontSize: 12,
    color: BrandColors.gray600,
    lineHeight: 18,
  },
  matchBookingCard: {
    width: '100%',
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    padding: Spacing.three,
  },
  matchBookingCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: 8,
  },
  matchBookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  matchBookingText: {
    flex: 1,
    fontSize: 12,
    color: BrandColors.gray700,
    lineHeight: 17,
  },
  matchAcceptedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.md,
    padding: Spacing.two,
    marginTop: Spacing.three,
  },
  matchAcceptedNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16,
  },
  matchHomeButton: {
    width: '100%',
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  matchHomeButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.white,
  },

  // Success Screen
  successContent: {
    alignItems: 'center',
    padding: Spacing.four,
    paddingBottom: 50,
  },
  successCheckCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  successHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: BrandColors.gray900,
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubheading: {
    fontSize: 13,
    color: BrandColors.gray600,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.four,
  },
  orderCodeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: BrandColors.primary,
    marginBottom: Spacing.three,
  },
  orderCodeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.gray500,
    letterSpacing: 0.5,
  },
  orderCodeVal: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.primaryDark,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  successDetailCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.four,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  successKey: {
    fontSize: 12,
    color: BrandColors.gray500,
  },
  successVal: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray800,
    maxWidth: '65%',
    textAlign: 'right',
  },
  successValBold: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  successTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  successBtnColumn: {
    width: '100%',
    gap: 10,
  },
  ctaSecondaryBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ctaSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray700,
  },

  // Bottom action bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.8)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  ctaPrimaryBtn: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  gradientBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
