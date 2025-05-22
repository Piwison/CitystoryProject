"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { authService } from '@/services/authService';
import { api, setAuthTokenGetter, JWT_TOKEN_KEY, JWT_REFRESH_TOKEN_KEY } from '@/lib/api';

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

  // Configure the API token getter to use our JWT tokens
  useEffect(() => {
    setAuthTokenGetter(() => authService.getToken());
    
    // Listen for auth expiration events
    const handleAuthExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      setAuthType(null);
    };
    
    window.addEventListener('auth:expired', handleAuthExpired);
    window.addEventListener('auth:requireLogin', () => {
      // Show login modal or redirect to login page
      console.log('Authentication required. Please login.');
    });
    
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
      window.removeEventListener('auth:requireLogin', () => {});
    };
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      // Check for JWT token first (preferred auth method)
      if (authService.isAuthenticated()) {
        try {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser({
              ...currentUser,
              authType: 'credentials'
            });
            setIsAuthenticated(true);
            setAuthType('credentials');
          }
        } catch (error) {
          console.error('Error loading user from JWT:', error);
          // Clear invalid tokens
          authService.clearTokens();
          authService.clearCurrentUser();
        }
      } 
      // Fall back to NextAuth session for SSO users
      else if (status === 'authenticated' && session && session.user) {
        try {
          // For SSO users through NextAuth, exchange the session for JWT tokens
          if (session.user.email) {
            try {
              // Call your backend to get JWT tokens using the SSO identity
              const response = await api.post('/auth/convert-session/', {
                email: session.user.email,
                name: session.user.name || '',
                image: session.user.image || '',
                provider: 'google' // Specify the provider
              });
              
              if (response.data.access && response.data.refresh) {
                // Store the JWT tokens using the correct response field names
                authService.setTokens(response.data.access, response.data.refresh);
                
                // Store user info
                const userInfo = {
                  id: response.data.user?.id || (session.user as any).id || session.user.email || '',
                  email: session.user.email || '',
                  name: session.user.name || '',
                  username: session.user.email ? session.user.email.split('@')[0] : '',
                  avatarUrl: session.user.image || undefined,
                  isModerator: response.data.user?.is_moderator || false,
                  authType: 'google' as AuthType
                };
                
                authService.setCurrentUser(userInfo);
                setUser(userInfo);
                setIsAuthenticated(true);
                setAuthType('google');
              } else {
                console.error('Invalid token response format:', response.data);
              }
            } catch (conversionError) {
              console.error('Session conversion error:', conversionError);
            }
          }
        } catch (error) {
          console.error('Error converting NextAuth session to JWT:', error);
        }
      }
      
      setIsLoading(false);
    };
    
    initializeAuth();
  }, [session, status]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login({ username, password });
      setUser({
        ...response.user,
        authType: 'credentials'
      });
      setIsAuthenticated(true);
      setAuthType('credentials');
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
      // Always attempt to logout from backend with JWT
      await authService.logout();
      
      // For users who logged in with SSO, also sign out from NextAuth
      if (authType === 'google') {
        await signOut({ redirect: false });
      }
      
      // Clear state
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

  // Helper to get the current access token (JWT is always preferred)
  const getAccessToken = () => {
    // Always prefer JWT tokens
    return authService.getToken();
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