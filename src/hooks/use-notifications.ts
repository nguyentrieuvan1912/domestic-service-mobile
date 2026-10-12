import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NotificationRepository } from '@/data/notificationRepository';
import { getNotificationActor } from '@/data/notificationAdapter';

// Local store subscription only: no push transport or fake realtime connection.
export function useNotifications() {
  const { currentUser } = useAuth();
  const actor = useMemo(() => getNotificationActor(currentUser), [currentUser]);
  const getSnapshot = useCallback(() => NotificationRepository.getSnapshot(actor), [actor]);
  const notifications = useSyncExternalStore(NotificationRepository.subscribe, getSnapshot, getSnapshot);
  return { actor, notifications, unreadCount: notifications.filter((item) => !item.isRead).length };
}
