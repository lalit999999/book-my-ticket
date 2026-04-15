import bcrypt from "bcrypt";
import { getConnection } from "../config/database.js";
import { validateRegisterInput } from "../utils/validators.js";
import { generateToken } from "../utils/jwt.js";

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

/**
 * User Registration Service
 * 
 * Handles:
 * 1. Input validation
 * 2. Email uniqueness check
 * 3. Password hashing
 * 4. User creation in database
 * 5. JWT token generation
 * 
 * @param {string} name - User's full name
 * @param {string} email - User's email (must be unique)
 * @param {string} password - User's password (min 6 chars, 1 uppercase, 1 number)
 * 
 * @returns {Promise<{success: boolean, data: {token, user}}>}
 * @throws {Error} On validation or database errors
 */
export const registerUser = async (name, email, password) => {
    // Validate input
    const validation = validateRegisterInput(name, email, password);
    if (!validation.isValid) {
        const error = new Error("Validation failed");
        error.code = "VALIDATION_ERROR";
        error.details = validation.errors;
        throw error;
    }

    const connection = await getConnection();

    try {
        // Check if email already exists
        const [existingUsers] = await connection.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            const error = new Error("Email already registered");
            error.code = "EMAIL_EXISTS";
            throw error;
        }

        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Insert new user into database
        const [result] = await connection.query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        if (!result.insertId) {
            throw new Error("Failed to create user");
        }

        // Generate JWT token for auto-login after registration
        const token = generateToken(result.insertId, email);

        return {
            success: true,
            data: {
                token,
                user: {
                    id: result.insertId,
                    name,
                    email,
                },
            },
        };
    } finally {
        connection.release();
    }
};

export default registerUser;
