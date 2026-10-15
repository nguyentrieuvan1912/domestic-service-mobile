import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { ChatRepository, getChatActor } from '@/data/connectedChatRepository';

/** Mounted inbox consumers share one scoped poll; it never marks messages read. */
export function useChatInbox() {
  const { currentUser } = useAuth();
  const actor = useMemo(() => getChatActor(currentUser), [currentUser]);
  const conversations = useSyncExternalStore(ChatRepository.subscribe, ChatRepository.list, ChatRepository.list);
  useEffect(() => {
    if (!actor) return;
    const stop = ChatRepository.watch(actor, () => AppState.currentState !== 'background');
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void ChatRepository.loadList(actor).catch(() => {}); });
    return () => { stop(); listener.remove(); };
  }, [actor]);
  const unreadCount = actor ? conversations.reduce((sum, item) => sum + (item[actor.role === 'CUSTOMER' ? 'unreadCountCustomer' : 'unreadCountStaff'] || 0), 0) : 0;
  return { actor, conversations, unreadCount };
}
