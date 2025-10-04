import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
export declare class ExpenseController {
    private currencyService;
    private approvalService;
    constructor();
    createExpense(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getUserExpenses(req: AuthenticatedRequest, res: Response): Promise<void>;
    getExpenseById(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateExpense(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteExpense(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getCompanyExpenses(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getExpenseStatistics(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=expenseController.d.ts.map