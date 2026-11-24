import { reuseSnapshot } from '@/utils/stable-snapshot';
import { staffRating } from '@/utils/staff-profile';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { User, Customer, Staff, UserRole } from '@/types/user';
import { IdentityProfile, IdentityRequestError, IdentitySession, identityRequest } from '@/api/identity';
import { setCustomerNotificationSession } from '@/data/connectedNotifications';
import { connectOperationsSession, onOperationSessionInvalidated } from '@/api/operations';
import { clearLegacyLoginStorage, readRememberedSession, storeRememberedSession } from '@/utils/remembered-login';

interface AuthContextType {
  accessToken: string | null;
  currentUser: User | null; currentRole: UserRole; currentCustomer: Customer | null; currentStaff: Staff | null;
  isAuthenticated: boolean; isLoading: boolean;
  login: (identifier: string, password: string, role: UserRole, remember: boolean) => Promise<boolean>;
  completeRegistration: (session: IdentitySession) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateCustomerProfile: (profile: Pick<Customer, 'fullName' | 'phone' | 'email' | 'avatar'>) => Promise<void>;
  updateAvatar: (avatar: string) => Promise<void>;
  updateStaffProfile: (profile: Pick<Staff, 'phone' | 'email' | 'bio'>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
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
  function startSession(session: IdentitySession, profile: IdentityProfile) {
    sessionRef.current = session;
    setAccessToken(session.accessToken);
    apply(profile);
  }
  function expireSession() {
    clear();
    void storeRememberedSession(null).catch(() => {});
  }
  useEffect(() => {
    const controller = new AbortController();
    async function restoreSession() {
      try {
        await clearLegacyLoginStorage();
        const saved = await readRememberedSession();
        if (!saved || controller.signal.aborted) return;
        const profile = await identityRequest<IdentityProfile>('/auth/profile', undefined, saved.accessToken, 'GET', controller.signal);
        if (controller.signal.aborted) return;
        if ((profile.role !== 'CUSTOMER' && profile.role !== 'STAFF') || Date.parse(saved.expiresAt) <= Date.now()) {
          await storeRememberedSession(null);
          return;
        }
        startSession({ ...saved, user: profile }, profile);
      } catch (error) {
        if (!controller.signal.aborted && error instanceof IdentityRequestError && [401, 403].includes(error.status)) {
          await storeRememberedSession(null).catch(() => {});
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void restoreSession();
    return () => controller.abort();
  }, []);
  useEffect(() => { onOperationSessionInvalidated(expireSession); return () => onOperationSessionInvalidated(null); }, []);
  const refreshProfile = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) throw new Error('Vui lòng đăng nhập.');
    const profile = await identityRequest<IdentityProfile>('/auth/profile', undefined, session.accessToken);
    if (sessionRef.current === session) apply(profile);
  }, []);
  useEffect(() => {
    const session = sessionRef.current;
    if (!session || !accessToken) return;
    const timer = setTimeout(() => { if (sessionRef.current === session) expireSession(); }, Math.max(0, Date.parse(session.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [accessToken]);
  const accept = async (session: IdentitySession, remember = false) => {
    const profile = await identityRequest<IdentityProfile>('/auth/profile', undefined, session.accessToken);
    if (profile.id !== session.user.id || profile.role !== session.user.role) throw new Error('Phiên đăng nhập không khớp với tài khoản.');
    const stored = await storeRememberedSession(remember ? session : null).then(() => true, () => false);
    startSession(session, profile);
    return stored;
  };
  const completeRegistration = async (session: IdentitySession) => { await accept(session); };
  const login = async (identifier: string, password: string, role: UserRole, remember: boolean) => {
    if (role !== 'CUSTOMER' && role !== 'STAFF') throw new Error('Vui lòng đăng nhập Admin trên website.');
    const session = await identityRequest<IdentitySession>('/auth/login', { identifier, password, role });
    try {
      if (session.user.role !== role) throw new Error('Tài khoản không thuộc vai trò đang chọn.');
      return await accept(session, remember);
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
  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    const session = sessionRef.current;
    const role = session?.user.role;
    if (!session || (role !== 'CUSTOMER' && role !== 'STAFF')) throw new Error('Vui lòng đăng nhập.');
    await identityRequest<void>('/auth/password', { currentPassword, newPassword, confirmPassword }, session.accessToken, 'PATCH');

  };
  const logout = async () => {
    const session = sessionRef.current;
    clear();
    const forget = storeRememberedSession(null);
    await Promise.all([forget, session && identityRequest('/auth/logout', {}, session.accessToken)]);
  };
  return <AuthContext.Provider value={{ accessToken, currentUser, currentRole, currentCustomer, currentStaff, isAuthenticated: !!currentUser, isLoading,
    login, completeRegistration, refreshProfile, updateCustomerProfile, updateAvatar, updateStaffProfile, changePassword, logout }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within an AuthProvider'); return context; };
