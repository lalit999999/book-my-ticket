# Jest Testing - Quick Command Reference

## 🚀 Quick Start (Copy & Paste)

### Terminal 1: Start Your Backend Server

```bash
npm run dev
```

This starts the server on `http://localhost:3000` with file watching enabled.

---

### Terminal 2: Install Jest (First Time Only)

```bash
npm install --save-dev jest
```

Verify installation:

```bash
npm list jest
```

---

## ▶️ Running Tests

### Run All Tests

```bash
npm test
```

### Run All Tests (Sequential Mode)

```bash
npm run test:all
```

Use this if tests fail due to timing issues.

### Run Tests with Full Details

```bash
npm run test:verbose
```

Shows each test and its result in detail.

### Run Only Authentication Tests

```bash
npm run test:auth
```

Tests: Registration, Login, JWT validation, User profile

### Run Only Booking Tests

```bash
npm run test:booking
```

Tests: Authenticated booking, Database verification, Release booking

### Run Tests in Watch Mode (Auto-Rerun)

```bash
npm run test:watch
```

Press `q` to quit watch mode.

### Run Tests with Code Coverage

```bash
npm run test:coverage
```

Shows what percentage of code is tested.

---

## 📋 Test Files Created

```
tests/
├── setup.js           # Helper functions (do not modify)
├── auth.test.js       # Authentication tests
└── booking.test.js    # Booking & database tests

jest.config.js         # Jest configuration
JEST_TESTING_GUIDE.md  # Full documentation (this file)
```

---

## 🧪 What Gets Tested

### ✅ Test 1: User Registration (`tests/auth.test.js`)

**Endpoint:** `POST /api/auth/register`

**Request:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

### ✅ Test 2: User Login (`tests/auth.test.js`)

**Endpoint:** `POST /api/auth/login`

**Request:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

### ✅ Test 3: JWT Token Validation (`tests/auth.test.js`)

**What's Tested:**

- Token format is valid (header.payload.signature)
- Token contains userId
- Token contains email
- Token can be used for protected endpoints
- Invalid tokens are rejected
- Missing tokens are rejected

**Token Inside (Decoded):**

```json
{
  "userId": 1,
  "email": "john@example.com",
  "iat": 1681234567,
  "exp": 1681321567
}
```

---

### ✅ Test 4: Copy JWT Token and Use for Protected API

**Endpoint:** `PUT /api/booking/book/{seatId}`

**Manual Test with Token:**

```bash
# Step 1: Login and save token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePassword123!"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"

# Step 2: Use token to book seat
curl -X PUT http://localhost:3000/api/booking/book/5 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**

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

---

### ✅ Test 5: Verify Booking in Database

**Endpoint:** `GET /api/booking/seats/{seatId}`

**Request:**

```bash
curl -X GET http://localhost:3000/api/booking/seats/5 \
  -H "Content-Type: application/json"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Seat A5",
    "isbooked": 1,
    "user_id": 1,                    ← ✅ User ID stored!
    "booked_at": "2024-01-15 10:30:45"  ← ✅ Timestamp!
  }
}
```

---

## 📊 Expected Test Output

When running `npm test`, you'll see:

```
 PASS  tests/auth.test.js
  Authentication Tests
    1. User Registration
      ✓ Should register a new user successfully
      ✓ Should not register with duplicate email
      ✓ Should not register with invalid email format
      ✓ Should not register with weak password
    2. User Login
      ✓ Should login with correct credentials
      ✓ Should not login with incorrect password
      ✓ Should not login with non-existent email
    3. JWT Token Validation
      ✓ Should have valid JWT token after login
      ✓ Token should be usable for protected endpoints
      ✓ Should reject requests with invalid token
      ✓ Should reject requests with missing token
    4. User Profile Endpoint
      ✓ Should retrieve user profile with valid token

 PASS  tests/booking.test.js
  Authenticated Booking Tests
    5. Authenticated Booking API
      ✓ Should book a seat with valid JWT token
      ✓ Should reject booking without JWT token
      ✓ Should reject booking with invalid JWT token
      ✓ Should prevent double-booking of same seat
    6. Database Verification
      ✓ Should verify booking in database
      ✓ Database should show correct user_id for booking
      ✓ Should show booking timestamp in database
    7. Release Booking
      ✓ Should release a booked seat with valid token
      ✓ Should verify released seat becomes available
    8. Complete Integration Flow
      ✓ Complete flow: Register → Login → Book → Verify

Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
Time:        5.912 s
```

---

## 🛠️ Troubleshooting Commands

### Check if server is running:

```bash
curl http://localhost:3000/api/booking/seats
```

### Kill process on port 3000 (if stuck):

```bash
lsof -ti :3000 | xargs kill -9
```

### Check if Jest is installed:

```bash
npm list jest
```

### Clear Jest cache:

```bash
npx jest --clearCache
```

### Check database connection:

```bash
# For MySQL
mysql -h localhost -u root -ppassword users_db

