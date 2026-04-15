import bcrypt from "bcrypt";
import { getConnection } from "../config/database.js";
import { validateLoginInput, validateRegisterInput } from "../utils/validators.js";
import { generateToken } from "../utils/jwt.js";

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

/**
 * User login
 * Validates credentials against database and returns JWT token
 */
export const login = async (req, res) => {
    const connection = await getConnection();

    try {
        const { email, password } = req.body;

        // Validate input
        const validation = validateLoginInput(email, password);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validation.errors,
            });
        }

        // Check if user exists
        const [users] = await connection.query(
            "SELECT id, name, email, password FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const user = users[0];

        // Compare password with bcrypt
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Generate JWT token
        const token = generateToken(user.id, user.email);

        // Return success response
        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    } finally {
        connection.release();
    }
};

/**
 * User registration
 * Creates new user account with hashed password
 */
export const register = async (req, res) => {
    const connection = await getConnection();

    try {
        const { name, email, password } = req.body;

        // Validate input
        const validation = validateRegisterInput(name, email, password);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validation.errors,
            });
        }

        // Check if user already exists
        const [existingUsers] = await connection.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already registered",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Insert user into database
        const [result] = await connection.query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        if (!result.insertId) {
            throw new Error("Failed to create user");
        }

        // Generate JWT token for auto-login
        const token = generateToken(result.insertId, email);

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            data: {
                token,
                user: {
                    id: result.insertId,
                    name,
                    email,
                },
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    } finally {
        connection.release();
    }
};

/**
 * Get current user profile
 * Requires valid JWT token
 */
export const getUserProfile = async (req, res) => {
    const connection = await getConnection();

    try {
        const userId = req.userId; // Set by auth middleware

        // Get user from database
        const [users] = await connection.query(
            "SELECT id, name, email, created_at FROM users WHERE id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const user = users[0];

        return res.status(200).json({
            success: true,
            message: "User profile retrieved",
            data: {
                user,
            },
        });
    } catch (error) {
        console.error("Get profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    } finally {
        connection.release();
    }
};

/**
 * Change user password
 * Validates old password before updating
 */
export const changePassword = async (req, res) => {
    const connection = await getConnection();

    try {
        const userId = req.userId; // Set by auth middleware
        const { oldPassword, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New passwords do not match",
            });
        }

        if (oldPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from old password",
            });
        }

        // Get user with password
        const [users] = await connection.query(
            "SELECT id, password FROM users WHERE id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const user = users[0];

        // Verify old password
        const passwordMatch = await bcrypt.compare(oldPassword, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Old password is incorrect",
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

        // Update password
        const [result] = await connection.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, userId]
        );

        if (result.affectedRows === 0) {
            throw new Error("Failed to update password");
        }

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error("Change password error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    } finally {
        connection.release();
    }
};
