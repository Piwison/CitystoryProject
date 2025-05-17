"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { authService } from '@/services/authService';

// Define User interface
export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
  lastLogin?: string;
  isModerator?: boolean;
}

export type AuthType = 'credentials' | 'google' | null;

export interface UserWithAuth extends User {
  authType?: AuthType;
}

interface AuthContextType {
  user: UserWithAuth | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authType: AuthType;
  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserWithAuth | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authType, setAuthType] = useState<AuthType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle session-based auth (NextAuth)
    if (status === 'authenticated' && session?.user) {
      setUser({
        id: session.user.email || '',
        email: session.user.email || '',
        name: session.user.name || '',
        username: session.user.email?.split('@')[0] || '',
        avatarUrl: session.user.image || undefined,
        authType: 'google', // For NextAuth session, assume it's from Google SSO
      });
      setIsAuthenticated(true);
      setAuthType('google');
      setIsLoading(false);
    } 
    // Handle traditional token-based auth
    else if (status === 'unauthenticated') {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      if (token) {
        setIsAuthenticated(true);
        setAuthType('credentials');
        // Optionally fetch user profile here from the backend
        // This part depends on your API structure
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setAuthType(null);
      }
      setIsLoading(false);
    }
  }, [session, status]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Always send username to backend
      await authService.login({ username, password });
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { redirect: true, callbackUrl: '/dashboard' });
      // The rest is handled by the useEffect that watches the session
    } catch (error) {
      console.error('Google login error:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      if (authType === 'google') {
        await signOut({ redirect: false });
      } else {
        await authService.logout();
      }
      setUser(null);
      setIsAuthenticated(false);
      setAuthType(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      setUser({
        ...response.user,
        authType: 'credentials'
      });
      setIsAuthenticated(true);
      setAuthType('credentials');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get the current access token (NextAuth or credentials)
  const getAccessToken = () => {
    if (authType === 'google' && session && (session as any).accessToken) {
      return (session as any).accessToken as string;
    }
    if (authType === 'credentials' && typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading,
        authType,
        login: login, 
        loginWithGoogle: handleLoginWithGoogle,
        logout: handleLogout, 
        register: handleRegister,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}; 