# For PostgreSQL
psql -h localhost -U postgres -d sql_class_2_db
```

---

## 🎯 Complete Testing Workflow

### Step 1: Setup (Run Once)

```bash
npm install --save-dev jest
npm install
```

### Step 2: Configure `.env`

```env
JWT_SECRET=your_secret_key
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=users_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=sql_class_2_db
PORT=3000
NODE_ENV=development
```

### Step 3: Start Server (Terminal 1)

```bash
npm run dev
```

### Step 4: Run Tests (Terminal 2)

```bash
npm test
```

### Step 5: View Results

- All tests pass ✅
- See detailed test output with assertions
- See database verification results

---

## 📝 Test Scripts in package.json

```json
{
  "scripts": {
    "start": "node index.mjs",
    "dev": "node --watch index.mjs",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:verbose": "jest --verbose",
    "test:coverage": "jest --coverage",
    "test:auth": "jest tests/auth.test.js",
    "test:booking": "jest tests/booking.test.js",
    "test:all": "jest --runInBand"
  }
}
```

---

## ✨ Key Testing Features

✅ **Automatic Test User Generation**

- Each test run creates unique test users
- Uses timestamps to avoid duplicates

✅ **Helper Functions**

- `registerUser()` - Register with validation
- `loginUser()` - Login and get token
- `bookSeat()` - Book with authentication
- `verifyBookingInDatabase()` - Verify storage

✅ **Complete Test Coverage**

- Registration validation
- Login security
- JWT token validation
- Protected endpoints
- Database integrity
- Concurrent access (double-booking prevention)

✅ **Detailed Logging**

- See what each test is doing
- View request/response details
- Database verification output

---

## 🚀 One-Command Testing

### Run everything at once:

```bash
# Terminal 1
npm run dev &

# Terminal 2 (after server starts)
npm test
```

Or use npm-run-all (if installed):

```bash
npm install --save-dev npm-run-all

# Then run:
npm-run-all -p dev test
```

---

## 📚 Files Created

| File                     | Purpose                       | Lines |
| ------------------------ | ----------------------------- | ----- |
| `tests/setup.js`         | Helper functions              | ~150  |
| `tests/auth.test.js`     | Auth tests (4 test suites)    | ~220  |
| `tests/booking.test.js`  | Booking tests (4 test suites) | ~380  |
| `jest.config.js`         | Jest config                   | ~10   |
| `JEST_TESTING_GUIDE.md`  | Full documentation            | ~500  |
| `jest-QUICK-COMMANDS.md` | This file                     | ~300  |

---

## 🎓 Learning Path

1. **Read:** `JEST_TESTING_GUIDE.md` (comprehensive guide)
2. **Run:** `npm test` (see all tests pass)
3. **Read:** `tests/auth.test.js` (understand auth tests)
4. **Read:** `tests/booking.test.js` (understand booking tests)
5. **Modify:** Create your own tests as needed

---

## 💡 Tips & Tricks

### Run tests with more detail:

```bash
npm run test:verbose
```

### Run tests and watch for changes:

```bash
npm run test:watch
```

### Run tests with coverage:

```bash
npm run test:coverage
```

### Run specific test file:

```bash
npx jest tests/auth.test.js
```

### Run specific test by name:

```bash
npx jest -t "Should register a new user"
```

### Debug mode:

```bash
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

---

## ✅ Success Criteria

Your tests are working correctly when:

✅ All 25 tests pass
✅ No timeouts
✅ Clear "passed" messages for each test
✅ Can see booking data in database
✅ JWT token is validated
✅ Double-booking is prevented

---

## 📞 Common Issues & Fixes

| Issue                                  | Fix                                          |
| -------------------------------------- | -------------------------------------------- |
| "Cannot find module jest"              | `npm install --save-dev jest`                |
| "EADDRINUSE: Port 3000 already in use" | `lsof -ti :3000 \| xargs kill -9`            |
| "ECONNREFUSED: Connection refused"     | Start server with `npm run dev`              |
| "Timeout"                              | Check server is responding, increase timeout |
| "No available seats"                   | Run after other tests finish or reset data   |

---
