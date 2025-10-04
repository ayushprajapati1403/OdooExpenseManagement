import prisma from '../prisma.js';
import { config } from '../config/index.js';

export interface ApprovalRequest {
  id: string;
  expenseId: string;
  approverId: string;
  stepOrder: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  decidedAt?: Date;
}

export interface ApprovalFlow {
  id: string;
  companyId: string;
  name: string;
  ruleType: 'UNANIMOUS' | 'PERCENTAGE' | 'SPECIFIC' | 'HYBRID';
  percentageThreshold?: number;
  specificApproverId?: string;
  steps: ApprovalFlowStep[];
}

export interface ApprovalFlowStep {
  id: string;
  flowId: string;
  stepOrder: number;
  role?: string;
  specificUserId?: string;
}

export class ApprovalService {
  /**
   * Create approval requests for an expense based on the company's approval flow
   */
  async createApprovalRequests(expenseId: string, companyId: string): Promise<ApprovalRequest[]> {
    try {
      // Get the approval flow for the company
      const approvalFlow = await prisma.approvalFlow.findFirst({
        where: { companyId },
        include: { steps: { orderBy: { stepOrder: 'asc' } } }
      });

      if (!approvalFlow || approvalFlow.steps.length === 0) {
        // No approval flow configured, auto-approve
        await prisma.expense.update({
          where: { id: expenseId },
          data: { status: 'APPROVED' }
        });
        return [];
      }

      const approvalRequests: ApprovalRequest[] = [];

      // Create approval requests for each step
      for (const step of approvalFlow.steps) {
        let approverId: string | null = null;

        if (step.role) {
          // Find user with specific role
          const approver = await prisma.user.findFirst({
            where: {
              companyId,
              role: step.role
            }
          });
          approverId = approver?.id || null;
        } else if (step.specificUserId) {
          approverId = step.specificUserId;
        }

        if (approverId) {
          const approvalRequest = await prisma.approvalRequest.create({
            data: {
              expenseId,
              approverId,
              stepOrder: step.stepOrder
            }
          });

          approvalRequests.push(approvalRequest);
        }
      }

      return approvalRequests;
    } catch (error) {
      console.error('Error creating approval requests:', error);
      throw new Error('Failed to create approval requests');
    }
  }

