import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { Notification } from '@/types/notification';
import { IconSymbol } from './IconSymbol';
import { formatNotificationTime, getNotificationPresentation } from '@/data/notificationAdapter';

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  disabled?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  disabled = false,
}) => {
  const { icon, background, label } = getNotificationPresentation(notification);

  return (
    <Pressable
      style={[styles.container, !notification.isRead && styles.unreadContainer]}
      disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }}
      accessibilityLabel={`${label}. ${notification.title}. ${notification.isRead ? 'Đã đọc' : 'Chưa đọc'}${disabled ? '. Đang cập nhật trạng thái đã đọc' : ''}`}
      onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: background }]}>
        <IconSymbol name={icon} size={20} />
      </View>

      <View style={styles.body}>
        <Text style={styles.typeLabel}>{label} • {notification.isRead ? 'Đã đọc' : 'Chưa đọc'}</Text>
        <View style={styles.topRow}>
          <Text
            numberOfLines={1}
            style={[styles.title, !notification.isRead && styles.titleUnread]}>
            {notification.title}
          </Text>
          {!notification.isRead && <View style={styles.unreadDot} />}
        </View>

        <Text numberOfLines={2} style={styles.content}>
          {notification.content}
        </Text>

        <Text style={styles.timeText}>
          {formatNotificationTime(notification.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  typeLabel: { fontSize: 11, fontWeight: '600', color: BrandColors.gray500, marginBottom: 5 },
  container: {
    flexDirection: 'row',
    padding: Spacing.three,
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  unreadContainer: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  body: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.gray900,
    flex: 1,
  },
  titleUnread: {
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.primary,
    marginLeft: 6,
  },
  content: {
    fontSize: 12,
    color: BrandColors.gray600,
    lineHeight: 17,
    marginBottom: 6,
  },
  timeText: {
    fontSize: 11,
    color: BrandColors.gray400,
  },
});
