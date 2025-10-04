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
     * Get pending approvals for a specific approver
     */
    getPendingApprovals(approverId: string, page?: number, limit?: number): Promise<{
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
        monthlyBreakdown: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.ApprovalRequestGroupByOutputType, import("@prisma/client").Prisma.ApprovalRequestScalarFieldEnum | import("@prisma/client").Prisma.ApprovalRequestScalarFieldEnum[]> & {
            _count: true | {
                id?: number | undefined;
                expenseId?: number | undefined;
                approverId?: number | undefined;
                stepOrder?: number | undefined;
                status?: number | undefined;
                comment?: number | undefined;
                decidedAt?: number | undefined;
                _all?: number | undefined;
            } | undefined;
            _avg: {
                stepOrder?: number | null | undefined;
            } | undefined;
            _sum: {
                stepOrder?: number | null | undefined;
            } | undefined;
            _min: {
                id?: string | null | undefined;
                expenseId?: string | null | undefined;
                approverId?: string | null | undefined;
                stepOrder?: number | null | undefined;
                status?: import("@prisma/client").$Enums.RequestStatus | null | undefined;
                comment?: string | null | undefined;
                decidedAt?: Date | null | undefined;
            } | undefined;
            _max: {
                id?: string | null | undefined;
                expenseId?: string | null | undefined;
                approverId?: string | null | undefined;
                stepOrder?: number | null | undefined;
                status?: import("@prisma/client").$Enums.RequestStatus | null | undefined;
                comment?: string | null | undefined;
                decidedAt?: Date | null | undefined;
            } | undefined;
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