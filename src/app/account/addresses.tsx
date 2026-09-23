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
import { getAddressesByCustomerId, mockCustomerAddresses } from '@/data';
import { CustomerAddress } from '@/types/user';

export default function AddressManagementScreen() {
  const router = useRouter();
  const { currentCustomer } = useAuth();

  const customerId = currentCustomer?.id || 'cust-001';
  const [addresses, setAddresses] = useState<CustomerAddress[]>(
    getAddressesByCustomerId(customerId)
  );

  // Add / Edit Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [title, setTitle] = useState('Nhà riêng');
  const [recipientName, setRecipientName] = useState(currentCustomer?.fullName || 'Nguyễn Văn A');
  const [recipientPhone, setRecipientPhone] = useState(currentCustomer?.phone || '0901234001');
  const [streetAddress, setStreetAddress] = useState('');
  const [district, setDistrict] = useState('Quận 1');
  const [note, setNote] = useState('');

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingAddressId(null);
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

  const handleSave = () => {
    if (!streetAddress.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số nhà, tên đường.');
      return;
    }

    if (editingAddressId) {
      // Edit
      const updated = addresses.map((a) => {
        if (a.id === editingAddressId) {
          return {
            ...a,
            title,
            recipientName,
            recipientPhone,
            streetAddress,
            district,
            note,
            fullAddress: `${streetAddress}, ${district}, TP. Hồ Chí Minh`,
          };
        }
        return a;
      });
      setAddresses(updated);
    } else {
      // Add
      const newAddr: CustomerAddress = {
        id: `addr-${Date.now()}`,
        customerId,
        title,
        recipientName,
        recipientPhone,
        streetAddress,
        ward: 'Phường Đa Kao',
        district,
        city: 'TP. Hồ Chí Minh',
        fullAddress: `${streetAddress}, ${district}, TP. Hồ Chí Minh`,
        latitude: 10.78,
        longitude: 106.7,
        isDefault: addresses.length === 0,
        note,
      };
      setAddresses([...addresses, newAddr]);
    }

    setModalVisible(false);
  };

  const handleSetDefault = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    Alert.alert('Thành công', 'Đã đặt địa chỉ làm mặc định phục vụ.');
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    const updated = addresses.filter((a) => a.id !== deleteTargetId);
    setAddresses(updated);
    setDeleteTargetId(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <IconSymbol name="back" size={20} color={BrandColors.gray800} />
        </Pressable>
        <Text style={styles.headerTitle}>Sổ địa chỉ của bạn</Text>
        <Pressable style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Thêm</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
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

              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Lưu địa chỉ</Text>
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
