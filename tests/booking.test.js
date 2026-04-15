/**
 * Booking Tests with Authentication
 * Tests: Protected booking endpoint with JWT token, database verification
 */

import {
    registerUser,
    loginUser,
    bookSeat,
    getAllSeats,
    getSeatById,
    releaseSeat,
    verifyBookingInDatabase,
    generateTestUser,
} from './setup.js';

describe('Authenticated Booking Tests', () => {
    let testUser;
    let authToken;
    let userId;
    let availableSeatId;

    beforeAll(async () => {
        console.log('\n🔐 Setting up authentication for booking tests...');

        // Generate unique test user
        testUser = generateTestUser();

        // Step 1: Register user
        const registerResponse = await registerUser(testUser);
        if (registerResponse.status !== 200) {
            throw new Error(`Registration failed: ${registerResponse.message}`);
        }
        authToken = registerResponse.token;
        userId = registerResponse.user.id;

        console.log('✅ User registered');
        console.log('   User ID:', userId);
        console.log('   Email:', testUser.email);

        // Step 2: Find an available seat
        const seatsResponse = await getAllSeats();
        const availableSeat = seatsResponse.seats.find(seat => !seat.isbooked);

        if (!availableSeat) {
            throw new Error('No available seats for testing');
        }

        availableSeatId = availableSeat.id;

        console.log('✅ Found available seat');
        console.log('   Seat ID:', availableSeatId);
        console.log('   Seat Name:', availableSeat.name);
    });

    /**
     * TEST 5: Authenticated Booking Request
     */
    describe('5. Authenticated Booking API', () => {
        test('Should book a seat with valid JWT token', async () => {
            console.log('\n📅 Attempting to book seat:', availableSeatId);
            console.log('   With token:', authToken.substring(0, 30) + '...');

            const response = await bookSeat(availableSeatId, authToken);

            expect(response.status).toBe(200);
            expect(response.success).toBe(true);
            expect(response.message).toBe('Seat booked successfully');
            expect(response.data.seatId).toBe(availableSeatId);
            expect(response.data.userId).toBe(userId);
            expect(response.data.bookedAt).toBeDefined();

            console.log('\n✅ Booking successful!');
            console.log('   Seat ID:', response.data.seatId);
            console.log('   User ID:', response.data.userId);
            console.log('   Booked At:', response.data.bookedAt);
        });

        test('Should reject booking without JWT token', async () => {
            // Get another available seat
            const seatsResponse = await getAllSeats();
            const availableSeat = seatsResponse.seats.find(
                seat => !seat.isbooked && seat.id !== availableSeatId
            );

            if (!availableSeat) {
                console.log('⚠️  No additional available seats to test');
                return;
            }

            console.log('\n📅 Attempting booking without token');

            const response = await bookSeat(availableSeat.id, null);

            expect(response.status).toBe(401);
            expect(response.message).toContain('No authentication token');

            console.log('\n✅ Token validation working');
            console.log('   Response:', response.message);
        });

        test('Should reject booking with invalid JWT token', async () => {
            const seatsResponse = await getAllSeats();
            const availableSeat = seatsResponse.seats.find(
                seat => !seat.isbooked && seat.id !== availableSeatId
            );

            if (!availableSeat) {
                console.log('⚠️  No additional available seats to test');
                return;
            }

            console.log('\n📅 Attempting booking with invalid token');

            const response = await bookSeat(availableSeat.id, 'invalid.token.format');

            expect(response.status).toBe(401);
            expect(response.message).toContain('Invalid');

            console.log('\n✅ Invalid token rejection working');
        });

        test('Should prevent double-booking of same seat', async () => {
            console.log('\n📅 Testing double-booking prevention');
            console.log('   Attempting to book already-booked seat:', availableSeatId);

            const response = await bookSeat(availableSeatId, authToken);

            expect(response.status).toBe(409);
            expect(response.message).toContain('Seat already booked');

            console.log('\n✅ Double-booking prevention working!');
            console.log('   Response status: 409 Conflict');
            console.log('   Response message:', response.message);
        });
    });

    /**
     * TEST 6: Database Verification
     */
    describe('6. Database Verification', () => {
        test('Should verify booking in database', async () => {
            console.log('\n🔍 Verifying booking in database');
            console.log('   Seat ID:', availableSeatId);

            const verification = await verifyBookingInDatabase(availableSeatId);

            expect(verification.status).toBe(200);
            expect(verification.isBooked).toBe(true);
            expect(verification.bookedByUser).toBe(userId);

            console.log('\n✅ Booking verified in database!');
            console.log('   Seat booked:', verification.isBooked);
            console.log('   Booked by user ID:', verification.bookedByUser);
            console.log('   Full seat data:', verification.seat);
        });

        test('Database should show correct user_id for booking', async () => {
            const seatDetails = await getSeatById(availableSeatId);

            expect(seatDetails.status).toBe(200);
            expect(seatDetails.seat.user_id).toBe(userId);
            expect(seatDetails.seat.isbooked).toBe(1);

            console.log('\n✅ User ID correctly stored in database');
            console.log('   Database seat.user_id:', seatDetails.seat.user_id);
            console.log('   Expected user ID:', userId);
            console.log('   Match:', seatDetails.seat.user_id === userId);
        });

        test('Should show booking timestamp in database', async () => {
            const seatDetails = await getSeatById(availableSeatId);

            expect(seatDetails.seat.booked_at).toBeDefined();

            console.log('\n✅ Booking timestamp recorded in database');
            console.log('   Booked at:', seatDetails.seat.booked_at);
        });
    });

    /**
     * TEST 7: Release/Cancel Booking
     */
    describe('7. Release Booking', () => {
        let secondTestSeatId;

        beforeAll(async () => {
            // Book another seat for release testing
            const seatsResponse = await getAllSeats();
            const availableSeat = seatsResponse.seats.find(seat => !seat.isbooked);

            if (availableSeat) {
                const bookResponse = await bookSeat(availableSeat.id, authToken);
                if (bookResponse.status === 200) {
                    secondTestSeatId = bookResponse.data.seatId;
                }
            }
        });

        test('Should release a booked seat with valid token', async () => {
            if (!secondTestSeatId) {
                console.log('⚠️  No seat available for release testing');
                return;
            }

            console.log('\n🔓 Releasing booked seat:', secondTestSeatId);

            const response = await releaseSeat(secondTestSeatId, authToken);

            expect(response.status).toBe(200);
            expect(response.message).toContain('released');

            console.log('\n✅ Seat released successfully');
            console.log('   Response:', response.message);
        });

        test('Should verify released seat becomes available', async () => {
            if (!secondTestSeatId) {
                console.log('⚠️  No seat was released to verify');
                return;
            }

            const seatDetails = await getSeatById(secondTestSeatId);

            expect(seatDetails.seat.isbooked).toBe(0);
            expect(seatDetails.seat.user_id).toBeNull();

            console.log('\n✅ Released seat verified as available');
            console.log('   Seat now available:', seatDetails.seat.isbooked === 0);
        });
    });

    /**
     * TEST 8: Complete Flow Integration
     */
    describe('8. Complete Integration Flow', () => {
        test('Complete flow: Register → Login → Book → Verify', async () => {
            console.log('\n🔄 Testing complete integration flow...\n');

            // Step 1: Register
            console.log('Step 1️⃣  Register new user');
            const newTestUser = generateTestUser();
            const registerResp = await registerUser(newTestUser);
            expect(registerResp.status).toBe(200);
            expect(registerResp.token).toBeDefined();
            console.log('✅ User registered:', newTestUser.email);

            // Step 2: Login
            console.log('\nStep 2️⃣  Login with credentials');
            const loginResp = await loginUser({
                email: newTestUser.email,
                password: newTestUser.password,
            });
            expect(loginResp.status).toBe(200);
            const integrationToken = loginResp.token;
            console.log('✅ User logged in, token received');

            // Step 3: Get available seat
            console.log('\nStep 3️⃣  Find available seat');
            const seatsResp = await getAllSeats();
            const availableSeat = seatsResp.seats.find(seat => !seat.isbooked);
            expect(availableSeat).toBeDefined();
            console.log('✅ Found available seat:', availableSeat.id);

            // Step 4: Book seat
            console.log('\nStep 4️⃣  Book seat with token');
            const bookResp = await bookSeat(availableSeat.id, integrationToken);
            expect(bookResp.status).toBe(200);
            expect(bookResp.data.userId).toBe(loginResp.user.id);
            console.log('✅ Seat booked successfully');

            // Step 5: Verify in database
            console.log('\nStep 5️⃣  Verify booking in database');
            const verifyResp = await verifyBookingInDatabase(availableSeat.id);
            expect(verifyResp.isBooked).toBe(true);
            expect(verifyResp.bookedByUser).toBe(loginResp.user.id);
            console.log('✅ Booking verified in database');

            console.log('\n🎉 Complete integration flow successful!\n');
        });
    });

    afterAll(() => {
        console.log('\n🏁 Booking Tests Complete\n');
    });
});
