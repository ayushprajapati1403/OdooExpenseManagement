export interface ExpenseLineItem {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  description?: string;
  status: ExpenseStatus;
  currency: Currency;
  lineItems?: ExpenseLineItem[];
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'utilities'
  | 'shopping'
  | 'health'
  | 'education'
  | 'other';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export interface ExpenseFormData {
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  description?: string;
  currency?: Currency;
  lineItems?: ExpenseLineItem[];
  receiptUrl?: string;
}

export interface ExpenseFilter {
  status?: ExpenseStatus;
  category?: ExpenseCategory;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ExpenseSummary {
  total: number;
  byCategory: Record<ExpenseCategory, number>;
  count: number;
}

export type ThemeMode = 'light' | 'dark';

export type ApprovalRuleType = 'specific_user' | 'any_user' | 'percentage' | 'auto_approve';
export type ApprovalAction = 'approved' | 'rejected';
export type ApprovalRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalFlow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalFlowStep {
  id: string;
  flowId: string;
  stepOrder: number;
  stepName: string;
  ruleType: ApprovalRuleType;
  thresholdPercentage?: number;
  requiredApprovers: number;
  approvers?: string[];
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  expenseId: string;
  flowId: string;
  currentStep: number;
  status: ApprovalRequestStatus;
  expense?: Expense;
  flow?: ApprovalFlow;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalActionRecord {
  id: string;
  requestId: string;
  stepId: string;
  approverId: string;
  action: ApprovalAction;
  comment?: string;
  approverName?: string;
  stepName?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  department?: string;
  position?: string;
  location?: string;
  bio?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  id: string;
  name: string;
  currency: Currency;
  defaultApprovalFlow?: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  size?: string;
  address?: string;
  country?: string;
  timezone?: string;
  fiscalYearStart?: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  expenseSubmitted: boolean;
  expenseApproved: boolean;
  expenseRejected: boolean;
  approvalRequired: boolean;
  weeklyDigest: boolean;
  monthlyReport: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  lastPasswordChange?: string;
}
