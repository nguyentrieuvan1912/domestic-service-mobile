import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { StaffService, StaffJobItem, JobStepStatus } from '@/data/staffService';

export default function StaffJobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [job, setJob] = useState<StaffJobItem | undefined>(undefined);

  useEffect(() => {
    const update = () => {
      if (id) {
        setJob(StaffService.getJobById(id));
      }
    };
    update();
    const unsubscribe = StaffService.subscribe(update);
    return unsubscribe;
  }, [id]);

  if (!job) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Không tìm thấy thông tin ca làm việc.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const steps: { key: JobStepStatus; title: string; desc: string }[] = [
    { key: 'ACCEPTED', title: 'Đã nhận ca', desc: 'Đã xác nhận ca làm' },
    { key: 'EN_ROUTE', title: 'Đang di chuyển', desc: 'Đang trên đường đến' },
    { key: 'IN_PROGRESS', title: 'Đang làm việc', desc: 'Bắt đầu tính giờ làm' },
    { key: 'COMPLETED', title: 'Hoàn thành', desc: 'Nghiệm thu & nhận tiền' },
  ];

  const getStepIndex = (status: JobStepStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return 0;
      case 'EN_ROUTE':
        return 1;
      case 'IN_PROGRESS':
        return 2;
      case 'COMPLETED':
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(job.status);

  const handleNextStep = () => {
    if (job.status === 'ACCEPTED') {
      Alert.alert(
        'Bắt đầu di chuyển',
        `Xác nhận bạn đang di chuyển đến địa chỉ của khách hàng ${job.customerName}?`,
        [
          { text: 'Chưa' },
          {
            text: 'Xác nhận bắt đầu',
            onPress: () => {
              StaffService.updateJobStatus(job.id, 'EN_ROUTE');
            },
          },
        ]
      );
    } else if (job.status === 'EN_ROUTE') {
      Alert.alert(
        'Đã đến nơi',
        'Xác nhận bạn đã có mặt tại nhà khách hàng và sẵn sàng bắt đầu công việc?',
        [
          { text: 'Chưa' },
          {
            text: 'Bắt đầu làm việc ngay',
            onPress: () => {
              StaffService.updateJobStatus(job.id, 'IN_PROGRESS');
            },
          },
        ]
      );
    } else if (job.status === 'IN_PROGRESS') {
      Alert.alert(
        'Nghiệm thu & Hoàn thành',
        `Bạn đã hoàn thành các hạng mục công việc và khách hàng đã nghiệm thu?\nThu nhập +${job.netIncome.toLocaleString('vi-VN')}đ sẽ được cộng ngay vào ví của bạn!`,
        [
          { text: 'Kiểm tra lại' },
          {
            text: 'Hoàn thành ca làm',
            onPress: () => {
              StaffService.updateJobStatus(job.id, 'COMPLETED');
              Alert.alert(
                'Chúc mừng bạn đã hoàn thành ca! 🎉',
                `Đã cộng +${job.netIncome.toLocaleString('vi-VN')}đ vào số dư khả dụng của bạn. Hãy kiểm tra mục Ví & Thu nhập.`
              );
            },
          },
        ]
      );
    }
  };

  const handlePhoneCall = () => {
    Alert.alert(
      'Liên hệ khách hàng',
      `Gọi cho khách hàng ${job.customerName} qua số điện thoại: ${job.customerPhone}?`,
      [
        { text: 'Hủy' },
        {
          text: 'Gọi ngay',
          onPress: () => {
            Linking.openURL(`tel:${job.customerPhone}`).catch(() => {
              Alert.alert('Mô phỏng cuộc gọi', `Đang gọi đến số ${job.customerPhone}...`);
            });
          },
        },
      ]
    );
  };

  const handleOpenMap = () => {
    Alert.alert(
      'Chỉ đường',
      `Mở ứng dụng bản đồ để chỉ đường đến:\n${job.address}`,
      [
        { text: 'Đóng' },
        {
          text: 'Mở bản đồ',
          onPress: () => {
            const query = encodeURIComponent(job.address);
            Linking.openURL(`https://maps.google.com/?q=${query}`).catch(() => {
              Alert.alert('Thông báo', 'Đã lưu tọa độ điểm hẹn.');
            });
          },
        },
      ]
    );
  };

  const handleReportIssue = () => {
    Alert.alert(
      'Báo cáo sự cố ca làm',
      'Vui lòng chọn loại sự cố bạn gặp phải:',
      [
        { text: 'Khách không có nhà / không liên lạc được' },
        { text: 'Khối lượng công việc phát sinh quá nhiều' },
        { text: 'Khác (Liên hệ tổng đài 1900 6868)' },
        { text: 'Đóng', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Top Navigation */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconCircle} onPress={() => router.back()}>
          <IconSymbol name="back" size={22} color={BrandColors.gray800} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>Chi tiết ca làm việc</Text>
          <Text style={styles.topBarSubtitle}>{job.bookingCode}</Text>
        </View>
        <Pressable style={styles.iconCircle} onPress={handleReportIssue}>
          <IconSymbol name="warning" size={18} color="#D97706" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Step Progress Bar */}
        <View style={styles.stepperCard}>
          <Text style={styles.stepperHeader}>Tiến trình làm việc</Text>
          <View style={styles.stepperRow}>
            {steps.map((s, idx) => {
              const isPastOrCurrent = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <React.Fragment key={s.key}>
                  <View style={styles.stepNodeWrap}>
                    <View
                      style={[
                        styles.stepNode,
                        isPastOrCurrent && styles.stepNodeDone,
                        isCurrent && styles.stepNodeActive,
                      ]}
                    >
                      {idx < currentStepIdx || job.status === 'COMPLETED' ? (
                        <Text style={styles.stepNodeCheck}>✓</Text>
                      ) : (
                        <Text
                          style={[
                            styles.stepNodeNum,
                            isPastOrCurrent && styles.stepNodeNumActive,
                          ]}
                        >
                          {idx + 1}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stepNodeTitle,
                        isPastOrCurrent && styles.stepNodeTitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      {s.title}
                    </Text>
                  </View>
                  {idx < steps.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        idx < currentStepIdx && styles.stepLineDone,
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {/* Current Step Instruction Banner */}
          <View style={styles.stepInstruction}>
            <Text style={styles.instructionTitle}>
              {job.status === 'ACCEPTED'
                ? 'Ca đã được nhận thành công'
                : job.status === 'EN_ROUTE'
                ? 'Đang trên đường đến nhà khách'
                : job.status === 'IN_PROGRESS'
                ? 'Đang tiến hành công việc'
                : 'Ca làm việc đã hoàn thành xuất sắc'}
            </Text>
            <Text style={styles.instructionDesc}>
              {job.status === 'ACCEPTED'
                ? 'Vui lòng chuẩn bị trang phục, dụng cụ và bấm bắt đầu di chuyển trước giờ hẹn 15-30 phút.'
                : job.status === 'EN_ROUTE'
                ? 'Hãy chú ý an toàn giao thông. Khi đến nơi, bấm "Đã đến nơi" để xác nhận gặp gia chủ.'
                : job.status === 'IN_PROGRESS'
                ? 'Tập trung làm việc theo checklist. Sau khi gia chủ nghiệm thu, bấm hoàn thành để nhận tiền công.'
                : 'Tiền công đã được cộng trực tiếp vào ví. Khách hàng sẽ gửi đánh giá sao cho bạn.'}
            </Text>
          </View>
        </View>

        {/* Action Button for Current Step */}
        {job.status !== 'COMPLETED' ? (
          <Pressable style={styles.primaryActionButton} onPress={handleNextStep}>
            <Text style={styles.primaryActionText}>
              {job.status === 'ACCEPTED'
                ? 'Bắt đầu di chuyển đến nhà khách 🚀'
                : job.status === 'EN_ROUTE'
                ? 'Đã đến nơi & Gặp gia chủ 📍'
                : 'Nghiệm thu & Hoàn thành ca làm ✨'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.completedNotice}>
            <Text style={styles.completedNoticeText}>
              ✅ Ca làm việc đã hoàn thành & đã nhận tiền công
            </Text>
          </View>
        )}

        {/* Customer Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Khách hàng liên hệ</Text>
          <View style={styles.customerRow}>
            <Image source={{ uri: job.customerAvatar }} style={styles.customerAvatar} />
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{job.customerName}</Text>
              <Text style={styles.customerPhone}>📞 {job.customerPhone}</Text>
              <Text style={styles.customerDist}>Cách bạn ~{job.distanceKm} km</Text>
            </View>
            <View style={styles.contactButtons}>
              <Pressable style={styles.contactBtnCall} onPress={handlePhoneCall}>
                <IconSymbol name="phone" size={16} color="#FFFFFF" />
                <Text style={styles.contactBtnCallText}>Gọi điện</Text>
              </Pressable>

              {job.conversationId ? (
                <Pressable
                  style={styles.contactBtnChat}
                  onPress={() =>
                    router.push({
                      pathname: '/chat/[id]',
                      params: { id: job.conversationId || '' },
                    })
                  }
                >
                  <IconSymbol name="chat" size={16} color="#047857" />
                  <Text style={styles.contactBtnChatText}>Nhắn tin</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        {/* Location & Time */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Thời gian & Địa điểm</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⏱️</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Khung giờ làm việc</Text>
              <Text style={styles.infoValue}>
                {job.date} • {job.timeSlot}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Địa chỉ cụ thể</Text>
              <Text style={styles.infoValue}>{job.address}</Text>
              <Text style={styles.infoSubValue}>Khu vực: {job.district}, TP. Hồ Chí Minh</Text>
            </View>
          </View>

          <Pressable style={styles.mapButton} onPress={handleOpenMap}>
            <IconSymbol name="location" size={16} color="#2563EB" />
            <Text style={styles.mapButtonText}>Mở ứng dụng Bản đồ chỉ đường</Text>
          </Pressable>
        </View>

        {/* Service Details & Notes */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Chi tiết dịch vụ</Text>
          <View style={styles.serviceDetailHeader}>
            <View style={styles.serviceIconSmall}>
              <IconSymbol name={job.serviceIcon || 'clean'} size={18} color="#047857" />
            </View>
            <View>
              <Text style={styles.serviceTitleBig}>{job.serviceName}</Text>
              <Text style={styles.packageSubtitle}>{job.packageTitle}</Text>
            </View>
          </View>

          {job.addOnsText ? (
            <View style={styles.addOnBox}>
              <Text style={styles.addOnLabel}>Dịch vụ phụ trợ kèm theo:</Text>
              <Text style={styles.addOnValue}>+ {job.addOnsText}</Text>
            </View>
          ) : null}

          {job.notes ? (
            <View style={styles.notesHighlight}>
              <Text style={styles.notesHighlightTitle}>💬 Ghi chú đặc biệt từ gia chủ:</Text>
              <Text style={styles.notesHighlightContent}>{job.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Work Checklist */}
        {job.checklist && job.checklist.length > 0 && (
          <View style={styles.card}>
            <View style={styles.checklistHeader}>
              <Text style={styles.cardSectionTitle}>Hạng mục công việc (Checklist)</Text>
              <Text style={styles.checklistProgress}>
                {job.checklist.filter((c) => c.done).length}/{job.checklist.length} việc
              </Text>
            </View>
            <Text style={styles.checklistSub}>
              Đánh dấu các việc đã xong để đảm bảo chất lượng ca làm:
            </Text>

            <View style={styles.checklistWrap}>
              {job.checklist.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.checkItemRow}
                  onPress={() => StaffService.toggleChecklistItem(job.id, item.id)}
                >
                  <View style={[styles.checkbox, item.done && styles.checkboxActive]}>
                    {item.done && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text
                    style={[styles.checkItemTitle, item.done && styles.checkItemTitleDone]}
                  >
                    {item.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Financial Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Minh bạch thu nhập ca này</Text>
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>Giá gói khách đặt:</Text>
            <Text style={styles.financeValue}>
              {job.totalCustomerPaid.toLocaleString('vi-VN')}đ
            </Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>Phí vận hành & bảo hiểm sàn (15%):</Text>
            <Text style={styles.financeFee}>
              -{job.platformFee.toLocaleString('vi-VN')}đ
            </Text>
          </View>
          <View style={[styles.financeRow, styles.financeTotalRow]}>
            <Text style={styles.financeTotalLabel}>Thu nhập thực nhận của bạn:</Text>
            <Text style={styles.financeTotalAmount}>
              +{job.netIncome.toLocaleString('vi-VN')}đ
            </Text>
          </View>
          <Text style={styles.financeNote}>
            * Tiền công sẽ tự động cộng vào Ví nhân viên ngay khi khách hàng xác nhận nghiệm thu.
          </Text>
        </View>

        {/* Emergency support */}
        <Pressable style={styles.helpRow} onPress={handleReportIssue}>
          <IconSymbol name="shield" size={18} color="#0369A1" />
          <Text style={styles.helpText}>Cần hỗ trợ sự cố khẩn cấp? Liên hệ Admin ngay</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  notFoundContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  notFoundText: { fontSize: 16, color: BrandColors.gray700, marginBottom: 12 },
  backBtn: {
    backgroundColor: '#047857',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: { color: '#FFFFFF', fontWeight: '800' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: { alignItems: 'center' },
  topBarTitle: { fontSize: 16, fontWeight: '900', color: BrandColors.gray900 },
  topBarSubtitle: { fontSize: 11, color: BrandColors.gray500, marginTop: 1 },

  content: { padding: 16, gap: 14, paddingBottom: 30 },

  stepperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  stepperHeader: { fontSize: 14, fontWeight: '900', color: BrandColors.gray900 },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stepNodeWrap: { alignItems: 'center', width: 68 },
  stepNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNodeDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  stepNodeActive: { backgroundColor: '#047857', borderColor: '#047857' },
  stepNodeNum: { fontSize: 12, fontWeight: '800', color: BrandColors.gray500 },
  stepNodeNumActive: { color: '#FFFFFF' },
  stepNodeCheck: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  stepNodeTitle: { fontSize: 10, fontWeight: '700', color: BrandColors.gray400, marginTop: 4 },
  stepNodeTitleActive: { color: '#047857', fontWeight: '800' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginBottom: 16 },
  stepLineDone: { backgroundColor: '#10B981' },

  stepInstruction: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  instructionTitle: { fontSize: 12, fontWeight: '800', color: '#047857' },
  instructionDesc: { fontSize: 11, color: '#065F46', marginTop: 2, lineHeight: 16 },

  primaryActionButton: {
    backgroundColor: '#047857',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  completedNotice: {
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  completedNoticeText: { color: '#15803D', fontSize: 13, fontWeight: '800' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  cardSectionTitle: { fontSize: 14, fontWeight: '900', color: BrandColors.gray900 },

  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerAvatar: { width: 48, height: 48, borderRadius: 24 },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 15, fontWeight: '900', color: BrandColors.gray900 },
  customerPhone: { fontSize: 12, color: BrandColors.gray600, marginTop: 2 },
  customerDist: { fontSize: 11, color: '#2563EB', fontWeight: '700', marginTop: 1 },
  contactButtons: { gap: 6 },
  contactBtnCall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  contactBtnCallText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  contactBtnChat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  contactBtnChatText: { color: '#047857', fontSize: 11, fontWeight: '800' },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIcon: { fontSize: 16, marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: BrandColors.gray500 },
  infoValue: { fontSize: 13, fontWeight: '800', color: BrandColors.gray900, marginTop: 1 },
  infoSubValue: { fontSize: 11, color: BrandColors.gray500, marginTop: 1 },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 9,
    marginTop: 4,
  },
  mapButtonText: { fontSize: 12, fontWeight: '800', color: '#1D4ED8' },

  serviceDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  serviceIconSmall: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitleBig: { fontSize: 15, fontWeight: '900', color: BrandColors.gray900 },
  packageSubtitle: { fontSize: 12, color: BrandColors.gray600, marginTop: 2 },
  addOnBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  addOnLabel: { fontSize: 11, color: BrandColors.gray500 },
  addOnValue: { fontSize: 12, fontWeight: '700', color: BrandColors.gray800, marginTop: 2 },
  notesHighlight: {
    backgroundColor: '#FEFCE8',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  notesHighlightTitle: { fontSize: 11, fontWeight: '800', color: '#92400E' },
  notesHighlightContent: { fontSize: 12, color: '#78350F', marginTop: 3, lineHeight: 16 },

  checklistHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checklistProgress: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  checklistSub: { fontSize: 11, color: BrandColors.gray500, marginTop: -4 },
  checklistWrap: { gap: 8, marginTop: 4 },
  checkItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: { backgroundColor: '#047857', borderColor: '#047857' },
  checkboxCheck: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  checkItemTitle: { fontSize: 13, color: BrandColors.gray800, flex: 1 },
  checkItemTitleDone: {
    textDecorationLine: 'line-through',
    color: BrandColors.gray400,
  },

  financeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  financeLabel: { fontSize: 12, color: BrandColors.gray600 },
  financeValue: { fontSize: 13, fontWeight: '700', color: BrandColors.gray800 },
  financeFee: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  financeTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 4,
  },
  financeTotalLabel: { fontSize: 13, fontWeight: '900', color: BrandColors.gray900 },
  financeTotalAmount: { fontSize: 17, fontWeight: '900', color: '#047857' },
  financeNote: { fontSize: 11, color: BrandColors.gray500, fontStyle: 'italic', marginTop: 2 },

  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  helpText: { fontSize: 12, color: '#0369A1', fontWeight: '700' },
});
