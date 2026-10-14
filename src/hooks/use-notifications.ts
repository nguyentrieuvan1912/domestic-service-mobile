import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { NotificationRepository } from '@/data/connectedNotifications';
import { getNotificationActor } from '@/data/notificationAdapter';

// Customer data is loaded from Identity. Staff retains its existing integration boundary.
export function useNotifications() {
  const { currentUser } = useAuth();
  const actor = useMemo(() => getNotificationActor(currentUser), [currentUser]);
  const getSnapshot = useCallback(() => NotificationRepository.getSnapshot(actor), [actor]);
  const notifications = useSyncExternalStore(NotificationRepository.subscribe, getSnapshot, getSnapshot);
  useFocusEffect(useCallback(() => {
    if (!actor) return;
    const controller = new AbortController();
    void NotificationRepository.load(actor, controller.signal).catch(() => {});
    const timer=setInterval(()=>void NotificationRepository.load(actor,controller.signal).catch(()=>{}),10000);
    return () => {clearInterval(timer);controller.abort();};
  }, [actor]));
  return { actor, notifications, unreadCount: notifications.filter((item) => !item.isRead).length };
}
