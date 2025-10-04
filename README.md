# 🏢 Odoo Expense Management System

A comprehensive expense management application built with modern web technologies, designed to streamline expense tracking, approval workflows, and financial reporting for organizations.

## 👥 Team Members

- **Ayush Prajapati** - Full Stack Developer
- **Tamanna Farkiwala** -  Backend Developer
- **Prisha Dave** - Frontend Developer 

## 📋 Features

### 🔐 Authentication & Authorization
- **Role-based Access Control** (Admin, Manager, Employee)
- **JWT Token Authentication**
- **Secure Login/Logout**
- **User Profile Management**

### 💰 Expense Management
- **Create & Submit Expenses**
- **Expense Categories** (Meals, Transport, Entertainment, etc.)
- **Receipt Upload & OCR Processing**
- **Multi-currency Support**
- **Expense Line Items**
- **Expense History & Tracking**

### ✅ Approval Workflows
- **Configurable Approval Flows**
- **Multi-step Approval Process**
- **Manager/Admin Approvals**
- **Approval History Tracking**
- **Real-time Status Updates**

### 📊 Dashboard & Analytics
- **Expense Overview Dashboard**
- **Recent Expenses Display**
- **Quick Actions Panel**
- **Company Statistics** (Admin only)
- **Monthly Expense Trends**

### 🏢 Company Management
- **Company Settings Configuration**
- **User Management**
- **Approval Flow Management**
- **Company-wide Statistics**

### 🧾 OCR Receipt Processing
- **Automatic Receipt Data Extraction**
- **Image Upload Support** (JPG, PNG)
- **Mock OCR Processing** (Ready for real OCR integration)
- **Data Validation & Review**

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Date-fns** - Date manipulation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Database ORM
- **SQLite** - Development database
- **PostgreSQL** - Production database ready
- **JWT** - Authentication tokens
- **Multer** - File upload handling
- **Bcrypt** - Password hashing

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **TypeScript** - Static type checking

## 📁 Project Structure

```
OdooExpenseManagement/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App Router pages
│   │   ├── page.tsx         # Dashboard
│   │   ├── profile/         # User profile
│   │   ├── approvals/        # Approval management
│   │   └── admin/           # Admin pages
│   ├── components/          # React components
│   │   ├── ui/              # UI components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── expense/         # Expense components
│   │   └── approval/        # Approval components
│   ├── lib/                 # Utilities and API client
│   └── contexts/            # React contexts
├── expense-backend/         # Express.js backend
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middlewares/     # Custom middlewares
│   │   └── config/          # Configuration
│   ├── prisma/              # Database schema
│   └── uploads/             # File uploads
└── README.md               # This file
```
