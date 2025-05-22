import { LoginCredentials, RegisterData, AuthResponse, User } from '../types/auth';
import { api, setupAuthInterceptors, JWT_TOKEN_KEY, JWT_REFRESH_TOKEN_KEY, setTokens as setApiTokens, clearTokens as clearApiTokens } from '@/lib/api';
import { jwtDecode } from 'jwt-decode';

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

// JWT token interface
interface JwtPayload {
  exp: number;
  user_id: string;
  email: string;
  iat: number;
}

class AuthService {
  constructor() {
    if (typeof window !== 'undefined') {
      // Initialize auth interceptors with the refreshToken method
      setupAuthInterceptors(this.refreshToken.bind(this));
      
      // Listen for auth expiration events
      window.addEventListener('auth:expired', this.handleAuthExpired.bind(this));
    }
  }

  private handleAuthExpired() {
    // Clear tokens and user data on auth expiration
    this.clearTokens();
    this.clearCurrentUser();
    
    // Redirect to login page or show auth modal
    if (typeof window !== 'undefined') {
      // Optionally redirect to login
      // window.location.href = '/login';
      
      // Or dispatch event for UI to handle (show login modal, etc)
      window.dispatchEvent(new CustomEvent('auth:requireLogin'));
    }
  }

  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/login/', credentials);
      
      // Handle response with access/refresh tokens
      const token = response.data.token || response.data.access;
      const refreshToken = response.data.refreshToken || response.data.refresh;
      
      if (!token || !refreshToken) {
        console.error('Invalid auth response:', response.data);
        throw new Error('Invalid authentication response');
      }
      
      // Store tokens in both API module and AuthService
      this.setTokens(token, refreshToken);
      this.setCurrentUser(response.data.user);
      
      // Return normalized data
      return {
        token,
        refreshToken, 
        user: response.data.user
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  public async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/register/', data);
      
      // Handle response with access/refresh tokens
      const token = response.data.token || response.data.access;
      const refreshToken = response.data.refreshToken || response.data.refresh;
      
      if (!token || !refreshToken) {
        console.error('Invalid auth response:', response.data);
        throw new Error('Invalid authentication response');
      }
      
      // Store tokens in both API module and AuthService
      this.setTokens(token, refreshToken);
      this.setCurrentUser(response.data.user);
      
      // Return normalized data
      return {
        token,
        refreshToken,
        user: response.data.user
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      // Call logout endpoint if token exists
      if (this.isAuthenticated()) {
        await api.post('/logout/');
      }
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
      this.clearTokens();
      this.clearCurrentUser();
      throw new Error('No refresh token available');
    }

    try {
      // Call refresh token endpoint with the current refresh token
      const response = await api.post<{ token: string, refresh?: string, access?: string }>('/token/refresh/', { 
        refresh: refreshToken 
      });
      
      // Get the new access token (supporting both token and access field names)
      const newToken = response.data.token || response.data.access;
      
      if (!newToken) {
        throw new Error('Invalid refresh response: missing access token');
      }
      
      // Get the new refresh token (if provided) or use the existing one
      const newRefreshToken = response.data.refresh || refreshToken;
      
      // Validate the new token structure before storing
      try {
        this.decodeToken(newToken);
      } catch (decodeError) {
        console.error('New token validation failed:', decodeError);
        throw new Error('Invalid token received from refresh');
      }
      
      // Update stored tokens
      this.setTokens(newToken, newRefreshToken);
      
      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear tokens on refresh failure
      this.clearTokens();
      this.clearCurrentUser();
      // Dispatch auth expired event to notify the application
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:expired'));
      }
      throw error;
    }
  }

  public setTokens(token: string, refreshToken: string): void {
    // Use the API module's token storage
    setApiTokens(token, refreshToken);
  }

  public clearTokens(): void {
    // Use the API module's token clearing
    clearApiTokens();
  }

  public getToken(): string | null {
    return safeStorage.getItem(JWT_TOKEN_KEY);
  }

  public getRefreshToken(): string | null {
    return safeStorage.getItem(JWT_REFRESH_TOKEN_KEY);
  }

  public isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Decode the JWT to check expiration
      const decoded = this.decodeToken(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      if (decoded.exp < currentTime) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  public decodeToken(token: string): JwtPayload {
    try {
      // Add comprehensive validation before attempting to decode
      if (!token || token === 'undefined' || token === 'null') {
        throw new Error('Missing or invalid token');
      }
      
      // Validate JWT format (should have 3 parts separated by dots)
      if (!token.includes('.') || token.split('.').length !== 3) {
        throw new Error('Invalid token structure');
      }
      
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.error('Token decode error:', error);
      throw new Error('Invalid token format');
    }
  }

  public getTokenExpiration(): Date | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const decoded = this.decodeToken(token);
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
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

  public getUserIdFromToken(): string | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const decoded = this.decodeToken(token);
      return decoded.user_id;
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService(); 