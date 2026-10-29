import Constants from 'expo-constants';
import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import { operationRequest } from './operations';
export type BookingCall = { id: number; bookingId: number; conversationId: number; callerId: number; calleeId: number; status: 'RINGING' | 'ACCEPTED' | 'ENDED' | 'DECLINED' | 'MISSED' };
export const supportsNativeCalls = () => Platform.OS !== 'web' && Constants.executionEnvironment !== 'storeClient' && !!(NativeModules.WebRTCModule || TurboModuleRegistry.get('WebRTCModule'));
export const getCall = (id: string) => operationRequest<BookingCall>('booking', '/calls/' + id);
export const callAction = (id: string, action: 'ACCEPT' | 'DECLINE' | 'END') => operationRequest<BookingCall>('booking', '/calls/' + id, 'PATCH', { action });
export const callKey = () => 'call-' + Date.now() + '-' + Math.random().toString(36).slice(2);
