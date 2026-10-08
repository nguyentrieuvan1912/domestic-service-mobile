import React, { useEffect, useReducer } from 'react';
import { Pressable, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ChatRepository, getChatActor } from '@/data/chatRepository';
import { StaffRepository } from '@/data/staffRepository';

/** Resolve an authorized conversation at render and again at press time. Never route a booking ID as a chat ID. */
export function BookingChatLink({ bookingId, staffId, style, textStyle, label = 'Nhắn tin' }: {
  bookingId?: string;
  staffId?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  label?: string;
}) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  useEffect(() => {
    const unsubscribeBooking = StaffRepository.subscribe(refresh);
    const unsubscribeChat = ChatRepository.subscribe(refresh);
    return () => { unsubscribeBooking(); unsubscribeChat(); };
  }, []);
  const resolve = () => ChatRepository.resolveForBooking(bookingId, getChatActor(currentUser), staffId);
  const access = resolve();
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
        else refresh();
      }}>
      <Text style={textStyle}>{enabled ? label : disabledLabel}</Text>
    </Pressable>
  );
}
