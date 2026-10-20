import React, { useMemo } from 'react';
import { Pressable, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ChatRepository } from '@/data/connectedChatRepository';
import { useChatInbox } from '@/hooks/use-chat-inbox';

/** Resolve an authorized conversation at render and again at press time. Never route a booking ID as a chat ID. */
export function BookingChatLink({ bookingId, staffId, style, textStyle, label = 'Nhắn tin' }: {
  bookingId?: string;
  staffId?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  label?: string;
}) {
  'use no memo'; // Resolve live repository access when the subscribed inbox changes.
  const router = useRouter();
  const { actor, conversations } = useChatInbox();
  const resolve = () => ChatRepository.resolveForBooking(bookingId, actor, staffId);
  const access = useMemo(() => ChatRepository.resolveForBooking(bookingId, actor, staffId, conversations), [bookingId, staffId, actor, conversations]);
  const enabled = access.kind === 'READY';
  const disabledLabel = access.kind === 'UNAUTHENTICATED' ? 'Đăng nhập để nhắn tin' :
    access.kind === 'FORBIDDEN' ? 'Không có quyền chat' : 'Ca chưa liên kết chat';
  return (
    <Pressable style={[style, !enabled && { opacity: 0.55 }]} disabled={!enabled}
      accessibilityRole="button" accessibilityState={{ disabled: !enabled }}
      accessibilityLabel={enabled ? label : access.reason}
      onPress={() => {
        const latest = resolve();
        if (latest.kind === 'READY') router.push({ pathname: '/chat/[id]', params: { id: latest.conversation.id } });
        else void ChatRepository.loadList(actor).catch(() => {});
      }}>
      <Text style={textStyle}>{enabled ? label : disabledLabel}</Text>
    </Pressable>
  );
}
