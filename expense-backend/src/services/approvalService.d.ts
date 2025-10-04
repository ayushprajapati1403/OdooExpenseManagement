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
export declare class ApprovalService {
    /**
     * Create approval requests for an expense based on the company's approval flow
     */
    createApprovalRequests(expenseId: string, companyId: string): Promise<ApprovalRequest[]>;
    /**
     * Process an approval decision and check if the expense should be approved/rejected
     */
    processApprovalDecision(requestId: string, action: 'APPROVED' | 'REJECTED', comment?: string): Promise<{
        expenseStatus: string;
        message: string;
    }>;
    /**
     * Get all approvals for a specific approver (pending, approved, rejected)
     */
    getAllApprovals(approverId: string, page?: number, limit?: number): Promise<{
        approvals: {
            id: string;
            comment: string | null;
            stepOrder: number;
            status: import("@prisma/client").$Enums.RequestStatus;
            decidedAt: Date | null;
            expenseId: string;
            approverId: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    /**
     * Get pending approvals for a specific approver
     */
    getPendingApprovals(approverId: string, page?: number, limit?: number): Promise<{
        approvals: ({
            expense: {
                user: {
                    email: string;
                    name: string | null;
                    id: string;
                };
                expenseLines: {
                    id: string;
                    amount: number;
                    description: string;
                    expenseId: string;
                }[];
            } & {
                id: string;
                companyId: string;
                createdAt: Date;
                currency: string;
                userId: string;
                amount: number;
                category: string;
                date: Date;
                amountInCompanyCurrency: number | null;
                description: string | null;
                status: import("@prisma/client").$Enums.ExpenseStatus;
                receiptImageUrl: string | null;
                ocrData: import("@prisma/client/runtime/library").JsonValue | null;
            };
        } & {
            id: string;
            comment: string | null;
            stepOrder: number;
            status: import("@prisma/client").$Enums.RequestStatus;
            decidedAt: Date | null;
            expenseId: string;
            approverId: string;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    /**
     * Get approval history for an expense
     */
    getApprovalHistory(expenseId: string): Promise<({
        approver: {
            email: string;
            name: string | null;
            id: string;
            role: import("@prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        comment: string | null;
        stepOrder: number;
        status: import("@prisma/client").$Enums.RequestStatus;
        decidedAt: Date | null;
        expenseId: string;
        approverId: string;
    })[]>;
    /**
     * Admin override - approve or reject any expense
     */
    adminOverride(requestId: string, action: 'APPROVED' | 'REJECTED', comment?: string): Promise<{
        message: string;
        expenseStatus: "APPROVED" | "REJECTED";
    }>;
    /**
     * Get company-wide approval statistics
     */
    getCompanyApprovalStats(companyId: string): Promise<{
        totalApprovals: number;
        pendingApprovals: number;
        approvedApprovals: number;
        rejectedApprovals: number;
        monthlyBreakdown: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.ApprovalRequestGroupByOutputType, "status"[]> & {
            _count: number;
        })[];
    }>;
    /**
     * Check if user can approve a specific request
     */
    canUserApprove(userId: string, requestId: string): Promise<boolean>;
    /**
     * Get approval flow for a company
     */
    getApprovalFlow(companyId: string): Promise<ApprovalFlow | null>;
    /**
     * Create a new approval flow
     */
    createApprovalFlow(companyId: string, name: string, ruleType: 'UNANIMOUS' | 'PERCENTAGE' | 'SPECIFIC' | 'HYBRID', steps: Array<{
        role?: string;
        specificUserId?: string;
    }>, percentageThreshold?: number, specificApproverId?: string): Promise<ApprovalFlow>;
}
//# sourceMappingURL=approvalService.d.ts.map