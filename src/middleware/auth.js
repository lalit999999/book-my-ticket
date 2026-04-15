import { verifyToken } from "../utils/jwt.js";

/**
 * Authentication middleware
 * 
 * Validates JWT token from Authorization header:
 * - Reads token from "Authorization: Bearer {token}"
 * - Verifies token signature and expiration
 * - Extracts userId from token payload
 * - Attaches user object to req.user
 * 
 * Rejects requests if:
 * - Authorization header is missing
 * - Token is invalid or tampered with
 * - Token has expired
 * - Secret key doesn't match
 * 
 * Usage:
 *   app.get('/protected', authenticate, (req, res) => {
 *     console.log(req.user.id);      // User ID
 *     console.log(req.user.email);   // User email
 *   });
 */
export const authenticate = (req, res, next) => {
    try {
        // Step 1: Get token from Authorization header
        const authHeader = req.headers.authorization;

        // Validate header exists and has correct format
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "No authentication token provided",
                code: "NO_TOKEN",
            });
        }

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Invalid Authorization header format. Use 'Bearer {token}'",
                code: "INVALID_FORMAT",
            });
        }

        // Step 2: Extract token (remove "Bearer " prefix)
        const token = authHeader.substring(7);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token is empty",
                code: "EMPTY_TOKEN",
            });
        }

        // Step 3: Verify token using secret key
        const decoded = verifyToken(token);

        // Step 4: Attach user object to request
        // Standard Express pattern: req.user
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            iat: decoded.iat,        // Issued at time
            exp: decoded.exp,        // Expiration time
        };

        // Also attach for backward compatibility
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.token = token;

        // Step 5: Allow request to proceed
        next();

    } catch (error) {
        console.error("Auth middleware error:", error);

        // Handle specific error types
        if (error.message === "Token has expired") {
            return res.status(401).json({
                success: false,
                message: "Token has expired. Please login again.",
                code: "TOKEN_EXPIRED",
            });
        }

        if (error.message === "Invalid token") {
            return res.status(401).json({
                success: false,
                message: "Invalid or tampered authentication token",
                code: "INVALID_TOKEN",
            });
        }

        if (error.message === "jwt malformed") {
            return res.status(401).json({
                success: false,
                message: "Malformed JWT token",
                code: "MALFORMED_TOKEN",
            });
        }

        // Generic error
        return res.status(401).json({
            success: false,
            message: "Authentication failed",
            code: "AUTH_FAILED",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/**
 * Optional authentication middleware
 * Validates JWT token if provided, but doesn't block requests without token
 * 
 * Behavior:
 * - If Authorization header with valid token: populates req.user
 * - If no token or invalid token: allows request to proceed (req.user undefined)
 * - Sets req.authenticated = true/false for easy checking
 * 
 * Useful for:
 * - Public endpoints that show different content for authenticated users
 * - Analytics endpoints that track both users and guests
 * - Read-only endpoints with optional user personalization
 * 
 * Usage:
 *   app.get('/posts', authenticateOptional, (req, res) => {
 *     if (req.authenticated) {
 *       // Show personalized posts for user
 *     } else {
 *       // Show default posts for guest
 *     }
 *   });
 */
export const authenticateOptional = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Initialize as not authenticated
        req.authenticated = false;
        req.user = null;

        // Try to authenticate if header is present
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);

            try {
                const decoded = verifyToken(token);

                // Successfully authenticated
                req.user = {
                    id: decoded.userId,
                    email: decoded.email,
                    iat: decoded.iat,
                    exp: decoded.exp,
                };

                // Also attach for backward compatibility
                req.userId = decoded.userId;
                req.userEmail = decoded.email;
                req.token = token;
                req.authenticated = true;
            } catch (tokenError) {
                // Token provided but invalid - log and allow request
                console.warn("Optional auth - invalid token provided:", tokenError.message);
                req.authenticated = false;
                req.user = null;
            }
        }

        next();

    } catch (error) {
        // Unexpected error - log but don't block request
        console.error("Optional auth middleware error:", error);
        req.authenticated = false;
        req.user = null;
        next();
    }
};
