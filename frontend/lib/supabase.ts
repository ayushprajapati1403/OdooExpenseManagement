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
    
    // Map backend data to frontend format
    response.expenses = response.expenses.map(expense => ({
      id: expense.id,
      title: expense.description || 'Untitled Expense', // Map description to title
      amount: Number(expense.amount) || 0,
      category: this.mapCategoryToFrontend(expense.category),
      date: expense.date,
      description: expense.description,
      status: expense.status.toLowerCase(), // Convert PENDING to pending
      currency: expense.currency,
      lineItems: expense.expenseLines || [],
      receiptUrl: expense.receiptImageUrl,
      createdAt: expense.createdAt,
      updatedAt: expense.createdAt // Backend doesn't have updatedAt yet
    }));
    
    return response;
  }

  private mapCategoryToFrontend(backendCategory: string): string {
    const categoryMap: Record<string, string> = {
      'Meals': 'food',
      'Transport': 'transport',
      'Entertainment': 'entertainment',
      'Utilities': 'utilities',
      'Shopping': 'shopping',
      'Health': 'health',
      'health': 'health', // Handle lowercase version
      'Education': 'education',
      'Other': 'other'
    };
    return categoryMap[backendCategory] || 'other';
  }

  async createExpense(expenseData: any) {
    const response = await this.request<{
      message: string;
      expense: any;
    }>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
    
    // Map backend response to frontend format
    const mappedExpense = {
      id: response.expense.id,
      title: response.expense.description || 'Untitled Expense',
      amount: Number(response.expense.amount) || 0,
      category: this.mapCategoryToFrontend(response.expense.category),
      date: response.expense.date,
      description: response.expense.description,
      status: response.expense.status.toLowerCase(),
      currency: response.expense.currency,
      lineItems: response.expense.expenseLines || [],
      receiptUrl: response.expense.receiptImageUrl,
      createdAt: response.expense.createdAt,
      updatedAt: response.expense.createdAt
    };
    
    return {
      message: response.message,
      expense: mappedExpense
    };
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
  async getPendingApprovals(page = 1, limit = 10, includeAll = false) {
    const includeAllParam = includeAll ? '&includeAll=true' : '';
    const response = await this.request<{
      approvals: any[];
      pagination: any;
    }>(`/flows/pending?page=${page}&limit=${limit}${includeAllParam}`);
    
    // Map backend approval data to frontend format
    response.approvals = response.approvals.map(approval => {
      console.log('🔧 API Client mapping approval:', {
        id: approval.id,
        description: approval.expense?.description,
        descriptionType: typeof approval.expense?.description,
        descriptionLength: approval.expense?.description?.length || 0
      });
      
      return {
        id: approval.id,
        expenseId: approval.expenseId,
        flowId: approval.flowId || 'default-flow',
        currentStep: approval.stepOrder,
        totalSteps: 1, // For now, hardcode to 1 since current flow has 1 step
        status: approval.status.toLowerCase(), // Convert PENDING to pending
        createdAt: approval.createdAt,
        updatedAt: approval.decidedAt || approval.createdAt,
        expense: approval.expense ? {
          id: approval.expense.id,
          title: approval.expense.description || 'Untitled Expense',
          amount: Number(approval.expense.amount) || 0,
          category: this.mapCategoryToFrontend(approval.expense.category),
          date: approval.expense.date,
          description: approval.expense.description,
          status: approval.expense.status.toLowerCase(),
          currency: approval.expense.currency,
          lineItems: approval.expense.expenseLines || [],
          receiptUrl: approval.expense.receiptImageUrl,
          createdAt: approval.expense.createdAt,
          updatedAt: approval.expense.createdAt,
          user: approval.expense.user
        } : null
      };
    });
    
    return response;
  }

  async getAllApprovals(page = 1, limit = 10) {
    const response = await this.request<{
      approvals: any[];
      pagination: any;
    }>(`/flows/all?page=${page}&limit=${limit}`);
    
    // Map backend approval data to frontend format
    response.approvals = response.approvals.map(approval => ({
      id: approval.id,
      expenseId: approval.expenseId,
      flowId: approval.flowId || 'default-flow',
      currentStep: approval.stepOrder,
      status: approval.status.toLowerCase(), // Convert PENDING to pending
      createdAt: approval.createdAt,
      updatedAt: approval.decidedAt || approval.createdAt,
      expense: approval.expense ? {
        id: approval.expense.id,
        title: approval.expense.description || 'Untitled Expense',
        amount: Number(approval.expense.amount) || 0,
        category: this.mapCategoryToFrontend(approval.expense.category),
        date: approval.expense.date,
        description: approval.expense.description,
        status: approval.expense.status.toLowerCase(),
        currency: approval.expense.currency,
        lineItems: approval.expense.expenseLines || [],
        receiptUrl: approval.expense.receiptImageUrl,
        createdAt: approval.expense.createdAt,
        updatedAt: approval.expense.createdAt,
        user: approval.expense.user
      } : null
    }));
    
    return response;
  }

  async approveExpense(requestId: string, comment?: string) {
    console.log('🔧 API Client: Approving expense', requestId, comment);
    const result = await this.request<{
      message: string;
    }>(`/flows/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
    console.log('🔧 API Client: Approval result', result);
    return result;
  }

  async rejectExpense(requestId: string, comment?: string) {
    console.log('🔧 API Client: Rejecting expense', requestId, comment);
    const result = await this.request<{
      message: string;
    }>(`/flows/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
    console.log('🔧 API Client: Rejection result', result);
    return result;
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

  // Company Settings
  async getCompanySettings() {
    return this.request<{
      company: {
        id: string;
        name: string;
        currency: string;
        country: string;
        defaultApprovalFlow?: string;
        logoUrl?: string;
        website?: string;
        industry?: string;
        size?: string;
        address?: string;
        timezone?: string;
        fiscalYearStart?: string;
        createdAt: string;
        updatedAt: string;
      };
    }>('/company/settings');
  }

  async updateCompanySettings(settings: any) {
    return this.request<{
      message: string;
      company: any;
    }>('/company/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
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
