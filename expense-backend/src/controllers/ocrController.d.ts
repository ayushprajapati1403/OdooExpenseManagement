import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
export declare class OCRController {
    private ocrService;
    constructor();
    processReceipt(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createExpenseFromReceipt(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getSupportedFormats(req: AuthenticatedRequest, res: Response): Promise<void>;
    validateReceiptData(req: AuthenticatedRequest, res: Response): Promise<void>;
    getUploadMiddleware(): Promise<import("multer").Multer>;
}
//# sourceMappingURL=ocrController.d.ts.map