# Jest API Testing Guide - Complete Instructions

## 📁 Test Folder Structure

```
book-my-ticket/
├── tests/
│   ├── setup.js              # Helper functions and utilities
│   ├── auth.test.js          # Authentication tests
│   └── booking.test.js       # Booking & database verification tests
├── jest.config.js            # Jest configuration
└── package.json              # Updated with test scripts
```

---

## 🚀 Installation & Setup

### Step 1: Install Jest

```bash
npm install --save-dev jest
```

### Step 2: Ensure Dependencies Are Installed

```bash
npm install
```

### Step 3: Verify Installation

```bash
npm list jest
```

You should see:

```
├── jest@...
```

---

## 📝 Setup Instructions

### 1. Ensure Server is Running

Before running tests, your backend server must be running:

```bash
# Terminal 1: Start the server
npm run dev
```

Or if using the standard start command:

```bash
npm start
```

The server should be running on `http://localhost:3000`

### 2. Verify Environment Variables

Make sure `.env` file exists with:

```env
# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# MySQL (User Auth)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=users_db

# PostgreSQL (Booking)
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=sql_class_2_db

# Server
PORT=3000
NODE_ENV=development
```

### 3. Optional: Set Test Base URL

You can override the default test URL in `.env`:

```env
TEST_BASE_URL=http://localhost:3000
```

---

## ▶️ Running Tests

### Run All Tests

```bash
npm test
```

Or with full command:

```bash
npm run test:all
```

### Run with Verbose Output

```bash
npm run test:verbose
```

Shows detailed information about each test.

### Run Authentication Tests Only

```bash
npm run test:auth
```

Tests registration, login, and JWT token validation.

### Run Booking Tests Only

```bash
npm run test:booking
```

Tests authenticated booking, database verification, and integration flows.

### Run Tests in Watch Mode

```bash
npm run test:watch
```

Automatically re-runs tests when files change.

### Run Tests with Coverage Report

```bash
npm run test:coverage
```

Shows code coverage statistics.

---

## 📊 Test Suites Overview

### Suite 1: Authentication Tests (`tests/auth.test.js`)

**Tests the following:**

#### ✅ User Registration

- Register new user successfully
- Reject duplicate email
- Validate email format
- Validate password strength

**Request Format:**

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

#### ✅ User Login

- Login with correct credentials
- Reject incorrect password
- Reject non-existent email

**Request Format:**

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

#### ✅ JWT Token Validation

- Token has valid JWT format (header.payload.signature)
- Token includes userId and email
- Token can be used for protected endpoints
- Invalid token is rejected
- Missing token is rejected

**Token Structure (Decoded):**

```json
{
  "userId": 1,
  "email": "john@example.com",
  "iat": 1681234567,
  "exp": 1681321567
}
```

---

#### ✅ User Profile Endpoint

- Retrieve user profile with valid token
- Profile matches registered user

**Request Format:**

```bash
GET /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### Suite 2: Booking Tests (`tests/booking.test.js`)

**Tests the following:**

#### ✅ Authenticated Booking API

- Book seat with valid JWT token
- Reject booking without token
- Reject booking with invalid token
- Prevent double-booking (409 Conflict)

**Request Format:**

```bash
PUT /api/booking/book/{seatId}
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Expected Success Response (200):**

```json
{
  "success": true,
  "message": "Seat booked successfully",
  "data": {
    "seatId": 5,
    "userId": 1,
    "bookedAt": "2024-01-15T10:30:45.123Z"
  }
}
```

**Expected Conflict Response (409):**

```json
{
  "success": false,
  "message": "Seat already booked or does not exist",
  "seatId": 5
}
```

**Expected Unauthorized Response (401):**

```json
{
  "success": false,
  "message": "No authentication token provided",
  "code": "NO_TOKEN"
}
```

---

#### ✅ Database Verification

- Booking is correctly stored in database
- User ID is associated with booking
- Booking timestamp is recorded

**Verification Process:**

```bash
# Check seat details via API
GET /api/booking/seats/{seatId}

# Database should show:
{
  "id": 5,
  "name": "Seat A5",
  "isbooked": 1,
  "user_id": 1,          # ✅ User ID stored!
  "booked_at": "2024-01-15 10:30:45"
}
```

---

#### ✅ Release Booking

- Release booked seat with valid token
- Released seat becomes available
- User ID removed from database

