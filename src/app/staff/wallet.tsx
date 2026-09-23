import React, { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { StaffService, StaffWalletTransaction } from '@/data/staffService';
import { StaffBottomNav } from '@/components/staff/StaffBottomNav';

export default function StaffWalletScreen() {
  const router = useRouter();

  const [wallet, setWallet] = useState(StaffService.getWallet());
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'WITHDRAW' | 'BONUS'>('ALL');

  // Withdraw Modal State
  const [isWithdrawVisible, setIsWithdrawVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('1000000');
  const [selectedBank, setSelectedBank] = useState('Vietcombank (****9821)');
  const [accountName, setAccountName] = useState('NGUYEN THI HOA');

  useEffect(() => {
    const update = () => {
      setWallet(StaffService.getWallet());
    };
    update();
    const unsubscribe = StaffService.subscribe(update);
    return unsubscribe;
  }, []);

  const { balance, transactions } = wallet;

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.type === filterType;
  });

  const handleQuickAmount = (val: number) => {
    setWithdrawAmount(val.toString());
  };

  const handleConfirmWithdraw = () => {
    const amountNum = parseInt(withdrawAmount.replace(/\D/g, ''), 10);
    if (isNaN(amountNum) || amountNum < 50000) {
      Alert.alert('Lỗi', 'Số tiền rút tối thiểu là 50.000đ.');
      return;
    }
    if (amountNum > balance.available) {
      Alert.alert('Số dư không đủ', 'Số tiền rút vượt quá số dư khả dụng hiện có.');
      return;
    }

    const success = StaffService.withdrawMoney(amountNum, selectedBank, '9821');
    if (success) {
      setIsWithdrawVisible(false);
      Alert.alert(
        'Lệnh rút tiền thành công! 💸',
        `Yêu cầu rút ${amountNum.toLocaleString('vi-VN')}đ về tài khoản ${selectedBank} đã được xử lý thành công qua hệ thống chuyển tiền nhanh 24/7.`
      );
    }
  };

  const bankOptions = [
    'Vietcombank (****9821)',
    'MB Bank (****5678)',
    'Techcombank (****1234)',
    'Ví MoMo (0912001001)',
  ];

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ví & Thu nhập</Text>
          <Pressable
            style={styles.helpBtn}
            onPress={() =>
              Alert.alert(
                'Quy định đối soát & rút tiền',
                '• Tiền công từ ca làm sẽ cộng vào số dư khả dụng ngay khi khách hàng xác nhận nghiệm thu.\n• Hỗ trợ rút tiền 24/7 về các tài khoản ngân hàng liên kết, miễn phí giao dịch.'
              )
            }
          >
            <IconSymbol name="info" size={18} color={BrandColors.gray600} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Main Wallet Card */}
          <LinearGradient
            colors={['#064E3B', '#047857', '#059669']}
            style={styles.walletCard}
          >
            <View style={styles.walletTopRow}>
              <View>
                <Text style={styles.walletLabel}>SỐ DƯ KHẢ DỤNG</Text>
                <Text style={styles.walletBalance}>
                  {balance.available.toLocaleString('vi-VN')}đ
                </Text>
              </View>
              <Pressable
                style={styles.withdrawActionBtn}
                onPress={() => setIsWithdrawVisible(true)}
              >
                <IconSymbol name="cash" size={16} color="#047857" />
                <Text style={styles.withdrawActionText}>Rút tiền</Text>
              </Pressable>
            </View>

            <View style={styles.walletDivider} />

            <View style={styles.walletStatsGrid}>
              <View style={styles.walletStatCol}>
                <Text style={styles.statLabel}>Chờ đối soát</Text>
                <Text style={styles.statValue}>
                  {balance.pending.toLocaleString('vi-VN')}đ
                </Text>
              </View>
              <View style={styles.walletStatCol}>
                <Text style={styles.statLabel}>Tổng thu nhập</Text>
                <Text style={styles.statValue}>
                  {(balance.totalEarned / 1000000).toFixed(1)} triệu
                </Text>
              </View>
              <View style={styles.walletStatCol}>
                <Text style={styles.statLabel}>Đã rút về</Text>
                <Text style={styles.statValue}>
                  {(balance.withdrawn / 1000000).toFixed(1)} triệu
                </Text>
              </View>
            </View>

            <View style={styles.linkedBankRow}>
              <Text style={styles.linkedBankText}>
                🏦 Thụ hưởng: Vietcombank (****9821) - NGUYEN THI HOA
              </Text>
            </View>
          </LinearGradient>

          {/* Weekly Income Bar Overview */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.cardTitle}>Hiệu suất thu nhập tuần này</Text>
              <Text style={styles.chartTotal}>2.480.000đ</Text>
            </View>
            <Text style={styles.chartSub}>Tăng 12% so với tuần trước (Đạt chỉ tiêu)</Text>

            {/* Weekly Bars Simulation */}
            <View style={styles.barsContainer}>
              {[
                { day: 'T2', amount: '350k', height: 45 },
                { day: 'T3', amount: '480k', height: 60 },
                { day: 'T4', amount: '290k', height: 35 },
                { day: 'T5', amount: '520k', height: 75 },
                { day: 'T6', amount: '440k', height: 55 },
                { day: 'T7', amount: '400k', height: 50, active: true },
                { day: 'CN', amount: '0k', height: 10 },
              ].map((item, i) => (
                <View key={i} style={styles.barColumn}>
                  <Text style={styles.barAmount}>{item.amount}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: item.height },
                        item.active && styles.barFillActive,
                      ]}
                    />
                  </View>
                  <Text style={[styles.barDay, item.active && styles.barDayActive]}>
                    {item.day}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Transactions Filter & History */}
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.cardTitle}>Lịch sử biến động</Text>
              <Text style={styles.txCount}>{filteredTransactions.length} giao dịch</Text>
            </View>

            {/* Filter Pills */}
            <View style={styles.filterPills}>
              {(
                [
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'INCOME', label: 'Tiền công' },
                  { key: 'WITHDRAW', label: 'Rút tiền' },
                  { key: 'BONUS', label: 'Thưởng/Tip' },
                ] as const
              ).map((p) => {
                const active = filterType === p.key;
                return (
                  <Pressable
                    key={p.key}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => setFilterType(p.key)}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Transaction Items */}
            <View style={styles.txList}>
              {filteredTransactions.map((tx) => {
                const isPositive = tx.type === 'INCOME' || tx.type === 'BONUS';
                return (
                  <View key={tx.id} style={styles.txItem}>
                    <View
                      style={[
                        styles.txIconWrap,
                        { backgroundColor: isPositive ? '#ECFDF5' : '#FEF2F2' },
                      ]}
                    >
                      <IconSymbol
                        name={isPositive ? 'cash' : 'wallet'}
                        size={18}
                        color={isPositive ? '#047857' : '#DC2626'}
                      />
                    </View>

                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle}>{tx.title}</Text>
                      <Text style={styles.txDate}>{tx.date}</Text>
                    </View>

                    <View style={styles.txAmountWrap}>
                      <Text
                        style={[
                          styles.txAmount,
                          { color: isPositive ? '#047857' : '#DC2626' },
                        ]}
                      >
                        {isPositive ? '+' : '-'}
                        {tx.amount.toLocaleString('vi-VN')}đ
                      </Text>
                      <Text style={styles.txStatus}>Thành công</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Interactive Withdraw Modal */}
      <Modal
        visible={isWithdrawVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsWithdrawVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rút tiền về tài khoản</Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setIsWithdrawVisible(false)}
              >
                <IconSymbol name="close" size={16} color={BrandColors.gray600} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Tài khoản nhận tiền</Text>
              <View style={styles.bankSelectWrap}>
                {bankOptions.map((bank) => {
                  const selected = selectedBank === bank;
                  return (
                    <Pressable
                      key={bank}
                      style={[styles.bankOption, selected && styles.bankOptionActive]}
                      onPress={() => setSelectedBank(bank)}
                    >
                      <Text style={styles.bankEmoji}>🏦</Text>
                      <Text
                        style={[
                          styles.bankOptionText,
                          selected && styles.bankOptionTextActive,
                        ]}
                      >
                        {bank}
                      </Text>
                      {selected && <Text style={styles.bankCheck}>✓</Text>}
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Chủ tài khoản</Text>
              <TextInput
                style={styles.readOnlyInput}
                value={accountName}
                editable={false}
              />

              <Text style={styles.inputLabel}>Số tiền muốn rút (VNĐ)</Text>
              <View style={styles.amountInputWrap}>
                <TextInput
                  style={styles.amountInput}
                  keyboardType="numeric"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  placeholder="Nhập số tiền"
                />
                <Text style={styles.amountCurrency}>đ</Text>
              </View>

              <Text style={styles.availableHint}>
                Số dư khả dụng: {balance.available.toLocaleString('vi-VN')}đ
              </Text>

              {/* Quick Select Buttons */}
              <View style={styles.quickAmountRow}>
                {[500000, 1000000, 2000000].map((val) => (
                  <Pressable
                    key={val}
                    style={styles.quickAmountBtn}
                    onPress={() => handleQuickAmount(val)}
                  >
                    <Text style={styles.quickAmountText}>
                      {(val / 1000).toLocaleString('vi-VN')}k
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={[styles.quickAmountBtn, styles.quickAmountAll]}
                  onPress={() => handleQuickAmount(balance.available)}
                >
                  <Text style={styles.quickAmountAllText}>Tất cả</Text>
                </Pressable>
              </View>

              <View style={styles.feeNotice}>
                <IconSymbol name="check" size={14} color="#047857" />
                <Text style={styles.feeNoticeText}>
                  Miễn phí giao dịch • Chuyển khoản tức thì 24/7
                </Text>
              </View>

              <Pressable
                style={styles.confirmWithdrawBtn}
                onPress={handleConfirmWithdraw}
              >
                <Text style={styles.confirmWithdrawText}>Xác nhận rút tiền ngay</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Staff Bottom Nav */}
      <StaffBottomNav activeTab="wallet" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: BrandColors.gray900 },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { padding: 16, gap: 14, paddingBottom: 24 },

  walletCard: {
    borderRadius: 20,
    padding: 18,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  walletTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabel: { color: '#A7F3D0', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  walletBalance: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', marginTop: 4 },
  withdrawActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  withdrawActionText: { color: '#047857', fontSize: 13, fontWeight: '900' },
  walletDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 14 },
  walletStatsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  walletStatCol: { flex: 1 },
  statLabel: { color: '#D1FAE5', fontSize: 11 },
  statValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginTop: 2 },
  linkedBankRow: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
    padding: 8,
    marginTop: 14,
  },
  linkedBankText: { color: '#ECFDF5', fontSize: 11, fontWeight: '700' },

  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '900', color: BrandColors.gray900 },
  chartTotal: { fontSize: 16, fontWeight: '900', color: '#047857' },
  chartSub: { fontSize: 11, color: BrandColors.gray500, marginBottom: 10 },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
    paddingTop: 10,
  },
  barColumn: { alignItems: 'center', flex: 1 },
  barAmount: { fontSize: 9, color: BrandColors.gray500, marginBottom: 4 },
  barTrack: {
    width: 14,
    height: 75,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', backgroundColor: '#A7F3D0', borderRadius: 7 },
  barFillActive: { backgroundColor: '#047857' },
  barDay: { fontSize: 11, color: BrandColors.gray500, marginTop: 6, fontWeight: '600' },
  barDayActive: { color: '#047857', fontWeight: '800' },

  historySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txCount: { fontSize: 11, color: BrandColors.gray500 },
  filterPills: { flexDirection: 'row', gap: 6 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  pillActive: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#10B981' },
  pillText: { fontSize: 11, color: BrandColors.gray600, fontWeight: '600' },
  pillTextActive: { color: '#047857', fontWeight: '800' },

  txList: { gap: 10 },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 13, fontWeight: '800', color: BrandColors.gray900 },
  txDate: { fontSize: 11, color: BrandColors.gray500, marginTop: 2 },
  txAmountWrap: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '900' },
  txStatus: { fontSize: 10, color: '#047857', marginTop: 1, fontWeight: '700' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: BrandColors.gray900 },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.gray700,
    marginTop: 10,
    marginBottom: 6,
  },
  bankSelectWrap: { gap: 6 },
  bankOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  bankOptionActive: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  bankEmoji: { fontSize: 14 },
  bankOptionText: { flex: 1, fontSize: 13, color: BrandColors.gray800 },
  bankOptionTextActive: { fontWeight: '800', color: '#047857' },
  bankCheck: { color: '#047857', fontWeight: '900' },
  readOnlyInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: BrandColors.gray700,
    fontWeight: '700',
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  amountInput: {
    flex: 1,
    height: 46,
    fontSize: 20,
    fontWeight: '900',
    color: BrandColors.gray900,
  },
  amountCurrency: { fontSize: 16, fontWeight: '800', color: BrandColors.gray500 },
  availableHint: { fontSize: 11, color: BrandColors.gray500, marginTop: 4 },
  quickAmountRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  quickAmountBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  quickAmountText: { fontSize: 12, fontWeight: '700', color: BrandColors.gray700 },
  quickAmountAll: { backgroundColor: '#ECFDF5' },
  quickAmountAllText: { fontSize: 12, fontWeight: '800', color: '#047857' },
  feeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  feeNoticeText: { color: '#166534', fontSize: 11, fontWeight: '700' },
  confirmWithdrawBtn: {
    backgroundColor: '#047857',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  confirmWithdrawText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
