import express from 'express';
import { CompanyController } from '../controllers/companyController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { requireAdmin } from '../middlewares/roles.js';
import { validateApprovalFlow } from '../utils/validators.js';
const router = express.Router();
const companyController = new CompanyController();
// Company Settings (Admin only)
router.get('/settings', authenticateToken, companyController.getCompanySettings.bind(companyController));
router.put('/settings', authenticateToken, requireAdmin, companyController.updateCompanySettings.bind(companyController));
// Approval Flow Management (Admin only)
router.post('/approval-flows', authenticateToken, requireAdmin, validateApprovalFlow, companyController.createApprovalFlow.bind(companyController));
router.get('/approval-flows', authenticateToken, requireAdmin, companyController.getAllApprovalFlows.bind(companyController));
router.get('/approval-flows/:flowId', authenticateToken, requireAdmin, companyController.getApprovalFlowById.bind(companyController));
router.put('/approval-flows/:flowId', authenticateToken, requireAdmin, validateApprovalFlow, companyController.updateApprovalFlow.bind(companyController));
router.delete('/approval-flows/:flowId', authenticateToken, requireAdmin, companyController.deleteApprovalFlow.bind(companyController));
// Company Statistics (Admin only)
router.get('/statistics', authenticateToken, requireAdmin, companyController.getCompanyStatistics.bind(companyController));
// Company Users (Admin only)
router.get('/users', authenticateToken, requireAdmin, companyController.getCompanyUsers.bind(companyController));
export default router;
//# sourceMappingURL=company-new.js.map