import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export class FlowController {
  async createApprovalFlow(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, ruleType, percentageThreshold, specificApproverId, steps } = req.body;

      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.userId }
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
  }

  async getAllApprovalFlows(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.userId }
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
  }

  async getApprovalFlowById(req: AuthenticatedRequest, res: Response) {
    try {
      const { flowId } = req.params;

      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.userId }
      });

      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const approvalFlow = await prisma.approvalFlow.findFirst({
        where: {
          id: flowId,
          companyId: currentUser.companyId
        },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' }
          }
        }
      });

      if (!approvalFlow) {
        return res.status(404).json({ error: 'Approval flow not found' });
      }

      res.json({ approvalFlow });
    } catch (error) {
      console.error('Get approval flow by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateApprovalFlow(req: AuthenticatedRequest, res: Response) {
    try {
      const { flowId } = req.params;
      const { name, ruleType, percentageThreshold, specificApproverId, steps } = req.body;

      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.userId }
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
  }

  async deleteApprovalFlow(req: AuthenticatedRequest, res: Response) {
    try {
      const { flowId } = req.params;

      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.userId }
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
  }

  async getPendingApprovals(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, limit = 10 } = req.query;

      const approvals = await prisma.approvalRequest.findMany({
        where: {
          approverId: req.user!.userId,
          status: 'PENDING'
        },
        include: {
          expense: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              expenseLines: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });

      const total = await prisma.approvalRequest.count({
        where: {
          approverId: req.user!.userId,
          status: 'PENDING'
        }
      });

      res.json({
        approvals,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Get pending approvals error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async approveExpense(req: AuthenticatedRequest, res: Response) {
    try {
      const { requestId } = req.params;
      const { comment } = req.body;

      const approvalRequest = await prisma.approvalRequest.findUnique({
        where: { id: requestId },
        include: {
          expense: {
            include: {
              approvalRequests: {
                orderBy: { stepOrder: 'asc' }
              }
            }
          }
        }
      });

      if (!approvalRequest) {
        return res.status(404).json({ error: 'Approval request not found' });
      }

      // Check if user is the approver
      if (approvalRequest.approverId !== req.user!.userId) {
        return res.status(403).json({ error: 'Not authorized to approve this request' });
      }

      // Check if already processed
      if (approvalRequest.status !== 'PENDING') {
        return res.status(400).json({ error: 'Request already processed' });
      }

      // Update approval request
      await prisma.approvalRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          comment,
          decidedAt: new Date()
        }
      });

      // Check if this was the last approval needed
      const expense = approvalRequest.expense;
      const allRequests = expense.approvalRequests;
      const pendingRequests = allRequests.filter(req => req.status === 'PENDING');

      // If no more pending requests, approve the expense
      if (pendingRequests.length === 0) {
        await prisma.expense.update({
          where: { id: expense.id },
          data: { status: 'APPROVED' }
        });
      }

      res.json({ message: 'Expense approved successfully' });
    } catch (error) {
      console.error('Approve expense error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async rejectExpense(req: AuthenticatedRequest, res: Response) {
    try {
      const { requestId } = req.params;
      const { comment } = req.body;

      const approvalRequest = await prisma.approvalRequest.findUnique({
        where: { id: requestId },
        include: { expense: true }
      });

      if (!approvalRequest) {
        return res.status(404).json({ error: 'Approval request not found' });
      }

      // Check if user is the approver
      if (approvalRequest.approverId !== req.user!.userId) {
        return res.status(403).json({ error: 'Not authorized to reject this request' });
      }

      // Check if already processed
      if (approvalRequest.status !== 'PENDING') {
        return res.status(400).json({ error: 'Request already processed' });
      }

      // Update approval request
      await prisma.approvalRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          comment,
          decidedAt: new Date()
        }
      });

      // Reject the entire expense
      await prisma.expense.update({
        where: { id: approvalRequest.expenseId },
        data: { status: 'REJECTED' }
      });

      res.json({ message: 'Expense rejected successfully' });
    } catch (error) {
      console.error('Reject expense error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getApprovalHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const { expenseId } = req.params;

      const expense = await prisma.expense.findUnique({
        where: { id: expenseId }
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

      const approvalHistory = await prisma.approvalRequest.findMany({
        where: { expenseId },
        include: {
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { stepOrder: 'asc' }
      });

      res.json({ approvalHistory });
    } catch (error) {
      console.error('Get approval history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async overrideApproval(req: AuthenticatedRequest, res: Response) {
    try {
      const { requestId } = req.params;
      const { action, comment } = req.body; // action: 'approve' or 'reject'

      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Action must be approve or reject' });
      }

      const approvalRequest = await prisma.approvalRequest.findUnique({
        where: { id: requestId },
        include: { expense: true }
      });

      if (!approvalRequest) {
        return res.status(404).json({ error: 'Approval request not found' });
      }

      // Update approval request
      await prisma.approvalRequest.update({
        where: { id: requestId },
        data: {
          status: action.toUpperCase(),
          comment: comment || `Admin override: ${action}`,
          decidedAt: new Date()
        }
      });

      // Update expense status
      await prisma.expense.update({
        where: { id: approvalRequest.expenseId },
        data: { status: action.toUpperCase() }
      });

      res.json({ message: `Expense ${action}d by admin override` });
    } catch (error) {
      console.error('Override approval error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCompanyApprovals(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.userId }
      });

      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { status, page = 1, limit = 10 } = req.query;

      const whereClause: any = {
        expense: {
          companyId: currentUser.companyId
        }
      };

      if (status) {
        whereClause.status = status;
      }

      const approvals = await prisma.approvalRequest.findMany({
        where: whereClause,
        include: {
          expense: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });

      const total = await prisma.approvalRequest.count({
        where: whereClause
      });

      res.json({
        approvals,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Get company approvals error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
