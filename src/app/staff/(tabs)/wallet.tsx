import { useBottomTabSpacing } from '@/components/common/TabImageIcon';
import { StaffDisciplineHistory } from '@/components/staff/StaffDisciplineHistory';
import { StaffBankAccountsModal } from '@/components/staff/StaffBankAccountsModal';
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
import { SvgXml } from 'react-native-svg';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { BankLogo } from '@/components/common/BankLogo';
import { StaffService, StaffWalletTransaction } from '@/data/staffService';
import { CelebrationOverlay } from '@/components/common/CleanMasterAnimations';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';

export default function StaffWalletScreen() {
  const { currentStaff } = useAuth(); const router = useRouter();
  if (!currentStaff) return <SafeAreaView style={{ flex: 1 }}><EmptyState icon="user" title="Vui lòng đăng nhập nhân viên" actionText="Đăng nhập" onAction={() => router.replace('/auth/login')} /></SafeAreaView>;
  return <StaffWalletContent key={currentStaff.id} />;
}
function StaffWalletContent() {
  const { height: bottomTabHeight } = useBottomTabSpacing();
  const router = useRouter();
  const { currentStaff } = useAuth();
  const { colors } = useAppTheme();
  const staffId = currentStaff?.id || '';

  const [wallet, setWallet] = useState(() => StaffService.getWallet(staffId));
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'WITHDRAW' | 'BONUS' | 'TOP_UP'>('ALL');

  // Withdraw Modal State
  const [isWithdrawVisible, setIsWithdrawVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('1000000');
  const [withdrawSuccess, setWithdrawSuccess] = useState<{ amount: number; subtitle: string } | null>(null);
  const [bankChoice, setBankChoice] = useState('');
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const cancelLock = useRef(false);
  const requestKey = useRef('withdraw-' + Date.now());
  const [bankManagerVisible, setBankManagerVisible] = useState(false);
  const [topupVisible, setTopupVisible] = useState(false);
  const [withdrawalRules, setWithdrawalRules] = useState({ minimum: 50000, maximum: 1000000, configured: false, requiresAdminApproval: true, automaticNameLookup: false, message: 'Đang kiểm tra Kênh chi…' });
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
  const pendingWithdrawals = withdrawals.filter(item => item.status === 'PENDING' || (item.automaticRequested && item.status === 'APPROVED' && !item.payoutStatus));
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
  const selectedBank = bankOptions.find(bank => bank.id === bankChoice)
    ?? bankOptions.find(bank => bank.isDefault)
    ?? bankOptions[0];
  const openWithdrawal = () => { setBankChoice(''); setIsWithdrawVisible(true); };
  const handleConfirmWithdraw = async () => {
    if (saving) return;
    const amountNum = Number(withdrawAmount);
    if (!Number.isSafeInteger(amountNum) || amountNum < withdrawalRules.minimum || amountNum > withdrawalRules.maximum) { Alert.alert('Lỗi', `Số tiền rút từ ${withdrawalRules.minimum.toLocaleString('vi-VN')}đ đến ${withdrawalRules.maximum.toLocaleString('vi-VN')}đ.`); return; }
    if (!selectedBank) { Alert.alert('Chưa có tài khoản nhận', 'Liên kết tài khoản ngân hàng đã được xác minh trước khi rút.'); return; }
    setSaving(true);
    try {
      await StaffService.withdrawMoney(amountNum, selectedBank.id, '', staffId, requestKey.current);
      setIsWithdrawVisible(false); requestKey.current = 'withdraw-' + Date.now();
      setWithdrawSuccess({
        amount: amountNum,
        subtitle: withdrawalRules.requiresAdminApproval
          ? 'Yêu cầu đã được lưu và đang chờ Admin xử lý. Khoản tiền chưa được chuyển về ngân hàng.'
          : 'Yêu cầu đã được lưu và tiền được giữ riêng. Hệ thống tự gửi lệnh payOS và cập nhật ví khi chuyển thành công.',
      });
    } catch (error) { Alert.alert('Chưa gửi được', error instanceof Error ? error.message : 'Vui lòng thử lại.'); }
    finally { setSaving(false); }
  };


  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StaffConnectionStatus />
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Ví & Thu nhập</Text>
          <Pressable
            style={[styles.helpBtn, { backgroundColor: colors.surfaceMuted }]}
            onPress={() =>
              Alert.alert(
                'Quy định đối soát & rút tiền',
                'Thu nhập được ghi nhận sau khi đơn kết thúc và được quyết toán. ' + withdrawalRules.message
              )
            }
          >
            <IconSymbol name="info" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: styles.content.paddingBottom + bottomTabHeight }]}
        >
          {/* Main Wallet Card */}
          <LinearGradient
            colors={['#022C22', '#065F46', '#0D9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.walletCard}
          >
            {/* Luxury Fintech Card Decorative Backdrop */}
            <View pointerEvents="none" style={styles.walletCardDecor}>
              <SvgXml
                xml={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" fill="none">
                  <circle cx="315" cy="24" r="96" fill="#34D399" fill-opacity="0.16"/>
                  <circle cx="275" cy="185" r="78" fill="#10B981" fill-opacity="0.12"/>
                  <circle cx="28" cy="195" r="64" fill="#A7F3D0" fill-opacity="0.08"/>
                  <path d="M-20 140 C 70 85, 195 175, 380 78" stroke="#A7F3D0" stroke-opacity="0.18" stroke-width="1.5"/>
                  <path d="M-10 165 C 95 110, 215 195, 380 112" stroke="#6EE7B7" stroke-opacity="0.13" stroke-width="1"/>
                  <path d="M294 34l2 5.4 5.4 2-5.4 2-2 5.4-2-5.4-5.4-2 5.4-2 2-5.4z" fill="#FDE68A" fill-opacity="0.65"/>
                  <path d="M250 62l1.2 3.2 3.2 1.2-3.2 1.2-1.2 3.2-1.2-3.2-3.2-1.2 3.2-1.2 1.2-3.2z" fill="#FFFFFF" fill-opacity="0.45"/>
                </svg>`}
                width="100%"
                height="100%"
              />
            </View>

            <View style={styles.walletTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletLabel}>SỐ DƯ KHẢ DỤNG</Text>
                <Text style={styles.walletBalance}>
                  {balance.available.toLocaleString('vi-VN')}đ
                </Text>
              </View>
              <View style={styles.walletBrandPill}>
                <View style={styles.walletChipGold} />
                <Text style={styles.walletBrandText}>CleanMaster Pay</Text>
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
              <View style={styles.walletStatDivider} />
              <View style={styles.walletStatCol}>
                <Text style={styles.statLabel}>Tổng thu nhập</Text>
                <Text style={styles.statValue}>
                  {(balance.totalEarned / 1000000).toFixed(1)} triệu
                </Text>
              </View>
              <View style={styles.walletStatDivider} />
              <View style={styles.walletStatCol}>
                <Text style={styles.statLabel}>Đã rút về</Text>
                <Text style={styles.statValue}>
                  {(balance.withdrawn / 1000000).toFixed(1)} triệu
                </Text>
              </View>
            </View>

            <View style={styles.linkedBankRow}>
              {bankAccounts.length ? bankAccounts.map((bank, idx) => (
                <View
                  key={bank.id}
                  style={[
                    styles.linkedBankItem,
                    idx > 0 && styles.linkedBankItemBorder,
                  ]}
                >
                  <BankLogo bankName={bank.bankName} size={24} />
                  <Text style={styles.linkedBankName} numberOfLines={1}>
                    {bank.bankName || 'Chưa xác định ngân hàng'}
                  </Text>
                  <Text style={styles.linkedBankText}>•••• {bank.accountNumber.slice(-4)}</Text>
                  <View
                    style={[
                      styles.linkedBankPill,
                      bank.isDefault && styles.linkedBankPillDefault,
                    ]}
                  >
                    <Text
                      style={[
                        styles.linkedBankStatus,
                        bank.isDefault && styles.linkedBankStatusDefault,
                      ]}
                    >
                      {bank.isDefault ? 'Mặc định' : bank.status === 'VERIFIED' ? 'Đã xác minh' : 'Chờ xác minh'}
                    </Text>
                  </View>
                </View>
              )) : <Text style={styles.linkedBankText}>Chưa liên kết tài khoản ngân hàng nhận tiền.</Text>}
            </View>
          </LinearGradient>

          <View style={styles.walletActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Mở nạp tiền vào ví" onPress={() => setTopupVisible(true)} style={[styles.walletAction, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="plus" size={20} color={colors.accentText} /><Text style={[styles.walletActionLabel, { color: colors.text }]}>Nạp tiền</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Mở yêu cầu rút tiền" onPress={openWithdrawal} style={[styles.walletAction, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="cash" size={20} color={colors.accentText} /><Text style={[styles.walletActionLabel, { color: colors.text }]}>Rút tiền</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Quản lý ngân hàng" onPress={() => setBankManagerVisible(true)} style={[styles.walletAction, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="office" size={20} color={colors.accentText} /><Text style={[styles.walletActionLabel, { color: colors.text }]}>Ngân hàng</Text>
            </Pressable>
          </View>
          {!!balance.reserved && balance.reserved > 0 && <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Tiền đang giữ cho yêu cầu rút</Text>
            <Text style={[styles.chartTotal, { color: colors.accentText }]}>{(balance.reserved || 0).toLocaleString('vi-VN')}đ</Text>
            <Text style={[styles.chartSub, { color: colors.textMuted }]}>Khoản này đang được giữ riêng, chưa thể dùng để thanh toán hoặc tạo yêu cầu rút khác.</Text>
            {pendingWithdrawals.map(item => <View key={item.id} style={{ borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12, marginTop: 12, gap: 8 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>Yêu cầu #{item.id} · {item.amount.toLocaleString('vi-VN')}đ · {item.automaticRequested ? 'Chờ gửi lệnh tự động' : 'Chờ Admin duyệt'}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`Hủy yêu cầu rút số ${item.id}`} disabled={cancellingId !== null} onPress={() => Alert.alert('Hủy yêu cầu rút?', `${item.amount.toLocaleString('vi-VN')}đ sẽ được hoàn về số dư khả dụng nếu Admin chưa duyệt yêu cầu.`, [{ text: 'Giữ yêu cầu', style: 'cancel' }, { text: 'Hủy yêu cầu rút', style: 'destructive', onPress: () => void cancelWithdrawal(item.id) }])} style={{ borderWidth: 1, borderColor: colors.dangerBorder, backgroundColor: colors.dangerBg, borderRadius: 10, padding: 12, alignItems: 'center', opacity: cancellingId !== null ? 0.5 : 1 }}><Text style={{ color: colors.dangerText, fontSize: 13, fontWeight: '700' }}>{cancellingId === item.id ? 'Đang hủy…' : 'Hủy yêu cầu rút'}</Text></Pressable>
            </View>)}
            {!pendingWithdrawals.length && <Text style={[styles.chartSub, { color: colors.textMuted, marginTop: 8 }]}>Yêu cầu đã được duyệt hoặc đang đối soát nên không thể tự hủy.</Text>}
          </View>}

          {/* Transactions Filter & History */}
          <View style={[styles.historySection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.historyHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Lịch sử biến động</Text>
              <Text style={[styles.txCount, { color: colors.textMuted }]}>{filteredTransactions.length} giao dịch</Text>
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
                    style={[
                      styles.pill,
                      { backgroundColor: colors.surfaceMuted },
                      active && { backgroundColor: colors.accentBg, borderWidth: 1, borderColor: colors.primary },
                    ]}
                    onPress={() => setFilterType(p.key)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: colors.textSecondary },
                        active && { color: colors.accentText, fontWeight: '800' },
                      ]}
                    >
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
                  <View key={tx.id} style={[styles.txItem, { borderBottomColor: colors.divider }]}>
                    <View
                      style={[
                        styles.txIconWrap,
                        { backgroundColor: isPositive ? colors.accentBg : colors.dangerBg },
                      ]}
                    >
                      <IconSymbol
                        name={isPositive ? 'cash' : 'wallet'}
                        size={18}
                        color={isCancelledWithdrawal ? colors.textMuted : isPositive ? colors.accentText : colors.dangerText}
                      />
                    </View>

                    <View style={styles.txInfo}>
                      <Text style={[styles.txTitle, { color: colors.text }]}>{tx.title}</Text>
                      <Text style={[styles.txDate, { color: colors.textMuted }]}>{tx.date}</Text>
                      {tx.detail ? <Text style={[styles.txDate, { color: colors.textMuted, marginTop: 4, flexShrink: 1 }]}>{tx.detail}</Text> : null}
                    </View>

                    <View style={styles.txAmountWrap}>
                      <Text
                        style={[
                          styles.txAmount,
                          { color: isCancelledWithdrawal ? colors.textMuted : isPositive ? colors.accentText : colors.dangerText },
                        ]}
                      >
                        {isCancelledWithdrawal ? '' : isPositive ? '+' : '-'}
                        {tx.amount.toLocaleString('vi-VN')}đ
                      </Text>
                      <Text style={[styles.txStatus, { color: colors.accentText }]}>{tx.statusLabel || (tx.status === 'SUCCESS' ? 'Đã ghi nhận' : tx.status === 'FAILED' ? 'Đã từ chối' : 'Chờ xử lý')}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
          <StaffDisciplineHistory key={staffId} />
        </ScrollView>
      </SafeAreaView>

      <StaffTopupPanel visible={topupVisible} onClose={() => setTopupVisible(false)} onCredited={refreshWallet} />
      {bankManagerVisible && <StaffBankAccountsModal staffId={staffId} accounts={bankAccounts} onClose={() => setBankManagerVisible(false)} />}
      {/* Interactive Withdraw Modal */}
      <Modal
        visible={isWithdrawVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsWithdrawVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Rút tiền về tài khoản</Text>
              <Pressable
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceMuted }]}
                onPress={() => setIsWithdrawVisible(false)}
              >
                <IconSymbol name="close" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tài khoản nhận tiền</Text>
              <View style={styles.bankSelectWrap}>
                {bankOptions.map((bank) => {
                  const selected = selectedBank?.id === bank.id;
                  return (
                    <Pressable
                      key={bank.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      style={[
                        styles.bankOption,
                        { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                        selected && { borderColor: colors.primary, backgroundColor: colors.accentBg },
                      ]}
                      onPress={() => setBankChoice(bank.id)}
                    >
                      <BankLogo bankName={bank.bankName} size={22} />
                      <Text
                        style={[
                          styles.bankOptionText,
                          { color: colors.text },
                          selected && { fontWeight: '800', color: colors.accentText },
                        ]}
                      >
                        {bank.bankName || 'Chưa xác định ngân hàng'} · •••• {bank.accountNumber.slice(-4)}
                      </Text>
                      {bank.isDefault && <Text style={[styles.bankDefaultBadge, { color: colors.accentText }]}>Mặc định</Text>}
                      {selected && <Text style={[styles.bankCheck, { color: colors.accentText }]}>✓</Text>}
                    </Pressable>
                  );
                })}
                {!bankOptions.length && <Text style={[styles.availableHint, { color: colors.textMuted }]}>Bạn cần có tài khoản đã xác minh trong mục Ngân hàng.</Text>}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Chủ tài khoản</Text>
              <TextInput
                style={[styles.readOnlyInput, { backgroundColor: colors.surfaceMuted, color: colors.textSecondary }]}
                value={selectedBank?.accountHolder || ''}
                editable={false}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Số tiền muốn rút (VNĐ)</Text>
              <View style={[styles.amountInputWrap, { borderColor: colors.primary, backgroundColor: colors.surfaceElevated }]}>
                <TextInput
                  style={[styles.amountInput, { color: colors.text }]}
                  accessibilityLabel="Số tiền muốn rút"
                  keyboardType="number-pad"
                  value={withdrawAmount.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  onChangeText={text => setWithdrawAmount(text.replace(/\D/g, ''))}
                  placeholder="Nhập số tiền"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={[styles.amountCurrency, { color: colors.textMuted }]}>đ</Text>
              </View>

              <Text style={[styles.availableHint, { color: colors.textMuted }]}>
                Số dư khả dụng: {balance.available.toLocaleString('vi-VN')}đ
              </Text>

              {/* Quick Select Buttons */}
              <View style={styles.quickAmountRow}>
                {[withdrawalRules.minimum, 100000, 500000].filter((value, index, values) => value <= withdrawalRules.maximum && values.indexOf(value) === index).map((val) => (
                  <Pressable
                    key={val}
                    style={[styles.quickAmountBtn, { backgroundColor: colors.surfaceMuted }]}
                    onPress={() => handleQuickAmount(val)}
                  >
                    <Text style={[styles.quickAmountText, { color: colors.text }]}>
                      {(val / 1000).toLocaleString('vi-VN')}k
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={[styles.quickAmountBtn, { backgroundColor: colors.accentBg }]}
                  onPress={() => handleQuickAmount(balance.available)}
                >
                  <Text style={[styles.quickAmountAllText, { color: colors.accentText }]}>Tất cả</Text>
                </Pressable>
              </View>

              <View style={[styles.feeNotice, { backgroundColor: colors.accentBg }]}>
                <IconSymbol name="check" size={14} color={colors.accentText} />
                <Text style={[styles.feeNoticeText, { color: colors.accentText }]}>
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

      <CelebrationOverlay
        visible={!!withdrawSuccess}
        variant="payment"
        title="Đã gửi yêu cầu rút tiền!"
        subtitle={withdrawSuccess?.subtitle}
        badgeText={withdrawSuccess ? `${withdrawSuccess.amount.toLocaleString('vi-VN')}đ • payOS` : undefined}
        actionLabel="Đã hiểu"
        onDone={() => setWithdrawSuccess(null)}
      />

      {/* Staff Bottom Nav */}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.28)',
    shadowColor: '#022C22',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 7,
  },
  walletCardDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  walletTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  walletBrandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  walletChipGold: {
    width: 14,
    height: 10,
    borderRadius: 3,
    backgroundColor: '#FCD34D',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  walletBrandText: {
    color: '#ECFDF5',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  walletLabel: { color: '#A7F3D0', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  walletBalance: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 4, letterSpacing: -0.5 },
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
  walletDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 14 },
  walletStatsGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletStatCol: { flex: 1 },
  walletStatDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.16)', marginHorizontal: 10 },
  statLabel: { color: '#A7F3D0', fontSize: 11, fontWeight: '600' },
  statValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', marginTop: 3 },
  linkedBankRow: {
    backgroundColor: 'rgba(2, 44, 34, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.2)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 15,
    gap: 8,
  },
  linkedBankItem: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  linkedBankItemBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
  },
  linkedBankName: { flex: 1, minWidth: 0, color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },
  linkedBankText: { color: '#D1FAE5', fontSize: 11.5, fontWeight: '700' },
  linkedBankPill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  linkedBankPillDefault: {
    backgroundColor: 'rgba(253, 230, 138, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.5)',
  },
  linkedBankStatus: { color: '#D1FAE5', fontSize: 9.5, fontWeight: '800' },
  linkedBankStatusDefault: { color: '#FDE68A' },

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
  bankDefaultBadge: { color: '#047857', fontSize: 10, fontWeight: '700', padding: 4 },
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
