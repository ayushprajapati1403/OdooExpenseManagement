const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  companyName?: string;
  role?: string;
  country?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  role: string;
  country: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  async signUp(data: SignUpData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    this.setToken(response.token);
    return response;
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.setToken(response.token);
    return response;
  }

  async signOut(): Promise<void> {
    try {
      await this.request('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Ignore errors on logout
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.token) return null;

    try {
      const response = await this.request<{ user: AuthUser }>('/api/auth/me');
      return response.user;
    } catch (error) {
      this.setToken(null);
      return null;
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
    });
    
    this.setToken(response.token);
    return response;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Legacy exports for compatibility
export const signUp = (data: SignUpData) => apiClient.signUp(data);
export const signIn = (email: string, password: string) => apiClient.signIn(email, password);
export const signOut = () => apiClient.signOut();
export const getCurrentUser = () => apiClient.getCurrentUser();
