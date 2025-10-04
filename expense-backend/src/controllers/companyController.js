import prisma from '../prisma.js';
export class CompanyController {
    async createApprovalFlow(req, res) {
        try {
            const { name, ruleType, percentageThreshold, specificApproverId, steps } = req.body;
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
            const flowSteps = await Promise.all(steps.map(async (step, index) => {
                return prisma.approvalFlowStep.create({
                    data: {
                        flowId: approvalFlow.id,
                        stepOrder: index + 1,
                        role: step.role || null,
                        specificUserId: step.specificUserId || null
                    }
                });
            }));
            res.status(201).json({
                message: 'Approval flow created successfully',
                approvalFlow: {
                    ...approvalFlow,
                    steps: flowSteps
                }
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
                orderBy: { createdAt: 'desc' }
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
            // Delete approval flow (cascade will handle steps)
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
    async getCompanyStatistics(req, res) {
        try {
            const currentUser = await prisma.user.findUnique({
                where: { id: req.user.userId }
            });
            if (!currentUser) {
                return res.status(404).json({ error: 'User not found' });
            }
            const [totalUsers, totalExpenses, pendingExpenses, approvedExpenses, rejectedExpenses, totalAmount, monthlyExpenses] = await Promise.all([
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
                    totalUsers,
                    totalExpenses,
                    pendingExpenses,
                    approvedExpenses,
                    rejectedExpenses,
                    totalApprovedAmount: totalAmount._sum.amountInCompanyCurrency || 0,
                    monthlyBreakdown: monthlyExpenses
                }
            });
        }
        catch (error) {
            console.error('Get company statistics error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getCompanyUsers(req, res) {
        try {
            const currentUser = await prisma.user.findUnique({
                where: { id: req.user.userId }
            });
            if (!currentUser) {
                return res.status(404).json({ error: 'User not found' });
            }
            const users = await prisma.user.findMany({
                where: { companyId: currentUser.companyId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    isManagerApprover: true,
                    createdAt: true,
                    employeeRelation: {
                        include: {
                            manager: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    },
                    managedEmployees: {
                        include: {
                            employee: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ users });
        }
        catch (error) {
            console.error('Get company users error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
//# sourceMappingURL=companyController.js.map