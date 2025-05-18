export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  createdAt?: string;
  isVerified?: boolean;
  lastLogin?: string;
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  username: string;
}

export interface AuthResponse {
  token?: string;
  access?: string;
  refreshToken?: string;
  refresh?: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
} 