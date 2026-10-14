import { API_BASE_URL } from './catalog';
import { UserRole, UserStatus, Staff } from '@/types/user';
export interface IdentityUser { id: number; fullName: string; email: string; phone: string; role: UserRole; status: UserStatus }
export interface IdentityProfile extends IdentityUser {
  isVerified?: boolean;
  avatar: string; createdAt: string; gender: 'MALE' | 'FEMALE' | 'OTHER' | null; dateOfBirth: string | null;
  totalBookings: number; rewardPoints: number; identityCard: string | null; bio: string | null; experienceYears: number | null; rating: number | null;
  addressCount: number; defaultAddress: string | null; reviewCount: number; completionRate: number | null; satisfactionRate: number | null; staffStatus: Staff['status'] | null; isOnline: boolean;
}
export interface IdentitySession { accessToken: string; expiresAt: string; user: IdentityUser }
export interface EmailChallenge { challengeId: string; email: string; expiresAt: string; resendAt: string }
export interface EmailVerified { verificationToken: string; email: string; expiresAt: string }
export async function identityRequest<T>(path: string, body?: object, token?: string, method = body ? 'POST' : 'GET', signal?: AbortSignal): Promise<T> {
  if (!API_BASE_URL) throw new Error('Chưa cấu hình địa chỉ backend.');
  let response: Response;
  try { response = await fetch(`${API_BASE_URL}/api/v1/identity${path}`, {
    method, signal, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }); } catch { throw new Error('Không thể kết nối hệ thống. Vui lòng thử lại.'); }
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || 'Không thể xử lý yêu cầu. Vui lòng kiểm tra thông tin.');
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}
