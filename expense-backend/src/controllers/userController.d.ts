import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
export declare class UserController {
    createUser(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getAllUsers(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void>;
    assignManager(req: AuthenticatedRequest, res: Response): Promise<void>;
    getTeamMembers(req: AuthenticatedRequest, res: Response): Promise<void>;
    getUserById(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteUser(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=userController.d.ts.map