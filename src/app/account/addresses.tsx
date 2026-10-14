import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { AddressCard } from '@/components/common/AddressCard';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { useCustomerAddresses } from '@/hooks/use-customer-addresses';
import { EmptyState } from '@/components/common/EmptyState';
import { CatalogState } from '@/components/common/CatalogState';
import { CustomerAddress } from '@/types/user';

export default function AddressManagementScreen() {
  const router = useRouter();
  const { currentCustomer } = useAuth();

  const { addresses, loading, error, retry, mutate } = useCustomerAddresses();
  const [saving, setSaving] = useState(false);

  // Add / Edit Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [title, setTitle] = useState('Nhà riêng');
  const [recipientName, setRecipientName] = useState(currentCustomer?.fullName || '');
  const [recipientPhone, setRecipientPhone] = useState(currentCustomer?.phone || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [district, setDistrict] = useState('Quận 1');
  const [note, setNote] = useState('');

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const openAddModal = () => {
    if (!currentCustomer) { router.push('/auth/login'); return; }
    setEditingAddressId(null);
    setRecipientName(currentCustomer.fullName);
    setRecipientPhone(currentCustomer.phone);
    setTitle('Nhà riêng');
    setStreetAddress('');
    setDistrict('Quận 1');
    setNote('');
    setModalVisible(true);
  };

  const openEditModal = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id);
    setTitle(addr.title);
    setRecipientName(addr.recipientName);
    setRecipientPhone(addr.recipientPhone);
    setStreetAddress(addr.streetAddress);
    setDistrict(addr.district);
    setNote(addr.note || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (saving) return;
    if (!streetAddress.trim() || !recipientName.trim() || !recipientPhone.trim() || !district.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ người nhận, điện thoại và địa chỉ.');
      return;
    }
    setSaving(true);
    try {
      const previous = addresses.find(item => item.id === editingAddressId);
      await mutate(editingAddressId ? '/customer/addresses/' + editingAddressId : '/customer/addresses', editingAddressId ? 'PUT' : 'POST', {
        title: title.trim(), recipientName: recipientName.trim(), recipientPhone: recipientPhone.trim(),
        streetAddress: streetAddress.trim(), district: district.trim(), note: note.trim(),
        ward: previous?.ward || '', city: previous?.city || 'TP. Hồ Chí Minh', isDefault: previous?.isDefault || false,
      });
      setModalVisible(false);
    } catch (cause) { Alert.alert('Chưa lưu được', cause instanceof Error ? cause.message : 'Vui lòng thử lại.'); }
    finally { setSaving(false); }
  };
  const handleSetDefault = async (id: string) => {
    if (saving) return;
    setSaving(true);
    try { await mutate('/customer/addresses/' + id + '/default', 'PATCH'); Alert.alert('Thành công', 'Đã đặt địa chỉ làm mặc định phục vụ.'); }
    catch (cause) { Alert.alert('Chưa lưu được', cause instanceof Error ? cause.message : 'Vui lòng thử lại.'); }
    finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!deleteTargetId || saving) return;
    setSaving(true);
    try { await mutate('/customer/addresses/' + deleteTargetId, 'DELETE'); setDeleteTargetId(null); }
    catch (cause) { Alert.alert('Chưa xóa được', cause instanceof Error ? cause.message : 'Vui lòng thử lại.'); }
    finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <IconSymbol name="back" size={20} color={BrandColors.gray800} />
        </Pressable>
        <Text style={styles.headerTitle}>Sổ địa chỉ của bạn</Text>
        <Pressable style={styles.addBtn} disabled={saving || loading} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Thêm</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {!currentCustomer ? <EmptyState icon="user" title="Vui lòng đăng nhập" description="Đăng nhập để quản lý sổ địa chỉ của bạn." actionText="Đăng nhập" onAction={() => router.push('/auth/login')} /> :
          loading || error ? <CatalogState loading={loading} error={error} onRetry={retry} /> :
          addresses.length === 0 ? <EmptyState icon="location" title="Chưa có địa chỉ" description="Thêm địa chỉ đầu tiên để đặt dịch vụ." /> : null}
        {addresses.map((addr) => (
          <AddressCard
            key={addr.id}
            address={addr}
            showActions
            onEdit={() => openEditModal(addr)}
            onDelete={() => setDeleteTargetId(addr.id)}
            onSetDefault={() => handleSetDefault(addr.id)}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddressId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <IconSymbol name="close" size={20} color={BrandColors.gray800} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Tên gợi nhớ (Ví dụ: Nhà riêng, Cơ quan)</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Nhà riêng"
              />

              <Text style={styles.fieldLabel}>Họ tên người nhận</Text>
              <TextInput
                style={styles.input}
                value={recipientName}
                onChangeText={setRecipientName}
              />

              <Text style={styles.fieldLabel}>Số điện thoại liên hệ</Text>
              <TextInput
                style={styles.input}
                value={recipientPhone}
                onChangeText={setRecipientPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>Địa chỉ cụ thể (Số nhà, tên đường)</Text>
              <TextInput
                style={styles.input}
                value={streetAddress}
                onChangeText={setStreetAddress}
                placeholder="Số 123 Nguyễn Thị Minh Khai"
              />

              <Text style={styles.fieldLabel}>Quận / Huyện</Text>
              <TextInput
                style={styles.input}
                value={district}
                onChangeText={setDistrict}
                placeholder="Quận 1"
              />

              <Text style={styles.fieldLabel}>Ghi chú chỉ đường / số phòng</Text>
              <TextInput
                style={styles.input}
                value={note}
                onChangeText={setNote}
                placeholder="Tòa Landmark 2, tầng 15..."
              />

              <Pressable style={styles.saveBtn} disabled={saving} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Lưu địa chỉ'}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={!!deleteTargetId}
        title="Xóa địa chỉ"
        message="Bạn có chắc chắn muốn xóa địa chỉ này khỏi sổ địa chỉ?"
        confirmText="Xóa"
        cancelText="Hủy"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  addBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  scrollContent: {
    padding: Spacing.three,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.four,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray700,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: BrandColors.gray900,
  },
  saveBtn: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 13,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginTop: Spacing.four,
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
