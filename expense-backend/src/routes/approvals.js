import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';
const router = express.Router();
const prisma = new PrismaClient();
// Get pending approvals for current user
router.get('/pending', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const approvals = await prisma.approvalRequest.findMany({
            where: {
                approverId: req.user.userId,
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
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });
        const total = await prisma.approvalRequest.count({
            where: {
                approverId: req.user.userId,
                status: 'PENDING'
            }
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
        console.error('Get pending approvals error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Approve expense
router.post('/:requestId/approve', authenticateToken, async (req, res) => {
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
        if (approvalRequest.approverId !== req.user.userId) {
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
        else {
            // Move to next approver
            const currentStepOrder = approvalRequest.stepOrder;
            const nextRequest = allRequests.find(req => req.stepOrder > currentStepOrder && req.status === 'PENDING');
            if (nextRequest) {
                // The next request is already created, just waiting for approval
                // No additional action needed
            }
        }
        res.json({ message: 'Expense approved successfully' });
    }
    catch (error) {
        console.error('Approve expense error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Reject expense
router.post('/:requestId/reject', authenticateToken, async (req, res) => {
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
        if (approvalRequest.approverId !== req.user.userId) {
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
    }
    catch (error) {
        console.error('Reject expense error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get approval history for expense
router.get('/expense/:expenseId', authenticateToken, async (req, res) => {
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
    }
    catch (error) {
        console.error('Get approval history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Override approval (Admin only)
router.post('/:requestId/override', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }
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
    }
    catch (error) {
        console.error('Override approval error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get all approvals in company (Admin only)
router.get('/company/all', authenticateToken, async (req, res) => {
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
            orderBy: { createdAt: 'desc' },
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
});
export default router;
//# sourceMappingURL=approvals.js.map