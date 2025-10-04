# Expense Management System API Documentation

## Base URL
```
http://localhost:4000/api
```

## Authentication
All endpoints (except signup/login) require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All responses follow this format:
```json
{
  "message": "Success message",
  "data": { ... },
  "pagination": { ... } // For paginated responses
}
```

Error responses:
```json
{
  "error": "Error message",
  "details": [ ... ] // For validation errors
}
```

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 User Signup
**POST** `/api/auth/signup`

Creates a new company and admin user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "password": "password123",
  "role": "ADMIN",
  "companyName": "Acme Corp",
  "companyCountry": "US"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@company.com",
    "role": "ADMIN",
    "companyId": "uuid"
  },
  "company": {
    "id": "uuid",
    "name": "Acme Corp",
    "country": "US",
    "currency": "USD"
  },
  "token": "jwt_token"
}
```

### 1.2 User Login
**POST** `/api/auth/login`

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "john@company.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@company.com",
    "role": "ADMIN",
    "companyId": "uuid"
  },
  "token": "jwt_token"
}
```

### 1.3 Get User Profile
**GET** `/api/auth/profile`

Returns the current user's profile information.

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@company.com",
    "role": "ADMIN",
    "companyId": "uuid",
    "isManagerApprover": false
  }
}
```

---

## 2. User Management Endpoints (`/api/users`)

### 2.1 Create User
**POST** `/api/users`

Creates a new user in the company. (Admin only)

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "password": "password123",
  "role": "EMPLOYEE",
  "isManagerApprover": false
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@company.com",
    "role": "EMPLOYEE",
    "companyId": "uuid",
    "isManagerApprover": false
  }
}
```

### 2.2 Get All Users
**GET** `/api/users`

Returns all users in the company. (Admin only)

**Response (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@company.com",
      "role": "ADMIN",
      "companyId": "uuid",
      "isManagerApprover": false
    }
  ]
}
```

### 2.3 Get User by ID
**GET** `/api/users/:userId`

Returns a specific user by ID. (Admin only)

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@company.com",
    "role": "EMPLOYEE",
    "companyId": "uuid",
    "isManagerApprover": false
  }
}
```

### 2.4 Update User Role
**PUT** `/api/users/:userId/role`

Updates a user's role. (Admin only)

**Request Body:**
```json
{
  "role": "MANAGER",
  "isManagerApprover": true
}
```

**Response (200):**
```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@company.com",
    "role": "MANAGER",
    "isManagerApprover": true
  }
}
```

### 2.5 Assign Manager Relationship
**POST** `/api/users/:userId/manager`

Assigns a manager to a user. (Admin only)

**Request Body:**
```json
{
  "managerId": "manager_uuid"
}
```

**Response (200):**
```json
{
  "message": "Manager relationship assigned successfully"
}
```

### 2.6 Get Team Members
**GET** `/api/users/team/members`

Returns team members for the current manager. (Manager/Admin only)

**Response (200):**
```json
{
  "teamMembers": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@company.com",
      "role": "EMPLOYEE"
    }
  ]
}
```

### 2.7 Delete User
**DELETE** `/api/users/:userId`

Deletes a user from the company. (Admin only)

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

---

## 3. Expense Management Endpoints (`/api/expenses`)

### 3.1 Submit Expense
**POST** `/api/expenses`

Creates a new expense submission.

**Request Body:**
```json
{
  "amount": 100.50,
  "currency": "USD",
  "category": "Meals",
  "description": "Business lunch",
  "date": "2024-01-15",
  "expenseLines": [
    {
      "amount": 50.25,
      "description": "Main course"
    },
    {
      "amount": 50.25,
      "description": "Dessert"
    }
  ]
}
```

**Response (201):**
```json
{
  "message": "Expense submitted successfully",
  "expense": {
    "id": "uuid",
    "amount": 100.50,
    "currency": "USD",
    "amountInCompanyCurrency": 100.50,
    "category": "Meals",
    "description": "Business lunch",
    "date": "2024-01-15T00:00:00.000Z",
    "status": "PENDING",
    "userId": "uuid",
    "companyId": "uuid",
    "expenseLines": [
      {
        "id": "uuid",
        "amount": 50.25,
        "description": "Main course"
      }
    ]
  }
}
```

### 3.2 Get User Expenses
**GET** `/api/expenses/my-expenses`

