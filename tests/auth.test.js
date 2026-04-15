/**
 * Authentication Tests
 * Tests: User Registration, Login, and JWT Token Generation
 */

import {
    registerUser,
    loginUser,
    getUserProfile,
    generateTestUser,
} from './setup.js';

describe('Authentication Tests', () => {
    let testUser;
    let authToken;

    beforeAll(() => {
        // Generate unique test user for this test suite
        testUser = generateTestUser();
        console.log('\n📝 Test User Created:', {
            email: testUser.email,
            name: testUser.name,
        });
    });

    /**
     * TEST 1: User Registration
     */
    describe('1. User Registration', () => {
        test('Should register a new user successfully', async () => {
            const response = await registerUser(testUser);

            expect(response.status).toBe(200);
            expect(response.message).toBe('Registration successful');
            expect(response.token).toBeDefined();
            expect(response.user).toBeDefined();
            expect(response.user.email).toBe(testUser.email);
            expect(response.user.name).toBe(testUser.name);

            console.log('\n✅ Registration successful');
            console.log('   Email:', response.user.email);
            console.log('   Name:', response.user.name);
            console.log('   Token (first 50 chars):', response.token.substring(0, 50) + '...');
        });

        test('Should not register with duplicate email', async () => {
            // First registration already done above
            // Try to register again with same email
            const response = await registerUser(testUser);

            expect(response.status).toBe(400);
            expect(response.message).toContain('Email already exists');

            console.log('\n✅ Duplicate email validation working');
            console.log('   Response:', response.message);
        });

        test('Should not register with invalid email format', async () => {
            const invalidUser = {
                name: 'Invalid User',
                email: 'invalid_email_format',
                password: 'TestPass123!',
            };

            const response = await registerUser(invalidUser);

            expect(response.status).toBe(400);
            expect(response.message).toContain('Email');

            console.log('\n✅ Email validation working');
        });

        test('Should not register with weak password', async () => {
            const weakPasswordUser = {
                name: 'Weak Pass User',
                email: `weakpass${Date.now()}@example.com`,
                password: '123',
            };

            const response = await registerUser(weakPasswordUser);

            expect(response.status).toBe(400);
            expect(response.message).toContain('Password');

            console.log('\n✅ Password validation working');
        });
    });

    /**
     * TEST 2: User Login
     */
    describe('2. User Login', () => {
        test('Should login with correct credentials', async () => {
            const credentials = {
                email: testUser.email,
                password: testUser.password,
            };

            const response = await loginUser(credentials);

            expect(response.status).toBe(200);
            expect(response.message).toBe('Login successful');
            expect(response.token).toBeDefined();
            expect(response.user).toBeDefined();
            expect(response.user.email).toBe(testUser.email);

            // Save token for next tests
            authToken = response.token;

            console.log('\n✅ Login successful');
            console.log('   Email:', response.user.email);
            console.log('   User ID:', response.user.id);
            console.log('   Token (first 50 chars):', response.token.substring(0, 50) + '...');
        });

        test('Should not login with incorrect password', async () => {
            const invalidCredentials = {
                email: testUser.email,
                password: 'WrongPassword123!',
            };

            const response = await loginUser(invalidCredentials);

            expect(response.status).toBe(401);
            expect(response.message).toBe('Invalid email or password');
            expect(response.token).toBeUndefined();

            console.log('\n✅ Authentication validation working');
            console.log('   Response:', response.message);
        });

        test('Should not login with non-existent email', async () => {
            const invalidCredentials = {
                email: 'nonexistent@example.com',
                password: 'SomePassword123!',
            };

            const response = await loginUser(invalidCredentials);

            expect(response.status).toBe(401);
            expect(response.message).toBe('Invalid email or password');

            console.log('\n✅ User existence validation working');
        });
    });

    /**
     * TEST 3: JWT Token Validation
     */
    describe('3. JWT Token Validation', () => {
        test('Should have valid JWT token after login', async () => {
            expect(authToken).toBeDefined();
            expect(authToken).toMatch(/^eyJ/); // JWT tokens start with eyJ

            // Decode token manually (without verification)
            const parts = authToken.split('.');
            expect(parts.length).toBe(3); // JWT has 3 parts: header.payload.signature

            // Decode payload
            const payload = Buffer.from(parts[1], 'base64').toString('utf8');
            const decoded = JSON.parse(payload);

            expect(decoded.userId).toBeDefined();
            expect(decoded.email).toBe(testUser.email);
            expect(decoded.exp).toBeDefined();

            console.log('\n✅ JWT token is valid');
            console.log('   User ID in token:', decoded.userId);
            console.log('   Email in token:', decoded.email);
            console.log('   Token format: header.payload.signature ✓');
        });

        test('Token should be usable for protected endpoints', async () => {
            const profileResponse = await getUserProfile(authToken);

            expect(profileResponse.status).toBe(200);
            expect(profileResponse.data).toBeDefined();
            expect(profileResponse.data.email).toBe(testUser.email);

            console.log('\n✅ Token works for protected endpoints');
            console.log('   Protected endpoint: GET /api/auth/profile');
            console.log('   Response:', profileResponse.data);
        });

        test('Should reject requests with invalid token', async () => {
            const invalidToken = 'invalid.token.format';
            const response = await getUserProfile(invalidToken);

            expect(response.status).toBe(401);
            expect(response.message).toContain('Invalid');

            console.log('\n✅ Invalid token rejection working');
        });

        test('Should reject requests with missing token', async () => {
            const response = await getUserProfile(null);

            expect(response.status).toBe(401);
            expect(response.message).toContain('No authentication token');

            console.log('\n✅ Missing token rejection working');
        });
    });

    /**
     * TEST 4: User Profile Endpoint
     */
    describe('4. User Profile Endpoint', () => {
        test('Should retrieve user profile with valid token', async () => {
            const response = await getUserProfile(authToken);

            expect(response.status).toBe(200);
            expect(response.data.email).toBe(testUser.email);
            expect(response.data.name).toBe(testUser.name);

            console.log('\n✅ User profile retrieved');
            console.log('   Email:', response.data.email);
            console.log('   Name:', response.data.name);
        });
    });

    afterAll(() => {
        console.log('\n🏁 Authentication Tests Complete\n');
    });
});
