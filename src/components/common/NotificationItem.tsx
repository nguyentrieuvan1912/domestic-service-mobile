import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { Notification } from '@/types/notification';

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
}) => {
  const getIconAndBg = (type: string) => {
    switch (type) {
      case 'BOOKING':
        return { icon: '📅', bg: '#E0F2FE' };
      case 'STAFF':
        return { icon: '🧑‍🔧', bg: '#DCFCE7' };
      case 'PAYMENT':
        return { icon: '💳', bg: '#FEF3C7' };
      case 'PROMOTION':
        return { icon: '🎁', bg: '#FCE7F3' };
      default:
        return { icon: '🔔', bg: '#F1F5F9' };
    }
  };

  const { icon, bg } = getIconAndBg(notification.type);

  return (
    <Pressable
      style={[styles.container, !notification.isRead && styles.unreadContainer]}
      onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: bg }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>

      <View style={styles.body}>
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
          {new Date(notification.createdAt).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
          })}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
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
