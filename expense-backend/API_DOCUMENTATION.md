# Expense Management API Documentation

## Overview
This API provides comprehensive expense management functionality including user authentication, expense submission, approval workflows, OCR receipt processing, and administrative features.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication APIs

#### POST /auth/signup
Create a new company and admin user.

**Request Body:**
```json
{
  "email": "admin@company.com",
  "password": "password123",
  "name": "Admin User",
  "country": "United States"
}
```

**Response:**
```json
{
  "message": "Company and admin user created successfully",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "admin@company.com",
    "name": "Admin User",
    "role": "ADMIN",
    "companyId": "company-id"
  },
  "company": {
    "id": "company-id",
    "name": "Admin User's Company",
    "currency": "USD",
    "country": "United States"
  }
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "admin@company.com",
  "password": "password123"
}
```

#### GET /auth/profile
Get current user profile.

**Headers:** Authorization required

### User Management APIs (Admin Only)

#### POST /users
Create a new user.

**Request Body:**
```json
{
  "email": "employee@company.com",
  "password": "password123",
  "name": "Employee Name",
  "role": "EMPLOYEE",
  "managerId": "manager-user-id",
  "isManagerApprover": false
}
```

#### GET /users
Get all users in the company.

#### PUT /users/:userId/role
Update user role.

**Request Body:**
```json
{
  "role": "MANAGER",
  "isManagerApprover": true
}
```

#### POST /users/:userId/manager
Assign manager relationship.

**Request Body:**
```json
{
  "managerId": "manager-user-id"
}
```

#### GET /users/team
Get team members (Manager only).

### Expense APIs

#### POST /expenses
Submit a new expense.

**Request Body:**
```json
{
  "amount": 50.00,
  "currency": "USD",
  "category": "Meals",
  "description": "Business lunch",
  "date": "2024-01-15",
  "expenseLines": [
    {
      "amount": 40.00,
      "description": "Food"
    },
    {
      "amount": 10.00,
      "description": "Tip"
    }
  ]
}
```

#### GET /expenses/my-expenses
Get user's expenses with pagination.

**Query Parameters:**
- `status`: Filter by status (PENDING, APPROVED, REJECTED)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### GET /expenses/:expenseId
Get expense details by ID.

#### PUT /expenses/:expenseId
Update expense (only if PENDING).

#### DELETE /expenses/:expenseId
Delete expense (only if PENDING).

### Approval APIs

#### GET /approvals/pending
Get pending approvals for current user.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### POST /approvals/:requestId/approve
Approve an expense.

**Request Body:**
```json
{
  "comment": "Approved for business travel"
}
```

#### POST /approvals/:requestId/reject
Reject an expense.

**Request Body:**
```json
{
  "comment": "Not business related"
}
```

#### GET /approvals/expense/:expenseId
Get approval history for an expense.

#### POST /approvals/:requestId/override
Override approval (Admin only).

**Request Body:**
```json
{
  "action": "approve",
  "comment": "Admin override"
}
```

#### GET /approvals/company/all
Get all approvals in company (Admin only).

### Company APIs (Admin Only)

#### POST /company/approval-flows
Create approval flow.

**Request Body:**
```json
{
  "name": "Standard Approval Flow",
  "ruleType": "UNANIMOUS",
  "percentageThreshold": 60,
  "specificApproverId": "cfo-user-id",
  "steps": [
    {
      "role": "MANAGER"
    },
    {
      "role": "FINANCE"
    },
    {
      "specificUserId": "director-user-id"
    }
  ]
}
```

#### GET /company/approval-flows
Get all approval flows.

#### PUT /company/approval-flows/:flowId
Update approval flow.

#### DELETE /company/approval-flows/:flowId
Delete approval flow.

#### GET /company/stats
Get company statistics.

#### GET /company/expenses
Get all expenses in company.

### OCR APIs

#### POST /ocr/process-receipt
Process receipt with OCR.

**Request:** Multipart form data
- `receipt`: Image file
- `category`: Expense category
- `description`: Expense description
- `date`: Expense date

**Response:**
```json
{
  "message": "Receipt processed successfully",
  "expense": {
    "id": "expense-id",
    "amount": 45.67,
    "currency": "USD",
    "category": "Meals",
    "description": "Restaurant receipt",
    "status": "PENDING",
    "receiptImageUrl": "path/to/image"
  },
  "ocrData": {
    "totalAmount": 45.67,
    "currency": "USD",
    "date": "2024-01-22",
    "merchant": "Restaurant Name",
    "items": [
      {
        "description": "Food",
        "amount": 40.00
      },
      {
        "description": "Tax",
        "amount": 5.67
      }
    ],
    "confidence": 0.95
  }
}
```

#### GET /ocr/expense/:expenseId/ocr
Get OCR data for expense.

#### PUT /ocr/expense/:expenseId/ocr
Update OCR data for expense.

#### POST /ocr/validate
Validate OCR data.

**Request Body:**
```json
{
  "ocrData": {
    "totalAmount": 45.67,
    "currency": "USD",
    "date": "2024-01-22",
    "merchant": "Restaurant",
    "items": [
      {
        "description": "Food",
        "amount": 40.00
      }
    ]
  }
}
```

## Data Models

### User Roles
- `ADMIN`: Full access to all features
- `MANAGER`: Can approve expenses, manage team
- `EMPLOYEE`: Can submit expenses, view own data
- `FINANCE`: Can approve financial expenses
- `DIRECTOR`: Can approve high-value expenses

### Expense Status
- `PENDING`: Awaiting approval
- `APPROVED`: Approved by all required approvers
- `REJECTED`: Rejected by any approver

### Approval Rule Types
- `UNANIMOUS`: All approvers must approve
- `PERCENTAGE`: Percentage of approvers must approve
- `SPECIFIC`: Specific approver must approve
- `HYBRID`: Combination of rules

## Error Responses

All error responses follow this format:
```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Environment Variables

Create a `.env` file with:
```
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-jwt-secret-key"
PORT=3000
NODE_ENV=development
```

## External APIs Used

1. **Countries API**: `https://restcountries.com/v3.1/all?fields=name,currencies`
   - Used to get country currency information

2. **Exchange Rate API**: `https://api.exchangerate-api.com/v4/latest/{BASE_CURRENCY}`
   - Used for currency conversion

## Features Implemented

✅ **Authentication & User Management**
- Company auto-creation on signup
- Admin user creation
- User role management
- Manager-employee relationships

✅ **Expense Submission**
- Multi-currency support
- Expense categories
- Detailed expense lines
- Currency conversion

✅ **Approval Workflows**
- Multi-level approvals
- Sequential approval steps
- Conditional approval rules
- Manager approver field

✅ **OCR Receipt Processing**
- Receipt image upload
- OCR data extraction
- Auto-expense generation
- Expense line breakdown

✅ **Administrative Features**
- Company statistics
- Approval flow configuration
- User management
- Override capabilities

✅ **API Testing**
- Comprehensive test suite
- Authentication tests
- CRUD operation tests
- Error handling tests
