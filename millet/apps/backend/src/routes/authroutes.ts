import { Router } from 'express';
import { 
    registerUser, 
    loginUser, 
    getCurrentUser, 
    logoutUser, 
    refreshTokens, 
    verifyUserEmail, 
    forgotPassword, 
    resetPassword 
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validatemiddleware.js';
import { 
    registerUserSchema, 
    loginUserSchema, 
    forgotPasswordSchema, 
    resetPasswordSchema 
} from '../dtos';
import { protect } from '../middleware/authmiddleware.js';

const router = Router();

// Public routes
router.post('/register', validate(registerUserSchema), registerUser);
router.post('/login', validate(loginUserSchema), loginUser);
router.get('/verify-email', verifyUserEmail);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/refresh', refreshTokens);

// Protected routes
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getCurrentUser);

export default router;