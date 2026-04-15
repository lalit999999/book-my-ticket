import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

/**
 * Generate JWT token
 * @param {number} userId - User ID
 * @param {string} email - User email
 * @returns {string} JWT token
 */
export const generateToken = (userId, email) => {
    try {
        const token = jwt.sign(
            { userId, email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRE }
        );
        return token;
    } catch (error) {
        console.error("Error generating token:", error);
        throw new Error("Failed to generate authentication token");
    }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new Error("Token has expired");
        }
        if (error.name === "JsonWebTokenError") {
            throw new Error("Invalid token");
        }
        throw error;
    }
};

/**
 * Decode token without verifying (useful for debugging)
 * @param {string} token - JWT token
 * @returns {object} Decoded token
 */
export const decodeToken = (token) => {
    try {
        const decoded = jwt.decode(token);
        return decoded;
    } catch (error) {
        throw new Error("Failed to decode token");
    }
};
