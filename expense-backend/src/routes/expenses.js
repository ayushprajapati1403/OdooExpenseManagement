import express from 'express';
import { ExpenseController } from '../controllers/expenseController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { requireManager } from '../middlewares/roles.js';
import { validateExpense, validateExpenseUpdate } from '../utils/validators.js';
const router = express.Router();
const expenseController = new ExpenseController();
// Submit expense
router.post('/', authenticateToken, validateExpense, expenseController.createExpense.bind(expenseController));
// Get user's expenses
router.get('/my-expenses', authenticateToken, expenseController.getUserExpenses.bind(expenseController));
// Get expense by ID
router.get('/:expenseId', authenticateToken, expenseController.getExpenseById.bind(expenseController));
// Update expense (only if pending)
router.put('/:expenseId', authenticateToken, validateExpenseUpdate, expenseController.updateExpense.bind(expenseController));
// Delete expense (only if pending)
router.delete('/:expenseId', authenticateToken, expenseController.deleteExpense.bind(expenseController));
// Get all expenses in company (Admin/Manager only)
router.get('/company/all', authenticateToken, requireManager, expenseController.getCompanyExpenses.bind(expenseController));
// Get expense statistics (Admin/Manager only)
router.get('/company/statistics', authenticateToken, requireManager, expenseController.getExpenseStatistics.bind(expenseController));
export default router;
//# sourceMappingURL=expenses.js.map