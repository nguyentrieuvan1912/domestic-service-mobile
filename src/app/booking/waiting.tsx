import { useLocalSearchParams } from 'expo-router';
import { StaffResponseWaiting } from '@/components/booking/StaffResponseWaiting';

export default function WaitingBookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StaffResponseWaiting key={id} bookingId={id || ''} />;
}