Returns the current user's expenses with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "expenses": [
    {
      "id": "uuid",
      "amount": 100.50,
      "currency": "USD",
      "category": "Meals",
      "description": "Business lunch",
      "date": "2024-01-15T00:00:00.000Z",
      "status": "PENDING",
      "expenseLines": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### 3.3 Get Expense by ID
**GET** `/api/expenses/:expenseId`

Returns a specific expense by ID.

**Response (200):**
```json
{
  "expense": {
    "id": "uuid",
    "amount": 100.50,
    "currency": "USD",
    "amountInCompanyCurrency": 100.50,
    "category": "Meals",
    "description": "Business lunch",
    "date": "2024-01-15T00:00:00.000Z",
    "status": "PENDING",
    "userId": "uuid",
    "companyId": "uuid",
    "expenseLines": [
      {
        "id": "uuid",
        "amount": 50.25,
        "description": "Main course"
      }
    ]
  }
}
```

### 3.4 Update Expense
**PUT** `/api/expenses/:expenseId`

Updates an expense (only if pending or auto-approved).

**Request Body:**
```json
{
  "amount": 120.00,
  "description": "Updated business lunch",
  "category": "Meals"
}
```

**Response (200):**
```json
{
  "message": "Expense updated successfully",
  "expense": {
    "id": "uuid",
    "amount": 120.00,
    "currency": "USD",
    "description": "Updated business lunch",
    "category": "Meals",
    "status": "PENDING"
  }
}
```

### 3.5 Delete Expense
**DELETE** `/api/expenses/:expenseId`

Deletes an expense (only if pending).

**Response (200):**
```json
{
  "message": "Expense deleted successfully"
}
```

### 3.6 Get Company Expenses
**GET** `/api/expenses/company/all`

Returns all expenses in the company. (Manager/Admin only)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (PENDING, APPROVED, REJECTED)

**Response (200):**
```json
{
  "expenses": [
    {
      "id": "uuid",
      "amount": 100.50,
      "currency": "USD",
      "category": "Meals",
      "description": "Business lunch",
      "date": "2024-01-15T00:00:00.000Z",
      "status": "PENDING",
      "user": {
        "id": "uuid",
        "name": "Jane Smith",
        "email": "jane@company.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### 3.7 Get Expense Statistics
**GET** `/api/expenses/company/statistics`

Returns expense statistics for the company. (Manager/Admin only)

**Response (200):**
```json
{
  "statistics": {
    "totalExpenses": 25,
    "pendingExpenses": 5,
    "approvedExpenses": 18,
    "rejectedExpenses": 2,
    "totalAmount": 5000.00,
    "averageAmount": 200.00,
    "monthlyBreakdown": [
      {
        "month": "2024-01",
        "count": 10,
        "amount": 2000.00
      }
    ]
  }
}
```

---

## 4. Approval Flow Management Endpoints (`/api/flows`)

### 4.1 Create Approval Flow
**POST** `/api/flows/approval-flows`

Creates a new approval flow. (Admin only)

**Request Body:**
```json
{
  "name": "Standard Approval Flow",
  "ruleType": "UNANIMOUS",
  "percentageThreshold": 75,
  "specificApproverId": "uuid",
  "steps": [
    {
      "role": "MANAGER"
    },
    {
      "specificUserId": "uuid"
    }
  ]
}
```

**Response (201):**
```json
{
  "message": "Approval flow created successfully",
  "approvalFlow": {
    "id": "uuid",
    "name": "Standard Approval Flow",
    "ruleType": "UNANIMOUS",
    "percentageThreshold": 75,
    "specificApproverId": "uuid",
    "companyId": "uuid",
    "steps": [
      {
        "id": "uuid",
        "stepOrder": 1,
        "role": "MANAGER",
        "specificUserId": null
      },
      {
        "id": "uuid",
        "stepOrder": 2,
        "role": null,
        "specificUserId": "uuid"
      }
    ]
  }
}
```

### 4.2 Get All Approval Flows
**GET** `/api/flows/approval-flows`

Returns all approval flows for the company. (Admin only)

**Response (200):**
```json
{
  "approvalFlows": [
    {
      "id": "uuid",
      "name": "Standard Approval Flow",
      "ruleType": "UNANIMOUS",
      "percentageThreshold": 75,
      "specificApproverId": "uuid",
      "companyId": "uuid",
      "steps": [
        {
          "id": "uuid",
          "stepOrder": 1,
          "role": "MANAGER",
          "specificUserId": null
        }
      ]
    }
  ]
}
```

### 4.3 Get Approval Flow by ID
**GET** `/api/flows/approval-flows/:flowId`

Returns a specific approval flow by ID. (Admin only)

**Response (200):**
```json
{
  "approvalFlow": {
    "id": "uuid",
    "name": "Standard Approval Flow",
    "ruleType": "UNANIMOUS",
    "percentageThreshold": 75,
    "specificApproverId": "uuid",
    "companyId": "uuid",
    "steps": [
      {
        "id": "uuid",
        "stepOrder": 1,
        "role": "MANAGER",
        "specificUserId": null
      }
    ]
  }
}
```

### 4.4 Update Approval Flow
**PUT** `/api/flows/approval-flows/:flowId`

Updates an approval flow. (Admin only)

**Request Body:**
```json
{
  "name": "Updated Standard Flow",
  "ruleType": "PERCENTAGE",
  "percentageThreshold": 80,
  "steps": [
    {
      "role": "MANAGER"
    },
    {
      "role": "ADMIN"
    }
  ]
}
```

**Response (200):**
```json
{
  "message": "Approval flow updated successfully",
  "approvalFlow": {
    "id": "uuid",
    "name": "Updated Standard Flow",
    "ruleType": "PERCENTAGE",
    "percentageThreshold": 80,
    "steps": [
      {
        "id": "uuid",
        "stepOrder": 1,
        "role": "MANAGER",
        "specificUserId": null
      },
      {
        "id": "uuid",
        "stepOrder": 2,
        "role": "ADMIN",
        "specificUserId": null
      }
    ]
  }
}
```

### 4.5 Delete Approval Flow
**DELETE** `/api/flows/approval-flows/:flowId`

Deletes an approval flow. (Admin only)

**Response (200):**
```json
{
  "message": "Approval flow deleted successfully"
}
```

### 4.6 Get Pending Approvals
**GET** `/api/flows/pending`

Returns pending approvals for the current user. (Manager/Admin only)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "approvals": [
    {
      "id": "uuid",
      "stepOrder": 1,
      "status": "PENDING",
      "expense": {
        "id": "uuid",
        "amount": 100.50,
        "currency": "USD",
        "description": "Business lunch",
        "user": {
          "id": "uuid",
          "name": "Jane Smith",
          "email": "jane@company.com"
        },
        "expenseLines": []
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### 4.7 Approve Expense
**POST** `/api/flows/:requestId/approve`

Approves an expense request. (Manager/Admin only)

**Request Body:**
```json
{
  "comment": "Approved for business purposes"
}
```

**Response (200):**
```json
{
  "message": "Expense approved - all approvals received"
}
```

### 4.8 Reject Expense
**POST** `/api/flows/:requestId/reject`

Rejects an expense request. (Manager/Admin only)

**Request Body:**
```json
{
  "comment": "Expense not justified"
}
```

**Response (200):**
```json
{
  "message": "Expense rejected"
}
```

### 4.9 Get Approval History
**GET** `/api/flows/expense/:expenseId/history`

Returns approval history for an expense. (Manager/Admin only)

**Response (200):**
```json
{
  "approvalHistory": [
    {
      "id": "uuid",
      "stepOrder": 1,
      "status": "APPROVED",
      "comment": "Approved for business purposes",
      "decidedAt": "2024-01-15T10:30:00.000Z",
      "approver": {
        "id": "uuid",
        "name": "Manager Name",
        "email": "manager@company.com",
        "role": "MANAGER"
      }
    }
  ]
}
```

### 4.10 Admin Override
**POST** `/api/flows/:requestId/override`

Admin override for approval decisions. (Admin only)

**Request Body:**
```json
{
  "action": "approve",
  "comment": "Admin override - urgent business need"
}
```

**Response (200):**
```json
{
  "message": "Expense approved by admin override"
}
```

### 4.11 Get Company Approvals
**GET** `/api/flows/company/all`

Returns all approvals in the company. (Admin only)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (PENDING, APPROVED, REJECTED)

**Response (200):**
```json
{
  "approvals": [
    {
      "id": "uuid",
      "stepOrder": 1,
      "status": "APPROVED",
      "comment": "Approved for business purposes",
      "decidedAt": "2024-01-15T10:30:00.000Z",
      "expense": {
        "id": "uuid",
        "amount": 100.50,
        "description": "Business lunch",
        "user": {
          "id": "uuid",
          "name": "Jane Smith",
          "email": "jane@company.com"
        }
      },
      "approver": {
        "id": "uuid",
        "name": "Manager Name",
        "email": "manager@company.com",
        "role": "MANAGER"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

---

## 5. Company Management Endpoints (`/api/company`)

### 5.1 Create Approval Flow (Company)
**POST** `/api/company/approval-flows`

Creates a new approval flow via company controller. (Admin only)

**Request Body:** Same as `/api/flows/approval-flows`

**Response:** Same as `/api/flows/approval-flows`

### 5.2 Get All Approval Flows (Company)
**GET** `/api/company/approval-flows`

Returns all approval flows via company controller. (Admin only)

**Response:** Same as `/api/flows/approval-flows`

### 5.3 Get Approval Flow by ID (Company)
**GET** `/api/company/approval-flows/:flowId`

Returns a specific approval flow via company controller. (Admin only)

**Response:** Same as `/api/flows/approval-flows/:flowId`

### 5.4 Update Approval Flow (Company)
**PUT** `/api/company/approval-flows/:flowId`

Updates an approval flow via company controller. (Admin only)

**Request Body:** Same as `/api/flows/approval-flows/:flowId`

**Response:** Same as `/api/flows/approval-flows/:flowId`

### 5.5 Delete Approval Flow (Company)
**DELETE** `/api/company/approval-flows/:flowId`

Deletes an approval flow via company controller. (Admin only)

**Response:** Same as `/api/flows/approval-flows/:flowId`

### 5.6 Get Company Statistics
**GET** `/api/company/statistics`

Returns company-wide statistics. (Admin only)

**Response (200):**
```json
{
  "statistics": {
    "totalUsers": 15,
    "totalExpenses": 150,
    "pendingExpenses": 25,
    "approvedExpenses": 120,
    "rejectedExpenses": 5,
    "totalApprovalFlows": 3,
    "monthlyExpenseTrend": [
      {
        "month": "2024-01",
        "count": 50,
        "amount": 10000.00
      }
    ]
  }
}
```

### 5.7 Get Company Users
**GET** `/api/company/users`

Returns all users in the company. (Admin only)

**Response (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@company.com",
      "role": "ADMIN",
      "isManagerApprover": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## 6. OCR Processing Endpoints (`/api/ocr`)

### 6.1 Process Receipt
**POST** `/api/ocr/process-receipt`

Processes a receipt image using OCR.

**Request:** Multipart form data with `receipt` file

**Response (200):**
```json
{
  "message": "Receipt processed successfully",
  "ocrData": {
    "totalAmount": 100.50,
    "currency": "USD",
    "merchant": "Restaurant ABC",
    "date": "2024-01-15",
    "items": [
      {
        "description": "Business lunch",
        "amount": 100.50
      }
    ],
    "confidence": 0.95
  }
}
```

### 6.2 Create Expense from Receipt
**POST** `/api/ocr/create-expense`

Creates an expense directly from a receipt image.

**Request:** Multipart form data with `receipt` file

**Response (201):**
```json
{
  "message": "Expense created from receipt successfully",
  "expense": {
    "id": "uuid",
    "amount": 100.50,
    "currency": "USD",
    "description": "Business lunch",
    "status": "PENDING",
    "ocrData": {
      "totalAmount": 100.50,
      "merchant": "Restaurant ABC",
      "confidence": 0.95
    }
  }
}
```

### 6.3 Get Supported Formats
**GET** `/api/ocr/formats`

Returns supported OCR file formats.

**Response (200):**
```json
{
  "supportedFormats": [
    {
      "extension": "jpg",
      "mimeType": "image/jpeg",
      "maxSize": "10MB"
    },
    {
      "extension": "png",
      "mimeType": "image/png",
      "maxSize": "10MB"
    },
    {
      "extension": "pdf",
      "mimeType": "application/pdf",
      "maxSize": "10MB"
    }
  ],
  "maxFileSize": "10MB"
}
```

### 6.4 Validate Receipt Data
**POST** `/api/ocr/validate`

Validates OCR-extracted receipt data.

**Request Body:**
```json
{
  "ocrData": {
    "totalAmount": 100.50,
    "currency": "USD",
    "merchant": "Restaurant ABC",
    "date": "2024-01-15",
    "items": [
      {
        "description": "Business lunch",
        "amount": 100.50
      }
    ]
  }
}
```

**Response (200):**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    "Date format could be improved"
  ],
  "confidence": 0.95
}
```

---

## 7. Health Check Endpoint

### 7.1 Health Check
**GET** `/api/health`

Returns the API health status.

**Response (200):**
```json
{
  "status": "OK",
  "message": "Expense Management API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation errors |
| 500 | Internal Server Error - Server error |

## Rate Limiting

- No rate limiting currently implemented
- Recommended: Implement rate limiting for production use

## File Upload Limits

- Maximum file size: 10MB
- Supported formats: JPG, PNG, PDF
- OCR processing: Image files only

## Multi-Currency Support

- Automatic currency conversion using external API
- Supported currencies: USD, EUR, GBP, and more
- Conversion rates updated in real-time
- Company currency setting determines base currency