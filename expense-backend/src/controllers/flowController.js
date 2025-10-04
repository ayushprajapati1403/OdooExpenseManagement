import prisma from '../prisma.js';
import { ApprovalService } from '../services/approvalService.js';
export class FlowController {
    approvalService;
    constructor() {
        this.approvalService = new ApprovalService();
    }
    async createApprovalFlow(req, res) {
        try {
            const { name, ruleType, percentageThreshold, specificApproverId, steps } = req.body;
            const currentUser = await prisma.user.findUnique({
                where: { id: req.user.userId }
            });
            if (!currentUser) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Create approval flow using service
            const approvalFlow = await this.approvalService.createApprovalFlow(currentUser.companyId, name, ruleType || 'UNANIMOUS', steps, percentageThreshold, specificApproverId);
            res.status(201).json({
                message: 'Approval flow created successfully',
                approvalFlow
            });
        }
        catch (error) {
            console.error('Create approval flow error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getAllApprovalFlows(req, res) {
        try {
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
                        orderBy: { stepOrder: 'asc' }
                    }
                },
                orderBy: { name: 'asc' }
            });
            res.json({ approvalFlows });
        }
        catch (error) {
            console.error('Get approval flows error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getApprovalFlowById(req, res) {
        try {
            const { flowId } = req.params;
            const currentUser = await prisma.user.findUnique({
                where: { id: req.user.userId }
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
        }
        catch (error) {
            console.error('Get approval flow by ID error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async updateApprovalFlow(req, res) {
        try {
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
                const flowSteps = await Promise.all(steps.map(async (step, index) => {
                    return prisma.approvalFlowStep.create({
                        data: {
                            flowId,
                            stepOrder: index + 1,
                            role: step.role || null,
                            specificUserId: step.specificUserId || null
                        }
                    });
                }));
                res.json({
                    message: 'Approval flow updated successfully',
                    approvalFlow: {
                        ...updatedFlow,
                        steps: flowSteps
                    }
                });
            }
            else {
                res.json({
                    message: 'Approval flow updated successfully',
                    approvalFlow: updatedFlow
                });
            }
        }
        catch (error) {
            console.error('Update approval flow error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async deleteApprovalFlow(req, res) {
        try {
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
            // Delete approval flow steps first
            await prisma.approvalFlowStep.deleteMany({
                where: { flowId }
            });
            // Then delete the approval flow
            await prisma.approvalFlow.delete({
                where: { id: flowId }
            });
            res.json({ message: 'Approval flow deleted successfully' });
        }
        catch (error) {
            console.error('Delete approval flow error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Get all approvals for the current user (pending, approved, rejected)
     */
    async getAllApprovals(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const result = await this.approvalService.getAllApprovals(req.user.userId, parseInt(page), parseInt(limit));
            res.json({
                approvals: result.approvals,
                pagination: result.pagination
            });
        }
        catch (error) {
            console.error('Error getting all approvals:', error);
            res.status(500).json({ error: 'Failed to get approvals' });
        }
    }
    async getPendingApprovals(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const result = await this.approvalService.getPendingApprovals(req.user.userId, parseInt(page), parseInt(limit));
            res.json(result);
        }
        catch (error) {
            console.error('Get pending approvals error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async approveExpense(req, res) {
        try {
            const { requestId } = req.params;
            const { comment } = req.body;
            // Check if user can approve this request
            const canApprove = await this.approvalService.canUserApprove(req.user.userId, requestId);
            if (!canApprove) {
                return res.status(403).json({ error: 'Not authorized to approve this request' });
            }
            // Process approval using service
            const result = await this.approvalService.processApprovalDecision(requestId, 'APPROVED', comment);
            res.json({ message: result.message });
        }
        catch (error) {
            console.error('Approve expense error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async rejectExpense(req, res) {
        try {
            const { requestId } = req.params;
            const { comment } = req.body;
            // Check if user can approve this request
            const canApprove = await this.approvalService.canUserApprove(req.user.userId, requestId);
            if (!canApprove) {
                return res.status(403).json({ error: 'Not authorized to reject this request' });
            }
            // Process rejection using service
            const result = await this.approvalService.processApprovalDecision(requestId, 'REJECTED', comment);
            res.json({ message: result.message });
        }
        catch (error) {
            console.error('Reject expense error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getApprovalHistory(req, res) {
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
            const approvalHistory = await this.approvalService.getApprovalHistory(expenseId);
            res.json({ approvalHistory });
        }
        catch (error) {
            console.error('Get approval history error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async overrideApproval(req, res) {
        try {
            const { requestId } = req.params;
            const { action, comment } = req.body; // action: 'approve' or 'reject'
            if (!action || !['approve', 'reject'].includes(action)) {
                return res.status(400).json({ error: 'Action must be approve or reject' });
            }
            const result = await this.approvalService.adminOverride(requestId, action.toUpperCase(), comment);
            res.json({ message: result.message });
        }
        catch (error) {
            console.error('Override approval error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getCompanyApprovals(req, res) {
        try {
            const currentUser = await prisma.user.findUnique({
                where: { id: req.user.userId }
            });
            if (!currentUser) {
                return res.status(404).json({ error: 'User not found' });
            }
            const { status, page = 1, limit = 10 } = req.query;
            const whereClause = {
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
                orderBy: { stepOrder: 'asc' },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit)
            });
            const total = await prisma.approvalRequest.count({
                where: whereClause
            });
            res.json({
                approvals,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        }
        catch (error) {
            console.error('Get company approvals error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
//# sourceMappingURL=flowController.js.map