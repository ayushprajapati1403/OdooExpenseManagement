import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validateSignup, validateLogin } from '../utils/validators.js';

const router = express.Router();
const authController = new AuthController();

// Signup - Auto-creates company and admin user
router.post('/signup', validateSignup, authController.signup.bind(authController));

// Login
router.post('/login', validateLogin, authController.login.bind(authController));

// Get current user profile
router.get('/profile', authenticateToken, authController.getProfile.bind(authController));

export default router;