**Request Format:**

```bash
DELETE /api/booking/{seatId}
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Seat released successfully"
}
```

---

#### ✅ Complete Integration Flow

- Register user
- Login user
- Book seat
- Verify in database
  All in one test flow

---

## 🎯 Test Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. npm test (or npm run test:all)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─ Test Setup ─────────────────────────────────────────┐  │
│ │ Generate unique test user with timestamp             │  │
│ │ Register user → Get JWT token                        │  │
│ │ Get user ID from token                               │  │
│ │ Find available seat for testing                       │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ Auth Tests ──────────────────────────────────────────┐  │
│ │ 1. User Registration ✓                               │  │
│ │    - Register new user                               │  │
│ │    - Reject duplicate email                          │  │
│ │    - Validate formats                                │  │
│ │                                                      │  │
│ │ 2. User Login ✓                                      │  │
│ │    - Login with correct credentials                 │  │
│ │    - Reject invalid credentials                      │  │
│ │                                                      │  │
│ │ 3. JWT Token Validation ✓                            │  │
│ │    - Token format is valid                          │  │
│ │    - Contains userId and email                      │  │
│ │    - Works for protected endpoints                  │  │
│ │    - Rejects invalid/missing token                  │  │
│ │                                                      │  │
│ │ 4. User Profile ✓                                   │  │
│ │    - Retrieve profile with token                    │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ Booking Tests ───────────────────────────────────────┐  │
│ │ 5. Authenticated Booking API ✓                       │  │
│ │    - Book with valid token                          │  │
│ │    - Reject without token                           │  │
│ │    - Prevent double-booking                         │  │
│ │                                                      │  │
│ │ 6. Database Verification ✓                          │  │
│ │    - User ID stored in database                     │  │
│ │    - Booking timestamp recorded                     │  │
│ │    - Seat marked as booked                          │  │
│ │                                                      │  │
│ │ 7. Release Booking ✓                                │  │
│ │    - Release booked seat                            │  │
│ │    - Verify seat becomes available                  │  │
│ │                                                      │  │
│ │ 8. Integration Flow ✓                               │  │
│ │    - Complete flow from registration to booking     │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Example Test Output

When you run `npm test`, you'll see output like:

```
 PASS  tests/auth.test.js (2.345 s)
  Authentication Tests
    1. User Registration
      ✓ Should register a new user successfully (234 ms)
      ✓ Should not register with duplicate email (145 ms)
      ✓ Should not register with invalid email format (98 ms)
      ✓ Should not register with weak password (87 ms)
    2. User Login
      ✓ Should login with correct credentials (156 ms)
      ✓ Should not login with incorrect password (89 ms)
      ✓ Should not login with non-existent email (92 ms)
    3. JWT Token Validation
      ✓ Should have valid JWT token after login (45 ms)
      ✓ Token should be usable for protected endpoints (123 ms)
      ✓ Should reject requests with invalid token (67 ms)
      ✓ Should reject requests with missing token (52 ms)
    4. User Profile Endpoint
      ✓ Should retrieve user profile with valid token (98 ms)

 PASS  tests/booking.test.js (3.567 s)
  Authenticated Booking Tests
    5. Authenticated Booking API
      ✓ Should book a seat with valid JWT token (234 ms)
      ✓ Should reject booking without JWT token (145 ms)
      ✓ Should reject booking with invalid JWT token (156 ms)
      ✓ Should prevent double-booking of same seat (189 ms)
    6. Database Verification
      ✓ Should verify booking in database (98 ms)
      ✓ Database should show correct user_id for booking (87 ms)
      ✓ Should show booking timestamp in database (76 ms)
    7. Release Booking
      ✓ Should release a booked seat with valid token (167 ms)
      ✓ Should verify released seat becomes available (92 ms)
    8. Complete Integration Flow
      ✓ Complete flow: Register → Login → Book → Verify (1.234 s)

Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        5.912 s
```

---

## 🔧 Manual Testing Guide (Using cURL)

If you want to test manually alongside automated tests:

### 1. Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }'
```

### 2. Login User

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }'
```

**Save the token from response.**

### 3. Use Token to Book Seat

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X PUT http://localhost:3000/api/booking/book/5 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### 4. Verify Booking in Database

```bash
curl -X GET http://localhost:3000/api/booking/seats/5 \
  -H "Content-Type: application/json"
```

