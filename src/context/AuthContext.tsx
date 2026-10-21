import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole, AccessLog } from '../types';
import { INITIAL_USERS, INITIAL_ACCESS_LOGS } from '../data/mockData';

interface AuthContextType {
  currentUser: User;
  switchUser: (role: UserRole) => void;
  isAdmin: boolean;
  accessLogs: AccessLog[];
  logAction: (action: AccessLog['action'], targetInfo?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // default admin
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>(INITIAL_ACCESS_LOGS);

  const logAction = (action: AccessLog['action'], targetInfo?: string) => {
    const newLog: AccessLog = {
      id: `log-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action,
      targetInfo,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ipAddress: '192.168.1.100'
    };
    setAccessLogs(prev => [newLog, ...prev]);
  };

  const switchUser = (role: UserRole) => {
    const target = INITIAL_USERS.find(u => u.role === role) || INITIAL_USERS[0];
    setCurrentUser(target);
    logAction('login', `${role === 'admin' ? '관리자' : '팀원(읽기 전용)'} 모드 전환`);
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <AuthContext.Provider value={{ currentUser, switchUser, isAdmin, accessLogs, logAction }}>
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
