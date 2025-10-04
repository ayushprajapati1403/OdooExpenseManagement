import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
export declare class FlowController {
    private approvalService;
    constructor();
    createApprovalFlow(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getAllApprovalFlows(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getApprovalFlowById(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateApprovalFlow(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteApprovalFlow(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get all approvals for the current user (pending, approved, rejected)
     */
    getAllApprovals(req: AuthenticatedRequest, res: Response): Promise<void>;
    getPendingApprovals(req: AuthenticatedRequest, res: Response): Promise<void>;
    approveExpense(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    rejectExpense(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getApprovalHistory(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    overrideApproval(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getCompanyApprovals(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=flowController.d.ts.map