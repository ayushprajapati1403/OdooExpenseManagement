const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  isManagerApprover?: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  role: string;
  companyName: string;
  companyCountry: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      try {
        this.token = localStorage.getItem('auth_token');
      } catch (error) {
        console.warn('Failed to access localStorage:', error);
        this.token = null;
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'An error occurred' };
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      try {
        if (token) {
          localStorage.setItem('auth_token', token);
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.warn('Failed to access localStorage:', error);
      }
    }
  }

  async signUp(data: SignUpData): Promise<AuthResponse> {
    const response = await this.request<{
      message: string;
      user: AuthUser;
      company: any;
      token: string;
    }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    this.setToken(response.token);
    return {
      user: response.user,
      token: response.token
    };
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<{
      message: string;
      user: AuthUser;
      token: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.setToken(response.token);
    return {
      user: response.user,
      token: response.token
    };
  }

  async signOut(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Ignore errors on logout
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    // Only run on client side
    if (typeof window === 'undefined') return null;
    
    if (!this.token) return null;

    try {
      const response = await this.request<{ user: AuthUser }>('/auth/profile');
      return response.user;
    } catch (error) {
      this.setToken(null);
      return null;
    }
  }

  async getUserProfile(): Promise<AuthUser> {
    const response = await this.request<{ user: AuthUser }>('/auth/profile');
    return response.user;
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await this.request<{
      message: string;
      user: AuthUser;
      token: string;
    }>('/auth/refresh', {
      method: 'POST',
    });
    
    this.setToken(response.token);
  return {
      user: response.user,
      token: response.token
    };
  }

  // Expense Management
  async getExpenses(page = 1, limit = 10) {
    const response = await this.request<{
      expenses: any[];
      pagination: any;
    }>(`/expenses/my-expenses?page=${page}&limit=${limit}`);
    
    // Ensure amount is converted to number
    response.expenses = response.expenses.map(expense => ({
      ...expense,
      amount: Number(expense.amount) || 0
    }));
    
    return response;
  }

  async createExpense(expenseData: any) {
    const response = await this.request<{
      message: string;
      expense: any;
    }>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
    
    // Ensure amount is converted to number
    response.expense.amount = Number(response.expense.amount) || 0;
    
    return response;
  }

  async updateExpense(expenseId: string, expenseData: any) {
    return this.request<{
      message: string;
      expense: any;
    }>(`/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  }

  async deleteExpense(expenseId: string) {
    return this.request<{
      message: string;
    }>(`/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  // Approval Management
  async getPendingApprovals(page = 1, limit = 10) {
    return this.request<{
      approvals: any[];
      pagination: any;
    }>(`/flows/pending?page=${page}&limit=${limit}`);
  }

  async approveExpense(requestId: string, comment?: string) {
    return this.request<{
      message: string;
    }>(`/flows/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async rejectExpense(requestId: string, comment?: string) {
    return this.request<{
      message: string;
    }>(`/flows/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  // Company Management
  async getCompanyStatistics() {
    return this.request<{
      statistics: any;
    }>('/company/statistics');
  }

  async getCompanyUsers() {
    return this.request<{
      users: any[];
    }>('/company/users');
  }

  async getCompanyStats() {
    return this.request<{
      statistics: {
        totalUsers: number;
        totalExpenses: number;
        pendingExpenses: number;
        approvedExpenses: number;
        rejectedExpenses: number;
        totalApprovalFlows: number;
        monthlyExpenseTrend: Array<{
          month: string;
          count: number;
          amount: number;
        }>;
      };
    }>('/company/statistics');
  }

  async getCompanyExpenses(page = 1, limit = 10) {
    return this.request<{
      expenses: any[];
      pagination: any;
    }>(`/company/expenses?page=${page}&limit=${limit}`);
  }

  // Approval Flows
  async getApprovalFlows() {
    return this.request<{
      approvalFlows: any[];
    }>('/flows/approval-flows');
  }

  async createApprovalFlow(flowData: any) {
    return this.request<{
      message: string;
      approvalFlow: any;
    }>('/flows/approval-flows', {
      method: 'POST',
      body: JSON.stringify(flowData),
    });
  }

  // OCR Processing
  async processReceipt(file: File) {
    const formData = new FormData();
    formData.append('receipt', file);
    
    return this.request<{
      message: string;
      ocrData: {
        totalAmount: number;
        currency: string;
        merchant: string;
        date: string;
        items: Array<{
          description: string;
          amount: number;
        }>;
        confidence: number;
      };
    }>('/ocr/process-receipt', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type header for FormData
    });
  }

  async createExpenseFromReceipt(file: File) {
    const formData = new FormData();
    formData.append('receipt', file);
    
    return this.request<{
      message: string;
      expense: any;
    }>('/ocr/create-expense', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type header for FormData
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Legacy exports for compatibility
export const signUp = (data: SignUpData) => apiClient.signUp(data);
export const signIn = (email: string, password: string) => apiClient.signIn(email, password);
export const signOut = () => apiClient.signOut();
export const getCurrentUser = () => apiClient.getCurrentUser();
