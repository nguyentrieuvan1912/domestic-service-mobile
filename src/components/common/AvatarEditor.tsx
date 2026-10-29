import React, { useRef, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View, type StyleProp, type ImageStyle } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { remoteImageSource } from '@/utils/image-source';

export default function AvatarEditor({ style, disabled = false }: { style: StyleProp<ImageStyle>; disabled?: boolean }) {
  const { currentUser, updateAvatar } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const save = async (avatar: string) => {
    await updateAvatar(avatar);
    setOpen(false);
  };
  const run = async (pick: boolean) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (pick) {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true });
        if (result.canceled) return;
        const asset = result.assets[0];
        if (!asset.base64 || asset.base64.length > 4194304) throw new Error('Chọn ảnh JPG hoặc PNG tối đa 3 MB.');
        // Expo returns JPEG base64 after editing on native; web preserves the selected file type.
        const mime = asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
        await save(`data:${mime};base64,${asset.base64}`);
      } else await save('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa cập nhật được ảnh. Vui lòng thử lại.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="Thay đổi ảnh đại diện" disabled={disabled || busy} onPress={event => { event.stopPropagation(); setError(''); setOpen(true); }}>
      <Image source={remoteImageSource(currentUser?.avatar || '/api/v1/identity/default-avatar.png')} style={style} />
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => { if (!busy) setOpen(false); }}>
      <View style={{ flex: 1, backgroundColor: '#0007', justifyContent: 'center', padding: 28 }}><View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, gap: 18 }}>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>Ảnh đại diện</Text>
        <Image source={remoteImageSource(currentUser?.avatar || '/api/v1/identity/default-avatar.png')} style={{ width: 90, height: 90, borderRadius: 45, alignSelf: 'center' }} />
        {error ? <Text accessibilityRole="alert" style={{ color: '#DC2626' }}>{error}</Text> : null}
        {busy ? <Text>Đang cập nhật ảnh...</Text> : null}
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void run(true)} style={({ pressed }) => [styles.button, styles.chooseButton, pressed && styles.pressed, busy && styles.disabled]}>
            <Text style={[styles.buttonText, styles.chooseText]}>Chọn ảnh mới</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void run(false)} style={({ pressed }) => [styles.button, styles.removeButton, pressed && styles.pressed, busy && styles.disabled]}>
            <Text style={styles.buttonText}>Không sử dụng ảnh đại diện</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => setOpen(false)} style={({ pressed }) => [styles.button, styles.closeButton, pressed && styles.pressed, busy && styles.disabled]}>
            <Text style={[styles.buttonText, styles.closeText]}>Đóng</Text>
          </Pressable>
        </View>
      </View></View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  actions: { gap: 10, marginTop: 4 },
  button: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  chooseButton: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  removeButton: { borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' },
  closeButton: { borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  buttonText: { color: '#334155', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  chooseText: { color: '#047857', fontWeight: '700' },
  closeText: { color: '#64748B' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.45 },
});
