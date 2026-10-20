import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import CommunityScreen from '@/components/community/CommunityScreen';

export default function StaffCommunityScreen() {
  const { currentStaff } = useAuth();
  if (!currentStaff) return <Redirect href="/auth/login" />;
  return <CommunityScreen staffNavigation />;
}
