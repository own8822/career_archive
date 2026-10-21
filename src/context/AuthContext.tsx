import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/mockData';

interface AuthContextType {
  currentUser: User;
  switchUser: (role: UserRole) => void;
  isAdmin: boolean;
  logAction: (action: string, detail?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // default admin

  const logAction = (_action: string, _detail?: string) => {
    // Audit logging hook for future extensions
  };

  const switchUser = (role: UserRole) => {
    const target = INITIAL_USERS.find(u => u.role === role) || INITIAL_USERS[0];
    setCurrentUser(target);
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <AuthContext.Provider value={{ currentUser, switchUser, isAdmin, logAction }}>
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
