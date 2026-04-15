import express from "express";
import {
    login,
    register,
    getUserProfile,
    changePassword,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**
 * Public routes (no authentication required)
 */

/**
 * POST /api/auth/login
 * Login with email and password
 * Body: { email: string, password: string }
 * Returns: { success: boolean, token: string, user: object }
 */
router.post("/login", login);

/**
 * POST /api/auth/register
 * Register a new account
 * Body: { name: string, email: string, password: string }
 * Returns: { success: boolean, token: string, user: object }
 */
router.post("/register", register);

/**
 * Protected routes (authentication required)
 */

/**
 * GET /api/auth/profile
 * Get current user profile
 * Headers: { Authorization: "Bearer <token>" }
 * Returns: { success: boolean, user: object }
 */
router.get("/profile", authenticate, getUserProfile);

/**
 * POST /api/auth/change-password
 * Change user password
 * Headers: { Authorization: "Bearer <token>" }
 * Body: { oldPassword: string, newPassword: string, confirmPassword: string }
 * Returns: { success: boolean, message: string }
 */
router.post("/change-password", authenticate, changePassword);

export default router;
