import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test Helper Functions
 */

export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

/**
 * Make HTTP request to API
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} endpoint - API endpoint (e.g., '/api/auth/login')
 * @param {object} body - Request body (optional)
 * @param {string} token - JWT token (optional)
 * @returns {Promise<{status: number, data: object}>}
 */
export async function makeRequest(method, endpoint, body = null, token = null) {
    const url = `${BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
    };

    // Add Authorization header if token provided
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
    };

    // Add body for POST, PUT, PATCH requests
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();

        return {
            status: response.status,
            data,
        };
    } catch (error) {
        console.error(`Request failed: ${method} ${endpoint}`, error);
        throw error;
    }
}

/**
 * Register a new user
 * @param {object} userData - { name, email, password }
 * @returns {Promise<{status: number, token: string, user: object}>}
 */
export async function registerUser(userData) {
    const response = await makeRequest('POST', '/api/auth/register', userData);
    return {
        status: response.status,
        token: response.data.data?.token,
        user: response.data.data?.user,
        message: response.data.message,
    };
}

/**
 * Login user
 * @param {object} credentials - { email, password }
 * @returns {Promise<{status: number, token: string, user: object}>}
 */
export async function loginUser(credentials) {
    const response = await makeRequest('POST', '/api/auth/login', credentials);
    return {
        status: response.status,
        token: response.data.data?.token,
        user: response.data.data?.user,
        message: response.data.message,
    };
}

/**
 * Get user profile (requires authentication)
 * @param {string} token - JWT token
 * @returns {Promise<{status: number, data: object}>}
 */
export async function getUserProfile(token) {
    const response = await makeRequest('GET', '/api/auth/profile', null, token);
    return {
        status: response.status,
        data: response.data.data,
        message: response.data.message,
    };
}

/**
 * Book a seat (requires authentication)
 * @param {number} seatId - Seat ID
 * @param {string} token - JWT token
 * @returns {Promise<{status: number, data: object}>}
 */
export async function bookSeat(seatId, token) {
    const response = await makeRequest('PUT', `/api/booking/book/${seatId}`, {}, token);
    return {
        status: response.status,
        data: response.data.data,
        message: response.data.message,
        success: response.data.success,
    };
}

/**
 * Get all seats
 * @returns {Promise<{status: number, seats: array}>}
 */
export async function getAllSeats() {
    const response = await makeRequest('GET', '/api/booking/seats');
    return {
        status: response.status,
        seats: response.data.data,
    };
}

/**
 * Get specific seat
 * @param {number} seatId - Seat ID
 * @returns {Promise<{status: number, seat: object}>}
 */
export async function getSeatById(seatId) {
    const response = await makeRequest('GET', `/api/booking/seats/${seatId}`);
    return {
        status: response.status,
        seat: response.data.data,
    };
}

/**
 * Release/cancel a booking (requires authentication)
 * @param {number} seatId - Seat ID
 * @param {string} token - JWT token
 * @returns {Promise<{status: number, message: string}>}
 */
export async function releaseSeat(seatId, token) {
    const response = await makeRequest('DELETE', `/api/booking/${seatId}`, null, token);
    return {
        status: response.status,
        message: response.data.message,
    };
}

/**
 * Verify booking in database by checking seat details
 * @param {number} seatId - Seat ID
 * @returns {Promise<{status: number, seat: object, bookedByUser: number|null}>}
 */
export async function verifyBookingInDatabase(seatId) {
    try {
        const response = await makeRequest('GET', `/api/booking/seats/${seatId}`);
        return {
            status: response.status,
            seat: response.data.data,
            isBooked: response.data.data?.isbooked === 1,
            bookedByUser: response.data.data?.user_id || null,
        };
    } catch (error) {
        console.error('Failed to verify booking:', error);
        throw error;
    }
}

/**
 * Generate test user data
 * @returns {object} - { name, email, password }
 */
export function generateTestUser() {
    const timestamp = Date.now();
    return {
        name: `Test User ${timestamp}`,
        email: `testuser${timestamp}@example.com`,
        password: 'TestPassword123!',
    };
}

export default {
    makeRequest,
    registerUser,
    loginUser,
    getUserProfile,
    bookSeat,
    getAllSeats,
    getSeatById,
    releaseSeat,
    verifyBookingInDatabase,
    generateTestUser,
};
