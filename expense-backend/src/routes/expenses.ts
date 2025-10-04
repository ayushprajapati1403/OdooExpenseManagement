import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';

const router = express.Router();
const prisma = new PrismaClient();

// Submit expense
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { amount, currency, category, description, date, expenseLines } = req.body;

    if (!amount || !currency || !category || !date) {
      return res.status(400).json({ error: 'Amount, currency, category, and date are required' });
    }

    // Get user's company
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { company: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Convert amount to company currency if different
    let amountInCompanyCurrency = null;
    if (currency !== user.company.currency) {
      try {
        const conversionResponse = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
        const conversionData = await conversionResponse.json();
        const rate = conversionData.rates[user.company.currency];
        amountInCompanyCurrency = parseFloat(amount) * rate;
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
        userId: req.user.userId,
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

    // Get approval flow for this expense
    const approvalFlow = await prisma.approvalFlow.findFirst({
      where: { companyId: user.companyId },
      include: { steps: { orderBy: { stepOrder: 'asc' } } }
    });

    if (approvalFlow && approvalFlow.steps.length > 0) {
      // Create approval requests
      const approvalRequests = await Promise.all(
        approvalFlow.steps.map(async (step) => {
          let approverId = null;

          if (step.role) {
            // Find user with specific role
            const approver = await prisma.user.findFirst({
              where: {
                companyId: user.companyId,
                role: step.role
              }
            });
            approverId = approver?.id;
          } else if (step.specificUserId) {
            approverId = step.specificUserId;
          }

          if (approverId) {
            return prisma.approvalRequest.create({
              data: {
                expenseId: expense.id,
                approverId,
                stepOrder: step.stepOrder
              }
            });
          }
        })
      );

      // Filter out null values
      const validRequests = approvalRequests.filter(req => req !== null);
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
    console.error('Submit expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's expenses
router.get('/my-expenses', authenticateToken, async (req: any, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const whereClause: any = {
      userId: req.user.userId
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
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get expense by ID
router.get('/:expenseId', authenticateToken, async (req: any, res) => {
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
      where: { id: req.user.userId }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // User can view their own expenses or if they're admin/manager
    if (expense.userId !== req.user.userId && 
        currentUser.role !== 'ADMIN' && 
        currentUser.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ expense });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update expense (only if pending)
router.put('/:expenseId', authenticateToken, async (req: any, res) => {
  try {
    const { expenseId } = req.params;
    const { amount, currency, category, description, date, expenseLines } = req.body;

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Only allow updates if expense is pending and user owns it
    if (expense.status !== 'PENDING' || expense.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Cannot update this expense' });
    }

    // Get user's company for currency conversion
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
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
});

// Delete expense (only if pending)
router.delete('/:expenseId', authenticateToken, async (req: any, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Only allow deletion if expense is pending and user owns it
    if (expense.status !== 'PENDING' || expense.userId !== req.user.userId) {
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
});

export default router;