  /**
   * Process an approval decision and check if the expense should be approved/rejected
   */
  async processApprovalDecision(
    requestId: string, 
    action: 'APPROVED' | 'REJECTED', 
    comment?: string
  ): Promise<{ expenseStatus: string; message: string }> {
    try {
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
        throw new Error('Approval request not found');
      }

      if (approvalRequest.status !== 'PENDING') {
        throw new Error('Request already processed');
      }

      // Update the approval request
      await prisma.approvalRequest.update({
        where: { id: requestId },
        data: {
          status: action,
          comment,
          decidedAt: new Date()
        }
      });

      // If rejected, immediately reject the expense
      if (action === 'REJECTED') {
        await prisma.expense.update({
          where: { id: approvalRequest.expenseId },
          data: { status: 'REJECTED' }
        });

        return {
          expenseStatus: 'REJECTED',
          message: 'Expense rejected'
        };
      }

      // If approved, check if all approvals are complete
      const expense = approvalRequest.expense;
      const allRequests = expense.approvalRequests;
      const pendingRequests = allRequests.filter(req => req.status === 'PENDING');

      if (pendingRequests.length === 0) {
        // All approvals received, approve the expense
        await prisma.expense.update({
          where: { id: expense.id },
          data: { status: 'APPROVED' }
        });

        return {
          expenseStatus: 'APPROVED',
          message: 'Expense approved - all approvals received'
        };
      }

      return {
        expenseStatus: 'PENDING',
        message: 'Approval recorded, waiting for remaining approvals'
      };
    } catch (error) {
      console.error('Error processing approval decision:', error);
      throw new Error('Failed to process approval decision');
    }
  }

  /**
   * Get all approvals for a specific approver (pending, approved, rejected)
   */
  async getAllApprovals(approverId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const approvals = await prisma.approvalRequest.findMany({
        where: {
          approverId
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
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      });

      const total = await prisma.approvalRequest.count({
        where: { approverId }
      });

      return {
        approvals,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting all approvals:', error);
      throw new Error('Failed to get approvals');
    }
  }

  /**
   * Get approvals for a specific approver (pending only or all)
   */
  async getPendingApprovals(approverId: string, page: number = 1, limit: number = 10, includeAll: boolean = false) {
    try {
      const skip = (page - 1) * limit;

      const whereClause: any = {
        approverId
      };

      // Only filter by PENDING status if includeAll is false
      if (!includeAll) {
        whereClause.status = 'PENDING';
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
              },
              expenseLines: true
            }
          }
        },
        orderBy: { decidedAt: 'desc' },
        skip,
        take: limit
      });

      const total = await prisma.approvalRequest.count({
        where: whereClause
      });

      return {
        approvals,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting approvals:', error);
      throw new Error('Failed to get approvals');
    }
  }

  /**
   * Get approval history for an expense
   */
  async getApprovalHistory(expenseId: string) {
    try {
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

      return approvalHistory;
    } catch (error) {
      console.error('Error getting approval history:', error);
      throw new Error('Failed to get approval history');
    }
  }

  /**
   * Admin override - approve or reject any expense
   */
  async adminOverride(requestId: string, action: 'APPROVED' | 'REJECTED', comment?: string) {
    try {
      const approvalRequest = await prisma.approvalRequest.findUnique({
        where: { id: requestId },
        include: { expense: true }
      });

      if (!approvalRequest) {
        throw new Error('Approval request not found');
      }

      // Update the approval request
      await prisma.approvalRequest.update({
        where: { id: requestId },
        data: {
          status: action,
          comment: comment || `Admin override: ${action.toLowerCase()}`,
          decidedAt: new Date()
        }
      });

      // Update the expense status
      await prisma.expense.update({
        where: { id: approvalRequest.expenseId },
        data: { status: action }
      });

      return {
        message: `Expense ${action.toLowerCase()} by admin override`,
        expenseStatus: action
      };
    } catch (error) {
      console.error('Error in admin override:', error);
      throw new Error('Failed to process admin override');
    }
  }

  /**
   * Get company-wide approval statistics
   */
  async getCompanyApprovalStats(companyId: string) {
    try {
      const [
        totalApprovals,
        pendingApprovals,
        approvedApprovals,
        rejectedApprovals,
        monthlyStats
      ] = await Promise.all([
        prisma.approvalRequest.count({
          where: {
            expense: { companyId }
          }
        }),
        prisma.approvalRequest.count({
          where: {
            expense: { companyId },
            status: 'PENDING'
          }
        }),
        prisma.approvalRequest.count({
          where: {
            expense: { companyId },
            status: 'APPROVED'
          }
        }),
        prisma.approvalRequest.count({
          where: {
            expense: { companyId },
            status: 'REJECTED'
          }
        }),
        prisma.approvalRequest.groupBy({
          by: ['status'],
          where: {
            expense: { companyId }
          },
          _count: true
        })
      ]);

      return {
        totalApprovals,
        pendingApprovals,
        approvedApprovals,
        rejectedApprovals,
        monthlyBreakdown: monthlyStats
      };
    } catch (error) {
      console.error('Error getting company approval stats:', error);
      throw new Error('Failed to get approval statistics');
    }
  }

  /**
   * Check if user can approve a specific request
   */
  async canUserApprove(userId: string, requestId: string): Promise<boolean> {
    try {
      const approvalRequest = await prisma.approvalRequest.findUnique({
        where: { id: requestId }
      });

      if (!approvalRequest) {
        return false;
      }

      // Check if user is the assigned approver
      if (approvalRequest.approverId === userId) {
        return true;
      }

      // Check if user is admin (admins can approve anything)
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      return user?.role === 'ADMIN';
    } catch (error) {
      console.error('Error checking approval permission:', error);
      return false;
    }
  }

  /**
   * Get approval flow for a company
   */
  async getApprovalFlow(companyId: string): Promise<ApprovalFlow | null> {
    try {
      const approvalFlow = await prisma.approvalFlow.findFirst({
        where: { companyId },
        include: { steps: { orderBy: { stepOrder: 'asc' } } }
      });

      return approvalFlow;
    } catch (error) {
      console.error('Error getting approval flow:', error);
      throw new Error('Failed to get approval flow');
    }
  }

  /**
   * Create a new approval flow
   */
  async createApprovalFlow(
    companyId: string,
    name: string,
    ruleType: 'UNANIMOUS' | 'PERCENTAGE' | 'SPECIFIC' | 'HYBRID',
    steps: Array<{ role?: string; specificUserId?: string }>,
    percentageThreshold?: number,
    specificApproverId?: string
  ): Promise<ApprovalFlow> {
    try {
      const approvalFlow = await prisma.approvalFlow.create({
        data: {
          companyId,
          name,
          ruleType,
          percentageThreshold,
          specificApproverId
        }
      });

      // Create steps
      const flowSteps = await Promise.all(
        steps.map(async (step, index) => {
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

      return {
        ...approvalFlow,
        steps: flowSteps
      };
    } catch (error) {
      console.error('Error creating approval flow:', error);
      throw new Error('Failed to create approval flow');
    }
  }
}
