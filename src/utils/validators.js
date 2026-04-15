/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and message
 */
export const isValidPassword = (password) => {
    if (!password || password.length < 6) {
        return {
            isValid: false,
            message: "Password must be at least 6 characters long",
        };
    }

    if (!/[A-Z]/.test(password)) {
        return {
            isValid: false,
            message: "Password must contain at least one uppercase letter",
        };
    }

    if (!/[0-9]/.test(password)) {
        return {
            isValid: false,
            message: "Password must contain at least one number",
        };
    }

    return { isValid: true, message: "Password is valid" };
};

/**
 * Validate login credentials
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} Validation result with errors
 */
export const validateLoginInput = (email, password) => {
    const errors = {};

    if (!email || !email.trim()) {
        errors.email = "Email is required";
    } else if (!isValidEmail(email)) {
        errors.email = "Email format is invalid";
    }

    if (!password) {
        errors.password = "Password is required";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Validate user registration data
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} Validation result with errors
 */
export const validateRegisterInput = (name, email, password) => {
    const errors = {};

    if (!name || !name.trim()) {
        errors.name = "Name is required";
    } else if (name.length < 2) {
        errors.name = "Name must be at least 2 characters";
    }

    if (!email || !email.trim()) {
        errors.email = "Email is required";
    } else if (!isValidEmail(email)) {
        errors.email = "Email format is invalid";
    }

    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.isValid) {
        errors.password = passwordValidation.message;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};
