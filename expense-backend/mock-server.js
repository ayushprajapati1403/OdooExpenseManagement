import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Expense Backend is running!' });
});

// Basic auth endpoints for testing
app.post('/api/auth/signup', (req, res) => {
  res.status(201).json({
    message: 'Mock signup successful',
    token: 'mock-token-123',
    user: {
      id: 'mock-user-id',
      email: req.body.email,
      name: req.body.name,
      role: 'ADMIN'
    },
    company: {
      id: 'mock-company-id',
      name: `${req.body.name}'s Company`,
      currency: 'USD',
      country: req.body.country
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.status(200).json({
    message: 'Mock login successful',
    token: 'mock-token-123',
    user: {
      id: 'mock-user-id',
      email: req.body.email,
      name: 'Mock User',
      role: 'ADMIN'
    },
    company: {
      id: 'mock-company-id',
      name: 'Mock Company',
      currency: 'USD',
      country: 'United States'
    }
  });
});

app.get('/api/auth/profile', (req, res) => {
  res.status(200).json({
    user: {
      id: 'mock-user-id',
      email: 'mock@example.com',
      name: 'Mock User',
      role: 'ADMIN'
    },
    company: {
      id: 'mock-company-id',
      name: 'Mock Company',
      currency: 'USD',
      country: 'United States'
    }
  });
});

// Basic user endpoints for testing
app.post('/api/users', (req, res) => {
  res.status(201).json({
    message: 'Mock user created successfully',
    user: {
      id: 'mock-user-id-2',
      email: req.body.email,
      name: req.body.name,
      role: req.body.role
    }
  });
});

app.get('/api/users', (req, res) => {
  res.status(200).json({
    users: [
      {
        id: 'mock-user-id',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN'
      },
      {
        id: 'mock-user-id-2',
        email: 'employee@example.com',
        name: 'Employee User',
        role: 'EMPLOYEE'
      }
    ]
  });
});

// Basic expense endpoints for testing
app.post('/api/expenses', (req, res) => {
  res.status(201).json({
    message: 'Mock expense submitted successfully',
    expense: {
      id: 'mock-expense-id',
      amount: req.body.amount,
      currency: req.body.currency,
      category: req.body.category,
      description: req.body.description,
      date: req.body.date,
      status: 'PENDING',
      userId: 'mock-user-id',
      companyId: 'mock-company-id'
    }
  });
});

app.get('/api/expenses/my-expenses', (req, res) => {
  res.status(200).json({
    expenses: [
      {
        id: 'mock-expense-id',
        amount: 100.50,
        currency: 'USD',
        category: 'Travel',
        description: 'Mock expense',
        date: '2024-01-15T10:00:00Z',
        status: 'PENDING'
      }
    ],
    currentPage: 1,
    totalPages: 1,
    totalExpenses: 1
  });
});

// Basic flow endpoints for testing
app.post('/api/flows/approval-flows', (req, res) => {
  res.status(201).json({
    message: 'Mock approval flow created successfully',
    approvalFlow: {
      id: 'mock-flow-id',
      name: req.body.name,
      ruleType: req.body.ruleType || 'UNANIMOUS',
      steps: req.body.steps || []
    }
  });
});

app.get('/api/flows/pending', (req, res) => {
  res.status(200).json({
    approvals: [
      {
        id: 'mock-approval-id',
        expenseId: 'mock-expense-id',
        status: 'PENDING',
        stepOrder: 1
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1
    }
  });
});

// Basic company endpoints for testing
app.post('/api/company/approval-flows', (req, res) => {
  res.status(201).json({
    message: 'Mock company approval flow created successfully',
    approvalFlow: {
      id: 'mock-company-flow-id',
      name: req.body.name,
      ruleType: req.body.ruleType || 'UNANIMOUS',
      steps: req.body.steps || []
    }
  });
});

app.get('/api/company/statistics', (req, res) => {
  res.status(200).json({
    statistics: {
      totalUsers: 5,
      totalExpenses: 25,
      pendingExpenses: 10,
      approvedExpenses: 12,
      rejectedExpenses: 3,
      totalApprovedAmount: 5000.00
    }
  });
});

// Basic OCR endpoints for testing
app.get('/api/ocr/formats', (req, res) => {
  res.status(200).json({
    supportedFormats: ['image/jpeg', 'image/png', 'image/gif'],
    maxFileSize: 10485760,
    maxFileSizeMB: 10
  });
});

app.post('/api/ocr/process-receipt', (req, res) => {
  res.status(200).json({
    message: 'Mock receipt processed successfully',
    ocrResult: {
      success: true,
      confidence: 0.95,
      extractedData: {
        merchant: 'Mock Store',
        totalAmount: 10.50,
        currency: 'USD',
        date: '2024-01-15',
        items: [
          { description: 'Item 1', amount: 5.25 },
          { description: 'Item 2', amount: 5.25 }
        ]
      },
      expenseData: {
        amount: 10.50,
        currency: 'USD',
        category: 'Meals',
        description: 'Mock Store purchase',
        date: '2024-01-15',
        expenseLines: [
          { amount: 5.25, description: 'Item 1' },
          { amount: 5.25, description: 'Item 2' }
        ]
      }
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Mock Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
