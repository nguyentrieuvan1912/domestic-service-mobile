import { BankLinkModal } from '@/components/staff/BankLinkModal';
import { operationRequest } from '@/api/operations';
import { useFocusEffect } from 'expo-router';
import { StaffTopupPanel } from '@/components/staff/StaffTopupPanel';
import { StaffConnectionStatus } from '@/components/staff/StaffConnectionStatus';
import { EmptyState } from '@/components/common/EmptyState';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert,
  AppState,
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
import { useAuth } from '@/context/AuthContext';

export default function StaffWalletScreen() {
  const { currentStaff } = useAuth(); const router = useRouter();
  if (!currentStaff) return <SafeAreaView style={{ flex: 1 }}><EmptyState icon="user" title="Vui lòng đăng nhập nhân viên" actionText="Đăng nhập" onAction={() => router.replace('/auth/login')} /></SafeAreaView>;
  return <StaffWalletContent key={currentStaff.id} />;
}
function StaffWalletContent() {
  const router = useRouter();
  const { currentStaff } = useAuth();
  const staffId = currentStaff?.id || '';

  const [wallet, setWallet] = useState(() => StaffService.getWallet(staffId));
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'WITHDRAW' | 'BONUS' | 'TOP_UP'>('ALL');

  // Withdraw Modal State
  const [isWithdrawVisible, setIsWithdrawVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('1000000');
  const [selectedBank, setSelectedBank] = useState('');
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const cancelLock = useRef(false);
  const requestKey = useRef('withdraw-' + Date.now());
  const [linkVisible, setLinkVisible] = useState(false);
  const [topupVisible, setTopupVisible] = useState(false);
  const [withdrawalRules, setWithdrawalRules] = useState({ minimum: 50000, maximum: 1000000, configured: false, message: 'Đang kiểm tra Kênh chi…' });
  useFocusEffect(useCallback(() => {
    const controller = new AbortController(); let running = false;
    const update = async () => { if (running || AppState.currentState !== 'active') return; running = true; try {
      const rules = await operationRequest<typeof withdrawalRules>('finance', '/withdrawal-capabilities', 'GET', undefined, controller.signal);
      if (!controller.signal.aborted) setWithdrawalRules(rules);
      await StaffService.refreshWallet(controller.signal);
    } catch { /* The existing connection status handles network errors. */ } finally { running = false; } };
    void update(); const timer = setInterval(() => void update(), 10000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void update(); });
    return () => { controller.abort(); clearInterval(timer); listener.remove(); };
  }, []));

  useEffect(() => {
    const update = () => {
      setWallet(StaffService.getWallet(staffId));
    };
    update();
    const unsubscribe = StaffService.subscribe(update);
    return unsubscribe;
  }, [staffId]);

  const { balance, transactions, withdrawals = [] } = wallet;
  const pendingWithdrawals = withdrawals.filter(item => item.status === 'PENDING');
  const cancelWithdrawal = async (id: number) => {
    if (cancelLock.current) return;
    cancelLock.current = true; setCancellingId(id);
    try {
      const result = await StaffService.cancelWithdrawal(id, staffId);
      Alert.alert('Đã hủy yêu cầu rút', result.refreshPending ? 'Khoản giữ đã được hoàn trên hệ thống. Chưa tải được số dư mới; ví sẽ tự cập nhật khi kết nối lại.' : `${result.amount.toLocaleString('vi-VN')}đ đã được hoàn về số dư khả dụng.`);
    } catch (cause) {
      Alert.alert('Chưa hủy được yêu cầu', cause instanceof Error ? cause.message : 'Vui lòng kiểm tra trạng thái và thử lại.');
      void StaffService.refreshWallet().catch(() => {});
    } finally { cancelLock.current = false; setCancellingId(null); }
  };
  const refreshWallet = useCallback(() => { void StaffService.refreshWallet().catch(() => {}); }, []);

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.type === filterType;
  });

  const handleQuickAmount = (val: number) => {
    setWithdrawAmount(val.toString());
  };

  const bankAccounts = StaffService.getBankAccounts(staffId);
  const bankOptions = bankAccounts.filter(bank => bank.status === 'VERIFIED');
  const accountName = bankOptions.find(bank => bank.id === selectedBank)?.accountHolder || '';
  const handleConfirmWithdraw = async () => {
    if (saving) return;
    const amountNum = Number(withdrawAmount.replace(/\D/g, ''));
    if (!Number.isSafeInteger(amountNum) || amountNum < withdrawalRules.minimum || amountNum > withdrawalRules.maximum) { Alert.alert('Lỗi', `Số tiền rút từ ${withdrawalRules.minimum.toLocaleString('vi-VN')}đ đến ${withdrawalRules.maximum.toLocaleString('vi-VN')}đ.`); return; }
    if (!selectedBank) { Alert.alert('Chưa có tài khoản nhận', 'Liên kết ngân hàng và chờ Admin xác minh trước khi rút.'); return; }
    setSaving(true);
    try {
      await StaffService.withdrawMoney(amountNum, selectedBank, '', staffId, requestKey.current);
      setIsWithdrawVisible(false); requestKey.current = 'withdraw-' + Date.now();
      Alert.alert('Đã gửi yêu cầu rút', 'Yêu cầu đã được lưu và đang chờ Admin xử lý. Khoản tiền chưa được chuyển về ngân hàng.');
    } catch (error) { Alert.alert('Chưa gửi được', error instanceof Error ? error.message : 'Vui lòng thử lại.'); }
    finally { setSaving(false); }
  };


  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StaffConnectionStatus />
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ví & Thu nhập</Text>
          <Pressable
            style={styles.helpBtn}
            onPress={() =>
              Alert.alert(
                'Quy định đối soát & rút tiền',
                'Thu nhập được ghi nhận sau khi đơn kết thúc và được quyết toán. Yêu cầu rút cần tài khoản ngân hàng đã xác minh và chờ Admin xử lý.'
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
                {bankAccounts.length ? '🏦 ' + bankAccounts.map(bank => (bank.bankName || 'Chưa xác định ngân hàng') + ' (****' + bank.accountNumber.slice(-4) + ') · ' + bank.accountHolder + (bank.status === 'VERIFIED' ? ' · Đã xác minh' : ' · Chờ xác minh')).join('\n') : 'Chưa liên kết tài khoản ngân hàng nhận tiền.'}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.walletActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Mở nạp tiền vào ví" onPress={() => setTopupVisible(true)} style={styles.walletAction}>
              <IconSymbol name="plus" size={20} color="#047857" /><Text style={styles.walletActionLabel}>Nạp tiền</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Mở yêu cầu rút tiền" onPress={() => setIsWithdrawVisible(true)} style={styles.walletAction}>
              <IconSymbol name="cash" size={20} color="#047857" /><Text style={styles.walletActionLabel}>Rút tiền</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Liên kết tài khoản ngân hàng" onPress={() => setLinkVisible(true)} style={styles.walletAction}>
              <IconSymbol name="office" size={20} color="#047857" /><Text style={styles.walletActionLabel}>Ngân hàng</Text>
            </Pressable>
          </View>
          {!!balance.reserved && balance.reserved > 0 && <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Tiền đang giữ cho yêu cầu rút</Text>
            <Text style={styles.chartTotal}>{(balance.reserved || 0).toLocaleString('vi-VN')}đ</Text>
            <Text style={styles.chartSub}>Khoản này đang được giữ riêng, chưa thể dùng để thanh toán hoặc tạo yêu cầu rút khác.</Text>
            {pendingWithdrawals.map(item => <View key={item.id} style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, marginTop: 12, gap: 8 }}>
              <Text style={{ fontSize: 13, color: '#475569' }}>Yêu cầu #{item.id} · {item.amount.toLocaleString('vi-VN')}đ · Chờ Admin duyệt</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`Hủy yêu cầu rút số ${item.id}`} disabled={cancellingId !== null} onPress={() => Alert.alert('Hủy yêu cầu rút?', `${item.amount.toLocaleString('vi-VN')}đ sẽ được hoàn về số dư khả dụng nếu Admin chưa duyệt yêu cầu.`, [{ text: 'Giữ yêu cầu', style: 'cancel' }, { text: 'Hủy yêu cầu rút', style: 'destructive', onPress: () => void cancelWithdrawal(item.id) }])} style={{ borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF7F7', borderRadius: 10, padding: 12, alignItems: 'center', opacity: cancellingId !== null ? 0.5 : 1 }}><Text style={{ color: '#B91C1C', fontSize: 13, fontWeight: '700' }}>{cancellingId === item.id ? 'Đang hủy…' : 'Hủy yêu cầu rút'}</Text></Pressable>
            </View>)}
            {!pendingWithdrawals.length && <Text style={[styles.chartSub, { marginTop: 8 }]}>Yêu cầu đã được duyệt hoặc đang đối soát nên không thể tự hủy.</Text>}
          </View>}

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
                  { key: 'TOP_UP', label: 'Nạp tiền' },
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
                const isCancelledWithdrawal = tx.type === 'WITHDRAW' && tx.withdrawalStatus === 'CANCELLED';
                const isPositive = tx.type === 'INCOME' || tx.type === 'BONUS' || tx.type === 'TOP_UP';
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
                        color={isCancelledWithdrawal ? '#64748B' : isPositive ? '#047857' : '#DC2626'}
                      />
                    </View>

                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle}>{tx.title}</Text>
                      <Text style={styles.txDate}>{tx.date}</Text>
                      {tx.detail ? <Text style={[styles.txDate, { marginTop: 4, flexShrink: 1 }]}>{tx.detail}</Text> : null}
                    </View>

                    <View style={styles.txAmountWrap}>
                      <Text
                        style={[
                          styles.txAmount,
                          { color: isCancelledWithdrawal ? '#64748B' : isPositive ? '#047857' : '#DC2626' },
                        ]}
                      >
                        {isCancelledWithdrawal ? '' : isPositive ? '+' : '-'}
                        {tx.amount.toLocaleString('vi-VN')}đ
                      </Text>
                      <Text style={styles.txStatus}>{tx.statusLabel || (tx.status === 'SUCCESS' ? 'Đã ghi nhận' : tx.status === 'FAILED' ? 'Đã từ chối' : 'Chờ xử lý')}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <StaffTopupPanel visible={topupVisible} onClose={() => setTopupVisible(false)} onCredited={refreshWallet} />
      <BankLinkModal visible={linkVisible} onClose={() => setLinkVisible(false)} onSave={async (bin, account, holder) => { await StaffService.addBank(staffId, bin, account, holder); Alert.alert('Đã lưu tài khoản', 'Thông tin đã được lưu và đang chờ admin đối chiếu với ngân hàng.'); }} />
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
                  const selected = selectedBank === bank.id;
                  return (
                    <Pressable
                      key={bank.id}
                      style={[styles.bankOption, selected && styles.bankOptionActive]}
                      onPress={() => setSelectedBank(bank.id)}
                    >
                      <IconSymbol name="🏦" style={styles.bankEmoji} />
                      <Text
                        style={[
                          styles.bankOptionText,
                          selected && styles.bankOptionTextActive,
                        ]}
                      >
                        {bank.bankName || 'Chưa xác định ngân hàng'} · {bank.accountNumber}
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
                {[withdrawalRules.minimum, 100000, 500000].filter((value, index, values) => value <= withdrawalRules.maximum && values.indexOf(value) === index).map((val) => (
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
                  {withdrawalRules.message}
                </Text>
              </View>

              <Pressable
                style={styles.confirmWithdrawBtn}
                disabled={saving} onPress={handleConfirmWithdraw}
              >
                <Text style={styles.confirmWithdrawText}>Gửi yêu cầu rút tiền</Text>
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
  walletActions: { flexDirection: 'row', gap: 10 },
  walletAction: { flex: 1, minWidth: 0, minHeight: 76, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14 },
  walletActionLabel: { color: '#334155', fontSize: 12, fontWeight: '700', textAlign: 'center' },
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
  txInfo: { flex: 1, minWidth: 0, paddingRight: 8 },
  txTitle: { fontSize: 13, fontWeight: '800', color: BrandColors.gray900 },
  txDate: { fontSize: 11, color: BrandColors.gray500, marginTop: 2 },
  txAmountWrap: { alignItems: 'flex-end', maxWidth: '46%' },
  txAmount: { fontSize: 14, fontWeight: '900' },
  txStatus: { fontSize: 10, color: '#047857', marginTop: 1, fontWeight: '700', textAlign: 'right', flexShrink: 1 },

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
