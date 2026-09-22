import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { isAuthenticated, currentRole } = useAuth();
  if (!isAuthenticated) return <Redirect href="/auth/login" />;
  return <Redirect href={currentRole === 'STAFF' ? '/staff' as never : '/(tabs)'} />;
}
