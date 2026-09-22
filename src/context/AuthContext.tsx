import React, { createContext, useContext, useState } from 'react';
import { User, Customer, Staff, UserRole } from '@/types/user';
import { mockUsers } from '@/data/users';
import { mockCustomers } from '@/data/customers';
import { mockStaffs } from '@/data/staffs';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  currentCustomer: Customer | null;
  currentStaff: Staff | null;
  isAuthenticated: boolean;
  login: (phoneOrEmail: string, role: UserRole) => boolean;
  quickLoginAsCustomer: (customerId?: string) => void;
  quickLoginAsStaff: (staffId?: string) => void;
  switchRole: (newRole: UserRole) => void;
  updateCustomerProfile: (profile: Pick<Customer, 'fullName' | 'phone' | 'email' | 'avatar'>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Người dùng chọn đúng vai trò trước khi vào luồng ứng dụng tương ứng.
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('CUSTOMER');
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);

  const login = (phoneOrEmail: string, role: UserRole): boolean => {
    const trimmed = phoneOrEmail.trim().toLowerCase();
    const user = mockUsers.find(
      (u) =>
        u.role === role &&
        (u.phone === trimmed || u.email.toLowerCase() === trimmed)
    );

    if (user) {
      setCurrentUser(user);
      setCurrentRole(role);
      if (role === 'CUSTOMER') {
        const cust = mockCustomers.find((c) => c.userId === user.id) || mockCustomers[0];
        setCurrentCustomer(cust);
        setCurrentStaff(null);
      } else {
        const staff = mockStaffs.find((s) => s.userId === user.id) || mockStaffs[0];
        setCurrentStaff(staff);
        setCurrentCustomer(null);
      }
      return true;
    }
    return false;
  };

  const quickLoginAsCustomer = (customerId: string = 'cust-001') => {
    const cust = mockCustomers.find((c) => c.id === customerId) || mockCustomers[0];
    const user = mockUsers.find((u) => u.id === cust.userId) || mockUsers[0];
    setCurrentUser(user);
    setCurrentRole('CUSTOMER');
    setCurrentCustomer(cust);
    setCurrentStaff(null);
  };

  const quickLoginAsStaff = (staffId: string = 'staff-001') => {
    const staff = mockStaffs.find((s) => s.id === staffId) || mockStaffs[0];
    const user = mockUsers.find((u) => u.id === staff.userId) || mockUsers[11];
    setCurrentUser(user);
    setCurrentRole('STAFF');
    setCurrentStaff(staff);
    setCurrentCustomer(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (newRole === 'CUSTOMER') {
      quickLoginAsCustomer();
    } else if (newRole === 'STAFF') {
      quickLoginAsStaff();
    }
  };

  const updateCustomerProfile = (profile: Pick<Customer, 'fullName' | 'phone' | 'email' | 'avatar'>) => {
    setCurrentCustomer((customer) => (customer ? { ...customer, ...profile } : customer));
    setCurrentUser((user) => (user ? { ...user, ...profile } : user));
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentCustomer(null);
    setCurrentStaff(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        currentCustomer,
        currentStaff,
        isAuthenticated: !!currentUser,
        login,
        quickLoginAsCustomer,
        quickLoginAsStaff,
        switchRole,
        updateCustomerProfile,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
