import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { CurrencyService } from '../services/currencyService.js';
import { ApprovalService } from '../services/approvalService.js';

export class ExpenseController {
  private currencyService: CurrencyService;
  private approvalService: ApprovalService;

  constructor() {
    this.currencyService = new CurrencyService();
    this.approvalService = new ApprovalService();
  }

  async createExpense(req: AuthenticatedRequest, res: Response) {
    try {
      const { amount, currency, category, description, date, expenseLines } = req.body;

      // Get user's company
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: { company: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Convert amount to company currency if different
      let amountInCompanyCurrency = null;
      if (currency !== user.company.currency) {
        try {
          const conversion = await this.currencyService.convertCurrency(
            parseFloat(amount),
            currency,
            user.company.currency
          );
          amountInCompanyCurrency = conversion.convertedAmount;
        } catch (error) {
          console.error('Currency conversion error:', error);
          // Continue without conversion
        }
      } else {
        amountInCompanyCurrency = parseFloat(amount);
      }

      // Create expense
      const expense = await prisma.expense.create({
        data: {
          companyId: user.companyId,
          userId: req.user!.userId,
          amount: parseFloat(amount),
          currency,
          amountInCompanyCurrency,
          category,
          description,
          date: new Date(date)
        }
      });

      // Create expense lines if provided
      if (expenseLines && expenseLines.length > 0) {
        await prisma.expenseLine.createMany({
          data: expenseLines.map((line: any) => ({
            expenseId: expense.id,
            amount: parseFloat(line.amount),
            description: line.description
          }))
        });
      }

      // Get approval flow for this expense and create approval requests
      try {
        const approvalRequests = await this.approvalService.createApprovalRequests(
          expense.id,
          user.companyId
        );
        
        if (approvalRequests.length === 0) {
          // No approval flow configured, auto-approve
          await prisma.expense.update({
            where: { id: expense.id },
            data: { status: 'APPROVED' }
          });
        }
      } catch (error) {
        console.error('Error creating approval requests:', error);
        // Continue without approval workflow
      }

      res.status(201).json({
        message: 'Expense submitted successfully',
        expense: {
          id: expense.id,
          amount: expense.amount,
          currency: expense.currency,
          amountInCompanyCurrency: expense.amountInCompanyCurrency,
          category: expense.category,
          description: expense.description,
          date: expense.date,
          status: expense.status
        }
      });
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUserExpenses(req: AuthenticatedRequest, res: Response) {
    try {
      const { status, page = 1, limit = 10 } = req.query;

      const whereClause: any = {
        userId: req.user!.userId
      };

      if (status) {
        whereClause.status = status;
      }

      const expenses = await prisma.expense.findMany({
        where: whereClause,
        include: {
          expenseLines: true,
          approvalRequests: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });

      const total = await prisma.expense.count({
        where: whereClause
      });

      res.json({
        expenses,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Get user expenses error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getExpenseById(req: AuthenticatedRequest, res: Response) {
    try {
      const { expenseId } = req.params;

      const expense = await prisma.expense.findUnique({
        where: { id: expenseId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          expenseLines: true,
          approvalRequests: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: { stepOrder: 'asc' }
          }
        }
      });

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      // Check if user can view this expense
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.userId }
      });

      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // User can view their own expenses or if they're admin/manager
      if (expense.userId !== req.user!.userId && 
          currentUser.role !== 'ADMIN' && 
          currentUser.role !== 'MANAGER') {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ expense });
    } catch (error) {
      console.error('Get expense by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateExpense(req: AuthenticatedRequest, res: Response) {
    try {
      const { expenseId } = req.params;
      const { amount, currency, category, description, date, expenseLines } = req.body;

      const expense = await prisma.expense.findUnique({
        where: { id: expenseId }
      });

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      // Check if user owns the expense
      if (expense.userId !== req.user!.userId) {
        return res.status(403).json({ error: 'Cannot update this expense' });
      }

      // Check if expense can be updated (pending or auto-approved)
      const approvalRequests = await prisma.approvalRequest.findMany({
        where: { expenseId }
      });

      // Allow updates if:
      // 1. Expense is PENDING, OR
      // 2. Expense is APPROVED but has no approval requests (auto-approved)
      if (expense.status !== 'PENDING' && (expense.status !== 'APPROVED' || approvalRequests.length > 0)) {
        return res.status(403).json({ error: 'Cannot update this expense' });
      }

      // Get user's company for currency conversion
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: { company: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let amountInCompanyCurrency = null;
      if (currency !== user.company.currency) {
        try {
          const conversionResponse = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
          const conversionData = await conversionResponse.json();
          const rate = conversionData.rates[user.company.currency];
          amountInCompanyCurrency = parseFloat(amount) * rate;
        } catch (error) {
          console.error('Currency conversion error:', error);
        }
      } else {
        amountInCompanyCurrency = parseFloat(amount);
      }

      // Update expense
      const updatedExpense = await prisma.expense.update({
        where: { id: expenseId },
        data: {
          amount: amount ? parseFloat(amount) : undefined,
          currency: currency || undefined,
          amountInCompanyCurrency,
          category: category || undefined,
          description: description || undefined,
          date: date ? new Date(date) : undefined
        }
      });

      // Update expense lines if provided
      if (expenseLines) {
        // Delete existing lines
        await prisma.expenseLine.deleteMany({
          where: { expenseId }
        });

        // Create new lines
        if (expenseLines.length > 0) {
          await prisma.expenseLine.createMany({
            data: expenseLines.map((line: any) => ({
              expenseId,
              amount: parseFloat(line.amount),
              description: line.description
            }))
          });
        }
      }

      res.json({
        message: 'Expense updated successfully',
        expense: updatedExpense
      });
    } catch (error) {
      console.error('Update expense error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteExpense(req: AuthenticatedRequest, res: Response) {
    try {
      const { expenseId } = req.params;

      const expense = await prisma.expense.findUnique({
        where: { id: expenseId }
      });

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      // Only allow deletion if expense is pending and user owns it
      if (expense.status !== 'PENDING' || expense.userId !== req.user!.userId) {
        return res.status(403).json({ error: 'Cannot delete this expense' });
      }

      // Delete expense (cascade will handle related records)
      await prisma.expense.delete({
        where: { id: expenseId }
      });

      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      console.error('Delete expense error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCompanyExpenses(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.userId }
      });

      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { status, page = 1, limit = 10 } = req.query;

      const whereClause: any = {
        companyId: currentUser.companyId
      };

      if (status) {
        whereClause.status = status;
      }

      const expenses = await prisma.expense.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          expenseLines: true,
          approvalRequests: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: { stepOrder: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });

      const total = await prisma.expense.count({
        where: whereClause
      });

      res.json({
        expenses,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Get company expenses error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getExpenseStatistics(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.userId }
      });

      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const [
        totalExpenses,
        pendingExpenses,
        approvedExpenses,
        rejectedExpenses,
        totalAmount,
        monthlyExpenses
      ] = await Promise.all([
        prisma.expense.count({
          where: { companyId: currentUser.companyId }
        }),
        prisma.expense.count({
          where: { 
            companyId: currentUser.companyId,
            status: 'PENDING'
          }
        }),
        prisma.expense.count({
          where: { 
            companyId: currentUser.companyId,
            status: 'APPROVED'
          }
        }),
        prisma.expense.count({
          where: { 
            companyId: currentUser.companyId,
            status: 'REJECTED'
          }
        }),
        prisma.expense.aggregate({
          where: { 
            companyId: currentUser.companyId,
            status: 'APPROVED'
          },
          _sum: {
            amountInCompanyCurrency: true
          }
        }),
        prisma.expense.groupBy({
          by: ['status'],
          where: {
            companyId: currentUser.companyId,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          },
          _count: true,
          _sum: {
            amountInCompanyCurrency: true
          }
        })
      ]);

      res.json({
        statistics: {
          totalExpenses,
          pendingExpenses,
          approvedExpenses,
          rejectedExpenses,
          totalApprovedAmount: totalAmount._sum.amountInCompanyCurrency || 0,
          monthlyBreakdown: monthlyExpenses
        }
      });
    } catch (error) {
      console.error('Get expense statistics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
