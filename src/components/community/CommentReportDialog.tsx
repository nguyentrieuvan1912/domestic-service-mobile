import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { operationRequest } from '@/api/operations';
import { REPORT_REASONS, type CommunityComment } from '@/api/community';
import { IconSymbol } from '@/components/common/IconSymbol';
import { BrandColors, BorderRadius } from '@/constants/theme';

export function CommentReportDialog({
  postId,
  comment,
  onClose,
  onSaved,
}: {
  postId: number;
  comment: CommunityComment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [reason, setReason] = useState('SPAM');
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);

  const send = async () => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      await operationRequest('identity', `/community/posts/${postId}/comments/${comment.id}/reports`, 'POST', {
        reason,
        detail: detail.trim(),
      });
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa gửi được báo cáo.');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };

  const isSubmitDisabled = busy || (reason === 'OTHER' && !detail.trim());

  return (
    <Modal animationType="slide" onRequestClose={() => { if (!busy) onClose(); }}>
      <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.header}>
            <View style={s.headerTitleRow}>
              <View style={s.headerIconBadge}>
                <IconSymbol name="flag" size={18} color="#B45309" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>Báo cáo bình luận</Text>
                <Text style={s.headerSubtitle}>Giúp cộng đồng CleanMaster luôn văn minh</Text>
              </View>
            </View>
            <Pressable
              disabled={busy}
              accessibilityLabel="Đóng báo cáo"
              onPress={onClose}
              style={({ pressed }) => [s.closeButton, pressed && s.pressed]}
            >
              <IconSymbol name="close" size={18} color={BrandColors.gray600} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            <View style={s.quoteCard}>
              <View style={s.quoteHeader}>
                <IconSymbol name="chat" size={14} color={BrandColors.primaryDark} />
                <Text style={s.quoteAuthor}>{comment.author}</Text>
              </View>
              <Text numberOfLines={4} style={s.quoteBody}>
                {comment.content || `Đính kèm ${comment.media?.length || 0} ảnh / video`}
              </Text>
            </View>

            <View style={s.sectionBlock}>
              <Text style={s.sectionTitle}>Lý do báo cáo</Text>
              <Text style={s.sectionSubtitle}>
                Chọn lý do phù hợp để quản trị viên xem xét nội dung và tệp đính kèm.
              </Text>

              <View style={s.choicesList}>
                {REPORT_REASONS.map(item => {
                  const isSelected = reason === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      disabled={busy}
                      style={({ pressed }) => [
                        s.choice,
                        isSelected && s.choiceSelected,
                        pressed && !busy && s.pressed,
                      ]}
                      onPress={() => setReason(item.id)}
                    >
                      <View style={[s.radioOuter, isSelected && s.radioOuterSelected]}>
                        {isSelected && <View style={s.radioInner} />}
                      </View>
                      <Text style={[s.choiceLabel, isSelected && s.choiceLabelSelected]}>{item.label}</Text>
                      {isSelected && <IconSymbol name="check" size={16} color={BrandColors.primaryDark} />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={s.sectionBlock}>
              <Text style={s.sectionTitle}>
                Chi tiết bổ sung {reason === 'OTHER' ? '(bắt buộc)' : '(không bắt buộc)'}
              </Text>
              <TextInput
                accessibilityLabel="Chi tiết báo cáo"
                editable={!busy}
                value={detail}
                onChangeText={setDetail}
                placeholder={
                  reason === 'OTHER'
                    ? 'Vui lòng mô tả cụ thể vấn đề bạn gặp phải…'
                    : 'Chia sẻ thêm ngữ cảnh nếu cần…'
                }
                placeholderTextColor={BrandColors.gray400}
                multiline
                maxLength={2000}
                style={s.input}
              />
            </View>

            {!!error && (
              <View style={s.errorBox}>
                <IconSymbol name="warning" size={16} color="#B91C1C" />
                <Text accessibilityRole="alert" style={s.errorText}>
                  {error}
                </Text>
              </View>
            )}

            <View style={s.footerActions}>
              <Pressable
                disabled={busy}
                onPress={onClose}
                style={({ pressed }) => [s.cancelBtn, pressed && s.pressed]}
              >
                <Text style={s.cancelBtnText}>Huỷ</Text>
              </Pressable>
              <Pressable
                disabled={isSubmitDisabled}
                style={({ pressed }) => [
                  s.submitBtn,
                  isSubmitDisabled && s.submitBtnDisabled,
                  pressed && !isSubmitDisabled && s.pressed,
                ]}
                onPress={() => void send()}
              >
                <IconSymbol name="send" size={16} color="#FFFFFF" />
                <Text style={s.submitBtnText}>{busy ? 'Đang gửi…' : 'Gửi báo cáo'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2ECE7',
  },
  headerTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 18,
    gap: 18,
    paddingBottom: 32,
  },
  quoteCard: {
    padding: 14,
    gap: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE8E2',
    borderLeftWidth: 3.5,
    borderLeftColor: BrandColors.primary,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quoteAuthor: {
    fontWeight: '700',
    fontSize: 13,
    color: '#164E3B',
  },
  quoteBody: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#475569',
  },
  sectionBlock: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#64748B',
  },
  choicesList: {
    gap: 8,
    marginTop: 4,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE8E2',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  choiceSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: '#ECFDF5',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioOuterSelected: {
    borderColor: BrandColors.primaryDark,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BrandColors.primaryDark,
  },
  choiceLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  choiceLabelSelected: {
    color: '#064E3B',
    fontWeight: '700',
  },
  input: {
    minHeight: 108,
    maxHeight: 200,
    textAlignVertical: 'top',
    padding: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE8E2',
    borderRadius: 14,
    fontSize: 14,
    lineHeight: 20,
    color: '#1E293B',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  submitBtn: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00875F',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 18,
  },
  submitBtnDisabled: {
    opacity: 0.48,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
  },
});