Check response for `user_id` and `booked_at` fields.

---

## ⚠️ Troubleshooting

### Issue: "Cannot find module 'jest'"

**Solution:**

```bash
npm install --save-dev jest
npm install
```

### Issue: "Error: listen EADDRINUSE: address already in use :::3000"

**Solution:** Another process is running on port 3000

```bash
# Kill process on port 3000
lsof -ti :3000 | xargs kill -9

# Then restart server
npm run dev
```

### Issue: "Timeout - Async callback was not invoked within the 5000ms timeout"

**Solution:** Server might be slow or not responding

```bash
# Check if server is running
curl http://localhost:3000/api/booking/seats

# Increase Jest timeout in jest.config.js:
testTimeout: 30000  # 30 seconds
```

### Issue: "connect ECONNREFUSED 127.0.0.1:3000"

**Solution:** Server is not running

```bash
# In another terminal, start the server
npm run dev
```

### Issue: "POST /api/auth/register - email already exists"

This is normal! Tests generate unique emails with timestamps. If you see this repeatedly, it means the database isn't being cleaned between test runs. This is okay for testing purposes.

### Issue: "No available seats for testing"

All seats are booked. Options:

1. Wait or run tests again later
2. Manually unbookall seats in database:
   ```sql
   UPDATE seats SET isbooked = 0, user_id = NULL, booked_at = NULL;
   ```

---

## 🏗️ Test Helper Functions (in `tests/setup.js`)

You can import these helper functions in your tests:

```javascript
import {
  registerUser, // Register new user
  loginUser, // Login user
  getUserProfile, // Get profile (protected)
  bookSeat, // Book seat (protected)
  getAllSeats, // Get all seats
  getSeatById, // Get specific seat
  releaseSeat, // Cancel booking (protected)
  verifyBookingInDatabase, // Verify booking
  generateTestUser, // Generate unique user
  makeRequest, // Make raw API request
} from "./setup.js";
```

**Example Usage:**

```javascript
import { registerUser, bookSeat } from "./setup.js";

test("My custom test", async () => {
  // Register user
  const userResp = await registerUser({
    name: "Test",
    email: "test@example.com",
    password: "Pass123!",
  });

  // Book seat
  const bookResp = await bookSeat(5, userResp.token);
  expect(bookResp.status).toBe(200);
});
```

---

## 📚 File Reference

| File                    | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `tests/setup.js`        | Helper functions, HTTP requests, test utilities |
| `tests/auth.test.js`    | Authentication & JWT token tests                |
| `tests/booking.test.js` | Booking API & database verification tests       |
| `jest.config.js`        | Jest configuration                              |
| `package.json`          | npm scripts and dependencies                    |

---

## ✅ Quick Checklist

- ✅ Node.js installed (`node --version`)
- ✅ npm/npm installed (`npm --version`)
- ✅ Jest installed (`npm install --save-dev jest`)
- ✅ `.env` file configured with database credentials
- ✅ Backend server running (`npm run dev`)
- ✅ MySQL database running
- ✅ PostgreSQL database running
- ✅ Test folder created (`tests/`)
- ✅ Test files in place (auth.test.js, booking.test.js)
- ✅ Ready to run tests!

---

## 🚀 Quick Start Command

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Run all tests
npm test

# Or run specific test suite
npm run test:auth
npm run test:booking

# Watch mode (auto-rerun)
npm run test:watch

# With coverage
npm run test:coverage
```

---

## 📊 Test Coverage

The test suite covers:

✅ **User Management**

- Registration with validation
- Login with credentials
- Profile retrieval
- Token generation

✅ **JWT Token**

- Token generation
- Token validation
- Token expiration
- Token format

✅ **Booking API**

- Authentication check
- Booking creation
- Double-booking prevention
- Concurrent requests handling

✅ **Database Integrity**

- User ID storage
- Timestamp recording
- Seat status updates
- Data consistency

✅ **Error Handling**

- 400 Bad Request
- 401 Unauthorized
- 409 Conflict
- 500 Server Error

✅ **Integration**

- Complete end-to-end flow
- Data consistency across layers
- Security validation

---

## 📞 Support

If tests fail:

1. Check server is running: `curl http://localhost:3000/api/booking/seats`
2. Check databases are connected
3. Check `.env` file configuration
4. Check test output logs for detailed errors
5. Try increasing Jest timeout if slow
