import express from 'express';
import { FlowController } from '../controllers/flowController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { requireAdmin, requireManager } from '../middlewares/roles.js';
import { validateApprovalFlow, validateApprovalAction } from '../utils/validators.js';
const router = express.Router();
const flowController = new FlowController();
// Approval Flow Management (Admin only)
router.post('/approval-flows', authenticateToken, requireAdmin, validateApprovalFlow, flowController.createApprovalFlow.bind(flowController));
router.get('/approval-flows', authenticateToken, requireAdmin, flowController.getAllApprovalFlows.bind(flowController));
router.get('/approval-flows/:flowId', authenticateToken, requireAdmin, flowController.getApprovalFlowById.bind(flowController));
router.put('/approval-flows/:flowId', authenticateToken, requireAdmin, validateApprovalFlow, flowController.updateApprovalFlow.bind(flowController));
router.delete('/approval-flows/:flowId', authenticateToken, requireAdmin, flowController.deleteApprovalFlow.bind(flowController));
// Approval Workflow (Manager/Admin)
router.get('/pending', authenticateToken, requireManager, flowController.getPendingApprovals.bind(flowController));
router.post('/:requestId/approve', authenticateToken, requireManager, flowController.approveExpense.bind(flowController));
router.post('/:requestId/reject', authenticateToken, requireManager, flowController.rejectExpense.bind(flowController));
router.get('/expense/:expenseId/history', authenticateToken, requireManager, flowController.getApprovalHistory.bind(flowController));
// Admin Override
router.post('/:requestId/override', authenticateToken, requireAdmin, validateApprovalAction, flowController.overrideApproval.bind(flowController));
// Company-wide Approvals (Admin only)
router.get('/company/all', authenticateToken, requireAdmin, flowController.getCompanyApprovals.bind(flowController));
export default router;
//# sourceMappingURL=flows.js.map