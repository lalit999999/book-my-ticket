import bcrypt from "bcrypt";
import { getConnection } from "../config/database.js";
import { validateLoginInput } from "../utils/validators.js";
import { generateToken } from "../utils/jwt.js";

/**
 * User Login Service
 * 
 * Handles:
 * 1. Input validation
 * 2. User lookup by email
 * 3. Password verification with bcrypt
 * 4. JWT token generation
 * 
 * @param {string} email - User's email
 * @param {string} password - User's password (plain text, will be compared with hash)
 * 
 * @returns {Promise<{success: boolean, data: {token, user}}>}
 * @throws {Error} On validation, user not found, or wrong password
 */
export const loginUser = async (email, password) => {
    // Validate input
    const validation = validateLoginInput(email, password);
    if (!validation.isValid) {
        const error = new Error("Validation failed");
        error.code = "VALIDATION_ERROR";
        error.details = validation.errors;
        throw error;
    }

    const connection = await getConnection();

    try {
        // Find user by email
        const [users] = await connection.query(
            "SELECT id, name, email, password FROM users WHERE email = ?",
            [email]
        );

        // Check if user exists (don't reveal whether email is registered)
        if (users.length === 0) {
            const error = new Error("Invalid email or password");
            error.code = "INVALID_CREDENTIALS";
            throw error;
        }

        const user = users[0];

        // Compare provided password with stored hash
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            const error = new Error("Invalid email or password");
            error.code = "INVALID_CREDENTIALS";
            throw error;
        }

        // Generate JWT token on successful authentication
        const token = generateToken(user.id, user.email);

        return {
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            },
        };
    } finally {
        connection.release();
    }
};

export default loginUser;
