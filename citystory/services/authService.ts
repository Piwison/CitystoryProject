import { LoginCredentials, RegisterData, AuthResponse, User } from '../types/auth';
import { api, setupAuthInterceptors } from '@/lib/api';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'current_user';

// Safe localStorage wrapper
const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

class AuthService {
  constructor() {
    if (typeof window !== 'undefined') {
      setupAuthInterceptors(
        this.getToken.bind(this),
        this.refreshToken.bind(this),
        this.clearTokens.bind(this)
      );
    }
  }

  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/login/', credentials);
    this.setTokens(response.data.token, response.data.refreshToken);
    this.setCurrentUser(response.data.user);
    return response.data;
  }

  public async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('register/', data);
    this.setTokens(response.data.token, response.data.refreshToken);
    this.setCurrentUser(response.data.user);
    return response.data;
  }

  public async logout(): Promise<void> {
    try {
      await api.post('/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
      this.clearCurrentUser();
    }
  }

  public async refreshToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<{ token: string }>('/token/refresh/', { refreshToken });
    this.setTokens(response.data.token, refreshToken);
    return response.data.token;
  }

  public setTokens(token: string, refreshToken: string): void {
    safeStorage.setItem(TOKEN_KEY, token);
    safeStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  public clearTokens(): void {
    safeStorage.removeItem(TOKEN_KEY);
    safeStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  public getToken(): string | null {
    return safeStorage.getItem(TOKEN_KEY);
  }

  public getRefreshToken(): string | null {
    return safeStorage.getItem(REFRESH_TOKEN_KEY);
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  public setCurrentUser(user: User): void {
    safeStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public getCurrentUser(): User | null {
    const userStr = safeStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  public clearCurrentUser(): void {
    safeStorage.removeItem(USER_KEY);
  }
}

export const authService = new AuthService(); 