import { reuseSnapshot } from '@/utils/stable-snapshot';
import { staffRating } from '@/utils/staff-profile';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { User, Customer, Staff, UserRole } from '@/types/user';
import { IdentityProfile, IdentitySession, identityRequest } from '@/api/identity';
import { setCustomerNotificationSession } from '@/data/connectedNotifications';
import { connectOperationsSession, onOperationSessionInvalidated } from '@/api/operations';
import { clearPersistedSession, saveRememberedLogin, LoginRole } from '@/utils/remembered-login';

interface AuthContextType {
  accessToken: string | null;
  currentUser: User | null; currentRole: UserRole; currentCustomer: Customer | null; currentStaff: Staff | null;
  isAuthenticated: boolean; isLoading: boolean;
  login: (identifier: string, password: string, role: UserRole, remember?: boolean) => Promise<void>;
  completeRegistration: (session: IdentitySession) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateCustomerProfile: (profile: Pick<Customer, 'fullName' | 'phone' | 'email' | 'avatar'>) => Promise<void>;
  updateAvatar: (avatar: string) => Promise<void>;
  updateStaffProfile: (profile: Pick<Staff, 'phone' | 'email' | 'bio'>) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sessionRef = useRef<IdentitySession | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('CUSTOMER');
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  function apply(profile: IdentityProfile) {
    connectOperationsSession(profile, sessionRef.current?.accessToken || null);
    setCustomerNotificationSession(profile.role === 'CUSTOMER' || profile.role === 'STAFF' ? String(profile.id) : null, sessionRef.current?.accessToken || null);
    const user: User = { ...profile, id: String(profile.id), avatar: profile.avatar, createdAt: profile.createdAt };
    setCurrentUser(previous => reuseSnapshot(previous, user)); setCurrentRole(profile.role);
    setCurrentCustomer(previous => reuseSnapshot(previous, profile.role === 'CUSTOMER' ? {
      id: user.id, userId: user.id, fullName: user.fullName, phone: user.phone, email: user.email, avatar: user.avatar,
      gender: profile.gender || 'OTHER', dateOfBirth: profile.dateOfBirth || undefined,
      totalBookings: profile.totalBookings, rewardPoints: profile.rewardPoints, savedAddressCount: profile.addressCount, defaultAddressLabel: profile.defaultAddress || undefined, createdAt: user.createdAt,
    } : null));
    setCurrentStaff(previous => reuseSnapshot(previous, profile.role === 'STAFF' ? {
      id: user.id, userId: user.id, fullName: user.fullName, phone: user.phone, email: user.email, avatar: user.avatar,
      gender: profile.gender || 'OTHER', dateOfBirth: profile.dateOfBirth || '', birthYear: profile.birthYear || undefined,
      isVerified: !!profile.isVerified, idCardNumber: profile.identityCard || '', experienceYears: profile.experienceYears ?? 0, rating: staffRating(profile.rating, profile.reviewCount),
      reviewCount: profile.reviewCount, completionRate: profile.completionRate ?? 0, satisfactionRate: profile.satisfactionRate ?? 0, status: profile.staffStatus || 'OFFLINE', isOnline: profile.isOnline,
      bio: profile.bio || '', competencies: [], operatingDistricts: [], createdAt: user.createdAt,
    } : null));
  }
  function clear() { sessionRef.current = null; connectOperationsSession(null, null); setCustomerNotificationSession(null, null); setAccessToken(null); setCurrentUser(null); setCurrentCustomer(null); setCurrentStaff(null); }
  useEffect(() => {
    let active = true;
    clear();
    // Credentials may be remembered, but a cold launch always requires explicit login.
    void clearPersistedSession().catch(() => undefined).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => { onOperationSessionInvalidated(clear); return () => onOperationSessionInvalidated(null); }, []);
  const refreshProfile = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) throw new Error('Vui lòng đăng nhập.');
    const profile = await identityRequest<IdentityProfile>('/auth/profile', undefined, session.accessToken);
    if (sessionRef.current === session) apply(profile);
  }, []);
  useEffect(() => {
    const session = sessionRef.current;
    if (!session || !currentUser) return;
    const timer = setTimeout(() => { if (sessionRef.current === session) clear(); }, Math.max(0, Date.parse(session.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [currentUser]);
  const accept = async (session: IdentitySession, credentials?: { identifier: string; password: string; role: LoginRole; remember: boolean }) => {
    const profile = await identityRequest<IdentityProfile>('/auth/profile', undefined, session.accessToken);
    if (credentials) await saveRememberedLogin(credentials.identifier, credentials.password, credentials.role, credentials.remember);
    sessionRef.current = session; setAccessToken(session.accessToken); apply(profile);
  };
  const login = async (identifier: string, password: string, role: UserRole, remember = false) => {
    if (role !== 'CUSTOMER' && role !== 'STAFF') throw new Error('Vui lòng đăng nhập Admin trên website.');
    const session = await identityRequest<IdentitySession>('/auth/login', { identifier, password });
    try {
      if (session.user.role !== role) throw new Error('Tài khoản không thuộc vai trò đang chọn.');
      await accept(session, { identifier, password, role, remember });
    } catch (error) {
      await identityRequest('/auth/logout', {}, session.accessToken).catch(() => undefined);
      throw error;
    }
  };
  const updateCustomerProfile = async (profile: Pick<Customer, 'fullName' | 'phone' | 'email' | 'avatar'>) => {
    const session = sessionRef.current;
    if (!session || session.user.role !== 'CUSTOMER') throw new Error('Vui lòng đăng nhập tài khoản khách hàng.');
    const saved = await identityRequest<IdentityProfile>('/customer/profile', { fullName: profile.fullName, phone: profile.phone }, session.accessToken, 'PATCH');
    if (sessionRef.current === session) apply(saved);
  };
  const updateAvatar = async (avatar: string) => {
    const session = sessionRef.current;
    if (!session || session.user.role === 'STAFF') throw new Error('Vui lòng liên hệ Admin để thay đổi ảnh nhân viên.');
    const saved = await identityRequest<IdentityProfile>('/auth/avatar', { avatar }, session.accessToken, 'PATCH');
    if (sessionRef.current === session) apply(saved);
  };
  const updateStaffProfile = async (profile: Pick<Staff, 'phone' | 'email' | 'bio'>) => {
    const session = sessionRef.current;
    if (!session || session.user.role !== 'STAFF') throw new Error('Vui lòng đăng nhập tài khoản nhân viên.');
    const saved = await identityRequest<IdentityProfile>('/staff/profile', { phone: profile.phone, bio: profile.bio }, session.accessToken, 'PATCH');
    if (sessionRef.current === session) apply(saved);
  };
  const logout = async () => {
    const session = sessionRef.current;
    clear();
    if (session) await identityRequest('/auth/logout', {}, session.accessToken);
  };
  return <AuthContext.Provider value={{ accessToken, currentUser, currentRole, currentCustomer, currentStaff, isAuthenticated: !!currentUser, isLoading,
    login, completeRegistration: accept, refreshProfile, updateCustomerProfile, updateAvatar, updateStaffProfile, logout }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within an AuthProvider'); return context; };
