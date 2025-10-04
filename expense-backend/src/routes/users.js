import express from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { requireAdmin, requireManager } from '../middlewares/roles.js';
import { validateUser, validateUserRole, validateManagerAssignment } from '../utils/validators.js';
const router = express.Router();
const userController = new UserController();
// Create new user (Admin only)
router.post('/', authenticateToken, requireAdmin, validateUser, userController.createUser.bind(userController));
// Get all users in company (Admin only)
router.get('/', authenticateToken, requireAdmin, userController.getAllUsers.bind(userController));
// Get user by ID (Admin only)
router.get('/:userId', authenticateToken, requireAdmin, userController.getUserById.bind(userController));
// Update user role (Admin only)
router.put('/:userId/role', authenticateToken, requireAdmin, validateUserRole, userController.updateUserRole.bind(userController));
// Assign manager relationship (Admin only)
router.post('/:userId/manager', authenticateToken, requireAdmin, validateManagerAssignment, userController.assignManager.bind(userController));
// Get team members (Manager/Admin only)
router.get('/team/members', authenticateToken, requireManager, userController.getTeamMembers.bind(userController));
// Delete user (Admin only)
router.delete('/:userId', authenticateToken, requireAdmin, userController.deleteUser.bind(userController));
export default router;
//# sourceMappingURL=users.js.map