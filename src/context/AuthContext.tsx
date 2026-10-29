import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, AuthSettings } from '../types';
import { archiveStorage, DEFAULT_AUTH_SETTINGS } from '../services/storage';

const SESSION_ROLE_KEY = 'career_archive_active_role';

interface AuthContextType {
  currentRole: UserRole;
  isAdmin: boolean;
  isViewer: boolean;
  isAuthenticated: boolean;
  authSettings: AuthSettings;
  login: (code: string) => { success: boolean; role?: UserRole; message?: string };
  logout: () => void;
  updateAuthCodes: (adminCode: string, viewerCodes: string[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = sessionStorage.getItem(SESSION_ROLE_KEY);
    if (saved === 'admin' || saved === 'viewer') {
      return saved;
    }
    return null;
  });

  const [authSettings, setAuthSettings] = useState<AuthSettings>(DEFAULT_AUTH_SETTINGS);

  useEffect(() => {
    const loadSettings = async () => {
      const loaded = await archiveStorage.getAuthSettings();
      setAuthSettings(loaded);
    };
    loadSettings();
  }, []);

  const login = (code: string): { success: boolean; role?: UserRole; message?: string } => {
    const trimmed = code.trim();
    if (!trimmed) {
      return { success: false, message: '접속 코드를 입력해주세요.' };
    }

    // 1. Check Admin Code
    if (trimmed === authSettings.adminCode) {
      setCurrentRole('admin');
      sessionStorage.setItem(SESSION_ROLE_KEY, 'admin');
      return { success: true, role: 'admin' };
    }

    // 2. Check 10 Viewer Codes
    if (authSettings.viewerCodes.includes(trimmed)) {
      setCurrentRole('viewer');
      sessionStorage.setItem(SESSION_ROLE_KEY, 'viewer');
      return { success: true, role: 'viewer' };
    }

    return {
      success: false,
      message: '접속 코드가 올바르지 않습니다.'
    };
  };

  const logout = () => {
    setCurrentRole(null);
    sessionStorage.removeItem(SESSION_ROLE_KEY);
  };

  const updateAuthCodes = (newAdminCode: string, newViewerCodes: string[]) => {
    const updated: AuthSettings = {
      adminCode: newAdminCode.trim(),
      viewerCodes: newViewerCodes.map(c => c.trim()).filter(c => c.length > 0)
    };
    archiveStorage.saveAuthSettings(updated);
    setAuthSettings(updated);
  };

  const isAdmin = currentRole === 'admin';
  const isViewer = currentRole === 'viewer';
  const isAuthenticated = currentRole !== null;

  return (
    <AuthContext.Provider
      value={{
        currentRole,
        isAdmin,
        isViewer,
        isAuthenticated,
        authSettings,
        login,
        logout,
        updateAuthCodes,
      }}
    >
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
