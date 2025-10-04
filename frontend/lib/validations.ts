import { z } from 'zod';

export const expenseFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be positive')
    .max(1000000, 'Amount must be less than 1,000,000'),
  category: z.enum([
    'food',
    'transport',
    'entertainment',
    'utilities',
    'shopping',
    'health',
    'education',
    'other',
  ]),
  date: z.string().min(1, 'Date is required'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']).optional(),
  lineItems: z.array(z.any()).optional(),
  receiptUrl: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const signupFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters'),
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be less than 100 characters'),
  role: z
    .string()
    .min(1, 'Role is required')
    .max(50, 'Role must be less than 50 characters'),
  country: z
    .string()
    .min(1, 'Country is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type SignupFormValues = z.infer<typeof signupFormSchema>;
