import { Request, Response, NextFunction } from 'express';

export const validateSignup = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name, country } = req.body;
  const errors: string[] = [];

  if (!email) errors.push('Email is required');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');

  if (!password) errors.push('Password is required');
  else if (password.length < 6) errors.push('Password must be at least 6 characters');

  if (!name) errors.push('Name is required');
  else if (name.trim().length < 2) errors.push('Name must be at least 2 characters');

  if (!country) errors.push('Country is required');

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  const errors: string[] = [];

  if (!email) errors.push('Email is required');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');

  if (!password) errors.push('Password is required');

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

export const validateUser = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name, role } = req.body;
  const errors: string[] = [];

  if (!email) errors.push('Email is required');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');

  if (!password) errors.push('Password is required');
  else if (password.length < 6) errors.push('Password must be at least 6 characters');

  if (!name) errors.push('Name is required');
  else if (name.trim().length < 2) errors.push('Name must be at least 2 characters');

  if (!role) errors.push('Role is required');
  else if (!['ADMIN', 'MANAGER', 'EMPLOYEE', 'FINANCE', 'DIRECTOR'].includes(role)) {
    errors.push('Role must be one of: ADMIN, MANAGER, EMPLOYEE, FINANCE, DIRECTOR');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

export const validateUserRole = (req: Request, res: Response, next: NextFunction) => {
  const { role } = req.body;
  const errors: string[] = [];

  if (!role) errors.push('Role is required');
  else if (!['ADMIN', 'MANAGER', 'EMPLOYEE', 'FINANCE', 'DIRECTOR'].includes(role)) {
    errors.push('Role must be one of: ADMIN, MANAGER, EMPLOYEE, FINANCE, DIRECTOR');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

export const validateManagerAssignment = (req: Request, res: Response, next: NextFunction) => {
  const { managerId } = req.body;
  const errors: string[] = [];

  if (!managerId) errors.push('Manager ID is required');
  else if (typeof managerId !== 'string' || managerId.trim().length === 0) {
    errors.push('Manager ID must be a valid string');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

export const validateExpense = (req: Request, res: Response, next: NextFunction) => {
  const { amount, currency, category, date, expenseLines } = req.body;
  const errors: string[] = [];

  if (!amount) errors.push('Amount is required');
  else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) errors.push('Amount must be a positive number');

  if (!currency) errors.push('Currency is required');
  else if (currency.length !== 3) errors.push('Currency must be a 3-letter code');

  if (!category) errors.push('Category is required');
  else if (category.trim().length < 2) errors.push('Category must be at least 2 characters');

  if (!date) errors.push('Date is required');
  else if (isNaN(Date.parse(date))) errors.push('Invalid date format');

  // Validate expense lines if provided
  if (expenseLines && Array.isArray(expenseLines)) {
    expenseLines.forEach((line: any, index: number) => {
      if (!line.amount || isNaN(parseFloat(line.amount)) || parseFloat(line.amount) <= 0) {
        errors.push(`Expense line ${index + 1}: Amount must be a positive number`);
      }
      if (!line.description || line.description.trim().length === 0) {
        errors.push(`Expense line ${index + 1}: Description is required`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

export const validateExpenseUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { amount, currency, category, date, expenseLines } = req.body;
  const errors: string[] = [];

  // Only validate provided fields
  if (amount !== undefined) {
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      errors.push('Amount must be a positive number');
    }
  }

  if (currency !== undefined) {
    if (currency.length !== 3) {
      errors.push('Currency must be a 3-letter code');
    }
  }

  if (category !== undefined) {
    if (category.trim().length < 2) {
      errors.push('Category must be at least 2 characters');
    }
  }

  if (date !== undefined) {
    if (isNaN(Date.parse(date))) {
      errors.push('Invalid date format');
    }
  }

  // Validate expense lines if provided
  if (expenseLines && Array.isArray(expenseLines)) {
    expenseLines.forEach((line: any, index: number) => {
      if (!line.amount || isNaN(parseFloat(line.amount)) || parseFloat(line.amount) <= 0) {
        errors.push(`Expense line ${index + 1}: Amount must be a positive number`);
      }
      if (!line.description || line.description.trim().length === 0) {
        errors.push(`Expense line ${index + 1}: Description is required`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

export const validateApprovalFlow = (req: Request, res: Response, next: NextFunction) => {
  const { name, ruleType, percentageThreshold, specificApproverId, steps } = req.body;
  const errors: string[] = [];

  if (!name) errors.push('Name is required');
  else if (name.trim().length < 2) errors.push('Name must be at least 2 characters');

  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    errors.push('Steps array is required and must not be empty');
  } else {
    steps.forEach((step: any, index: number) => {
      if (!step.role && !step.specificUserId) {
        errors.push(`Step ${index + 1}: Either role or specificUserId is required`);
      }
      if (step.role && !['ADMIN', 'MANAGER', 'EMPLOYEE', 'FINANCE', 'DIRECTOR'].includes(step.role)) {
        errors.push(`Step ${index + 1}: Invalid role`);
      }
    });
  }

  if (ruleType && !['UNANIMOUS', 'PERCENTAGE', 'SPECIFIC', 'HYBRID'].includes(ruleType)) {
    errors.push('Rule type must be one of: UNANIMOUS, PERCENTAGE, SPECIFIC, HYBRID');
  }

  if (ruleType === 'PERCENTAGE' && (!percentageThreshold || percentageThreshold < 1 || percentageThreshold > 100)) {
    errors.push('Percentage threshold must be between 1 and 100 for PERCENTAGE rule type');
  }

  if (ruleType === 'SPECIFIC' && !specificApproverId) {
    errors.push('Specific approver ID is required for SPECIFIC rule type');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

export const validateApprovalAction = (req: Request, res: Response, next: NextFunction) => {
  const { action, comment } = req.body;
  const errors: string[] = [];

  if (!action) errors.push('Action is required');
  else if (!['approve', 'reject'].includes(action)) {
    errors.push('Action must be either approve or reject');
  }

  if (comment && typeof comment !== 'string') {
    errors.push('Comment must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};
