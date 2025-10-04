import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';

const router = express.Router();
const prisma = new PrismaClient();

// Create approval flow (Admin only)
router.post('/approval-flows', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, ruleType, percentageThreshold, specificApproverId, steps } = req.body;

    if (!name || !steps || steps.length === 0) {
      return res.status(400).json({ error: 'Name and steps are required' });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create approval flow
    const approvalFlow = await prisma.approvalFlow.create({
      data: {
        companyId: currentUser.companyId,
        name,
        ruleType: ruleType || 'UNANIMOUS',
        percentageThreshold,
        specificApproverId
      }
    });

    // Create approval flow steps
    const flowSteps = await Promise.all(
      steps.map(async (step: any, index: number) => {
        return prisma.approvalFlowStep.create({
          data: {
            flowId: approvalFlow.id,
            stepOrder: index + 1,
            role: step.role || null,
            specificUserId: step.specificUserId || null
          }
        });
      })
    );

    res.status(201).json({
      message: 'Approval flow created successfully',
      approvalFlow: {
        ...approvalFlow,
        steps: flowSteps
      }
    });
  } catch (error) {
    console.error('Create approval flow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get approval flows (Admin only)
router.get('/approval-flows', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const approvalFlows = await prisma.approvalFlow.findMany({
      where: { companyId: currentUser.companyId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
          include: {
            flow: false
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ approvalFlows });
  } catch (error) {
    console.error('Get approval flows error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update approval flow (Admin only)
router.put('/approval-flows/:flowId', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { flowId } = req.params;
    const { name, ruleType, percentageThreshold, specificApproverId, steps } = req.body;

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if flow belongs to company
    const existingFlow = await prisma.approvalFlow.findFirst({
      where: {
        id: flowId,
        companyId: currentUser.companyId
      }
    });

    if (!existingFlow) {
      return res.status(404).json({ error: 'Approval flow not found' });
    }

    // Update approval flow
    const updatedFlow = await prisma.approvalFlow.update({
      where: { id: flowId },
      data: {
        name: name || undefined,
        ruleType: ruleType || undefined,
        percentageThreshold: percentageThreshold !== undefined ? percentageThreshold : undefined,
        specificApproverId: specificApproverId || undefined
      }
    });

    // Update steps if provided
    if (steps) {
      // Delete existing steps
      await prisma.approvalFlowStep.deleteMany({
        where: { flowId }
      });

      // Create new steps
      const flowSteps = await Promise.all(
        steps.map(async (step: any, index: number) => {
          return prisma.approvalFlowStep.create({
            data: {
              flowId,
              stepOrder: index + 1,
              role: step.role || null,
              specificUserId: step.specificUserId || null
            }
          });
        })
      );

      res.json({
        message: 'Approval flow updated successfully',
        approvalFlow: {
          ...updatedFlow,
          steps: flowSteps
        }
      });
    } else {
      res.json({
        message: 'Approval flow updated successfully',
        approvalFlow: updatedFlow
      });
    }
  } catch (error) {
    console.error('Update approval flow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete approval flow (Admin only)
router.delete('/approval-flows/:flowId', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { flowId } = req.params;

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if flow belongs to company
    const existingFlow = await prisma.approvalFlow.findFirst({
      where: {
        id: flowId,
        companyId: currentUser.companyId
      }
    });

    if (!existingFlow) {
      return res.status(404).json({ error: 'Approval flow not found' });
    }

    // Delete approval flow (cascade will handle steps)
    await prisma.approvalFlow.delete({
      where: { id: flowId }
    });

    res.json({ message: 'Approval flow deleted successfully' });
  } catch (error) {
    console.error('Delete approval flow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get company statistics (Admin only)
router.get('/stats', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [
      totalUsers,
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      rejectedExpenses,
      totalAmount
    ] = await Promise.all([
      prisma.user.count({
        where: { companyId: currentUser.companyId }
      }),
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
      })
    ]);

    res.json({
      stats: {
        totalUsers,
        totalExpenses,
        pendingExpenses,
        approvedExpenses,
        rejectedExpenses,
        totalApprovedAmount: totalAmount._sum.amountInCompanyCurrency || 0
      }
    });
  } catch (error) {
    console.error('Get company stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all expenses in company (Admin only)
router.get('/expenses', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId }
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
});

export default router;
