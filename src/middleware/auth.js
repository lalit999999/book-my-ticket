import { verifyToken } from "../utils/jwt.js";

/**
 * Authentication middleware
 * Validates JWT token from Authorization header
 * Sets req.userId and req.userEmail if valid
 */
export const authenticate = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No authentication token provided",
            });
        }

        // Extract token
        const token = authHeader.substring(7); // Remove "Bearer " prefix

        // Verify token
        const decoded = verifyToken(token);

        // Attach user info to request
        req.userId = decoded.userId;
        req.userEmail = decoded.email;

        next();
    } catch (error) {
        console.error("Auth middleware error:", error);

        if (error.message === "Token has expired") {
            return res.status(401).json({
                success: false,
                message: "Token has expired. Please login again.",
            });
        }

        if (error.message === "Invalid token") {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token",
            });
        }

        return res.status(401).json({
            success: false,
            message: "Authentication failed",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/**
 * Optional authentication middleware
 * Validates JWT token if provided, but doesn't block requests without token
 */
export const authenticateOptional = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);

            req.userId = decoded.userId;
            req.userEmail = decoded.email;
            req.authenticated = true;
        } else {
            req.authenticated = false;
        }

        next();
    } catch (error) {
        // Log error but don't block request
        console.error("Optional auth error:", error);
        req.authenticated = false;
        next();
    }
};
