import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
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
    let inFlight=false;
    const refresh=async () => {
      if(inFlight || controller.signal.aborted || AppState.currentState !== 'active') return;
      inFlight=true;
      try { await NotificationRepository.load(actor,controller.signal); } catch { /* The next visible poll retries. */ }
      finally { inFlight=false; }
    };
    void refresh();
    const timer=setInterval(()=>void refresh(),10000);
    const foreground=AppState.addEventListener('change',state=>{if(state==='active')void refresh();});
    return () => {clearInterval(timer);foreground.remove();controller.abort();};
  }, [actor]));
  return { actor, notifications, unreadCount: notifications.filter((item) => !item.isRead).length };
}
