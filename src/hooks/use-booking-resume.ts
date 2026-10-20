import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect, useIsFocused } from 'expo-router';

export function useBookingResume() {
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [check, setCheck] = useState({ revision: 0, now: Date.now() });
  const refresh = useCallback(() => setCheck(previous => ({ revision: previous.revision + 1, now: Date.now() })), []);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  useEffect(() => {
    let previous = AppState.currentState;
    const subscription = AppState.addEventListener('change', next => {
      setForeground(next === 'active');
      if (next === 'active' && previous !== 'active') refresh();
      previous = next;
    });
    return () => subscription.remove();
  }, [refresh]);
  return { active: focused && foreground, revision: check.revision, now: check.now };
}
