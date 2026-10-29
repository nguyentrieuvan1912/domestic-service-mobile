import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ChatRepository, getChatActor } from '@/data/connectedChatRepository';

/** Mounted inbox consumers share one scoped poll; it never marks messages read. */
export function useChatInbox() {
  const { currentUser } = useAuth();
  const actor = useMemo(() => getChatActor(currentUser), [currentUser]);
  const conversations = useSyncExternalStore(ChatRepository.subscribe, ChatRepository.list, ChatRepository.list);
  const isLoaded = useSyncExternalStore(ChatRepository.subscribe, ChatRepository.getLoaded, ChatRepository.getLoaded);
  const error = useSyncExternalStore(ChatRepository.subscribe, ChatRepository.getError, ChatRepository.getError);
  useFocusEffect(useCallback(() => {
    if (!actor) return;
    const stop = ChatRepository.watch(actor, () => AppState.currentState === 'active');
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void ChatRepository.loadList(actor).catch(() => {}); });
    return () => { stop(); listener.remove(); };
  }, [actor]));
  const unreadCount = actor ? conversations.filter(item => actor.role !== 'CUSTOMER' || !item.customerTrashedAt).reduce((sum, item) => sum + (item[actor.role === 'CUSTOMER' ? 'unreadCountCustomer' : 'unreadCountStaff'] || 0), 0) : 0;
  return { actor, conversations, unreadCount, error, isLoaded };
}
