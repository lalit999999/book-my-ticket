# Authentication to Booking System - Complete Flow

## 📋 Overview

This document explains the complete flow of how authentication integrates with the booking system, from user login to successful seat booking.

---

## 🔄 End-to-End Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        1. USER REGISTRATION                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Client                          Server                            │
│    │                               │                              │
│    ├─ POST /api/auth/register      │                              │
│    │  { name, email, password }    │                              │
│    │────────────────────────────> │                              │
│    │                               │                              │
│    │                    authController.register()                 │
│    │                    - Hash password with bcrypt               │
│    │                    - Insert user into MySQL                  │
│    │                    - Generate JWT token                      │
│    │                    - Return token + user data                │
│    │                               │                              │
│    │ { token, user: {...} }        │                              │
│    │<──────────────────────────────┤                              │
│    │                               │                              │
│    │ ✅ User account created       │                              │
│    │ ✅ JWT token received         │                              │
│    │                               │                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          2. USER LOGIN                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Client                          Server                            │
│    │                               │                              │
│    ├─ POST /api/auth/login         │                              │
│    │  { email, password }          │                              │
│    │────────────────────────────> │                              │
│    │                               │                              │
│    │                    authController.login()                    │
│    │                    - Query: SELECT user FROM users           │
│    │                    - Verify: bcrypt.compare(password)        │
│    │                    - Generate JWT token                      │
│    │                    - Return token + user profile             │
│    │                               │                              │
│    │ { token, user: {...} }        │                              │
│    │<──────────────────────────────┤                              │
│    │                               │                              │
│    │ ✅ User authenticated         │                              │
│    │ ✅ JWT token received         │                              │
│    │ ✅ Stored in client (cookie/session)                        │
│    │                               │                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    3. AUTHENTICATED BOOKING REQUEST                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Client                          Server                            │
│    │                               │                              │
│    ├─ PUT /api/booking/book/5      │                              │
│    │  Headers: {                   │                              │
│    │    Authorization:             │                              │
│    │    "Bearer <jwt_token>"       │                              │
│    │  }                            │                              │
│    │────────────────────────────> │                              │
│    │                               │                              │
│    │                    middleware/auth.js (authenticate)         │
│    │                    - Extract token from header               │
│    │                    - Call verifyToken(token)                 │
│    │                    - Decode JWT                              │
│    │                    - Extract userId from payload             │
│    │                    - Set req.user = { id, email }            │
│    │                    - Call next() → proceed to controller     │
│    │                               │                              │
│    │                   bookingController.bookSeatAuthenticated()   │
│    │                    1. Get seatId from URL params             │
│    │                    2. Get userId from req.user.id            │
│    │                    3. BEGIN transaction                      │
│    │                    4. SELECT * FROM seats WHERE id = ?       │
│    │                       FOR UPDATE (acquire lock)              │
│    │                    5. Check if seat is available             │
│    │                    6. If available:                          │
│    │                       UPDATE seats SET                       │
│    │                       isbooked = 1,                          │
│    │                       user_id = ?,                           │
│    │                       booked_at = NOW()                      │
│    │                    7. COMMIT (persist & release lock)        │
│    │                    8. Return success response                │
│    │                               │                              │
│    │ { success: true,              │                              │
│    │   data: { seatId, userId,    │                              │
│    │           bookedAt } }        │                              │
│    │<──────────────────────────────┤                              │
│    │                               │                              │
│    │ ✅ Seat booked successfully   │                              │
│    │ ✅ User associated with seat  │                              │
│    │                               │                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 System Architecture Components

### 1. **Authentication Layer** (`src/auth/`, `src/utils/jwt.js`)

**Purpose:** Manage user identity and credential verification

**Components:**

- `registerService.js` - User account creation
- `loginService.js` - User credential verification
- `jwt.js` - Token generation and verification

**Key Functions:**

```javascript
// Generate JWT Token (called during login/register)
generateToken(userId, email);
// Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// Verify JWT Token (called by middleware)
verifyToken(token);
// Returns: { userId: 1, email: "user@example.com", iat: 1234567890, exp: 1235567890 }
```

**When Used:**

- After successful registration
- After successful login
- Before accessing protected routes

---

### 2. **Middleware Layer** (`src/middleware/auth.js`)

**Purpose:** Validate token and extract user information for protected routes

**How It Works:**

```javascript
authenticate(req, res, next) {
  // Step 1: Get "Authorization: Bearer {token}" header
  // Step 2: Extract token (remove "Bearer " prefix)
  // Step 3: Verify token using JWT secret
  // Step 4: Attach user object to req.user
  //   req.user = { id, email, iat, exp }
  // Step 5: Call next() to proceed to controller
}
```

**Protected Routes Using This Middleware:**

```javascript
// Require valid JWT token
router.put("/book/:seatId", authenticate, bookSeatAuthenticated);
router.delete("/:id", authenticate, releaseSeat);
router.get("/profile", authenticate, getUserProfile);
router.post("/change-password", authenticate, changePassword);
```

---

### 3. **Booking Layer** (`src/booking/bookingController.js`)

**Purpose:** Handle seat booking with user association and transaction safety

**Key Function:** `bookSeatAuthenticated()`

```javascript
// Receives authenticated request with user info
export const bookSeatAuthenticated = async (req, res) => {
  const seatId = req.params.seatId;        // From URL
  const userId = req.user.id;              // ✅ From authenticated request

  // Transaction-based booking
  BEGIN TRANSACTION
    SELECT * FROM seats WHERE id = seatId FOR UPDATE  // Lock row
    IF seat is available:
      UPDATE seats SET isbooked=1, user_id=userId, booked_at=NOW()
      COMMIT  // Persist and release lock
    ELSE:
      ROLLBACK  // Release lock without updating
  END
}
```

**Data Consistency Features:**

- ✅ Row-level locking prevents double-booking
- ✅ User ID stored with each booking
- ✅ Timestamp recorded (booked_at)
- ✅ Atomic transaction (all-or-nothing)
- ✅ Automatic rollback on error

---

## 📝 Database Schema - User Association

### Users Table (MySQL)

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- Bcrypt hashed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Seats Table (PostgreSQL)

```sql
CREATE TABLE seats (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  isbooked SMALLINT DEFAULT 0,
  user_id INT,                      -- ✅ Associates seat with user
  booked_at TIMESTAMP,              -- ✅ When seat was booked
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Key Additions for Authentication:**

- `user_id` - Links booking to authenticated user
- `booked_at` - Timestamp of booking
- Foreign key relationship for data integrity

---

## 🔑 Token Structure

### JWT Token Payload

When a user logs in, the server creates a JWT containing:

```javascript
{
  userId: 1,                         // User's ID in database
  email: "user@example.com",         // User's email
  iat: 1681234567,                   // Issued at (Unix timestamp)
  exp: 1681321567                    // Expiration (7 days from issue)
}
```

**Encoded as:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTY4MTIzNDU2NywiZXhwIjoxNjgxMzIxNTY3fQ.xKj6...`

---

## 🚀 Step-by-Step: Login to Booking

### **Step 1: User Registration**

**Request:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

**Response:**

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

**Behind the Scenes:**

1. Validate email format and password strength
2. Check if email already exists
3. Hash password using bcrypt (10 rounds)
4. Insert user into `users` table
5. Generate JWT token with userId
6. Return token to client

---

### **Step 2: User Login**

**Request:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

**Response:**

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

**Behind the Scenes:**

1. Query `users` table: `SELECT * WHERE email = ?`
2. Compare provided password with bcrypt hash
3. If match: Generate JWT token with userId
4. If no match: Return 401 Unauthorized
5. Return token to client

**Client stores token** (in localStorage, sessionStorage, or secure cookie)

---

### **Step 3: Authenticated Booking Request**

**Request:**

```bash
curl -X PUT http://localhost:3000/api/booking/book/5 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**Token Extraction & Validation:**

```
1. Middleware sees Authorization header:
   "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

2. Extract token (remove "Bearer " prefix):
   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

3. Verify with secret key (JWT_SECRET):
   - Check signature is valid
   - Check token hasn't expired
   - Decode to extract payload

4. Set req.user object:
   req.user = {
     id: 1,
     email: "john@example.com",
     iat: 1681234567,
     exp: 1681321567
   }

5. Proceed to controller
```

**Booking Transaction:**

```
Controller receives:
- req.params.seatId = 5
- req.user.id = 1 (authenticated user)

BEGIN TRANSACTION
  SELECT * FROM seats WHERE id = 5 FOR UPDATE
  ├─ If seat is available (isbooked = 0):
  │  ├─ UPDATE seats SET isbooked = 1, user_id = 1, booked_at = NOW()
  │  ├─ COMMIT (lock released, changes persisted)
  │  └─ Return 200 { success: true, data: {...} }
  │
  └─ If seat is booked (isbooked = 1):
     ├─ ROLLBACK (lock released, no changes)
     └─ Return 409 { success: false, message: "Seat already booked" }
```

**Response:**

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

**In Database:**

```sql
-- Seats table updated:
UPDATE seats SET isbooked = 1, user_id = 1, booked_at = '2024-01-15 10:30:45' WHERE id = 5;
```

---

## 🔒 Security Features

### 1. **Password Security**

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ Never stored in plaintext
- ✅ Bcrypt uses salt, resistant to rainbow table attacks

### 2. **Token Security**

- ✅ JWT signed with secret key (JWT_SECRET)
- ✅ Tampered tokens fail verification
- ✅ Tokens have expiration date (default: 7 days)
- ✅ Sent via Authorization header (not in URL)

### 3. **Booking Security**

- ✅ Requires valid JWT token (authentication)
- ✅ Row-level locking prevents double-booking
- ✅ User ID must match booking request
- ✅ Transaction atomicity prevents partial updates

### 4. **Error Handling**

- ✅ No token → 401 Unauthorized
- ✅ Expired token → 401 Token expired
- ✅ Invalid credentials → 401 Invalid email or password
- ✅ Invalid token → 401 Invalid or tampered token
- ✅ Seat unavailable → 409 Conflict

---

## 📊 Concurrency Protection

### Race Condition Prevention

**Without Transaction + FOR UPDATE (Vulnerable):**

```
Timeline:
T1: User A - SELECT seats WHERE id = 5 (available) ✓
T2: User B - SELECT seats WHERE id = 5 (available) ✓
T3: User A - UPDATE seats SET isbooked = 1
T4: User B - UPDATE seats SET isbooked = 1  ← Both booked same seat! ⚠️
```

**With Transaction + FOR UPDATE (Protected):**

```
Timeline:
T1: User A - BEGIN; SELECT... FOR UPDATE (acquires lock)
T2: User B - BEGIN; SELECT... FOR UPDATE (waits for lock)
T3: User A - UPDATE seats SET isbooked = 1; COMMIT (releases lock)
T4: User B - SELECT... FOR UPDATE (now gets released lock)
T5: User B - (checks rowCount, finds 0 - already booked)
T6: User B - ROLLBACK (releases lock, returns 409)
```

**Result:** Only User A succeeds (200 OK), User B gets conflict (409 Conflict)

---

## 🧪 Testing the Full Flow

### Test 1: Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Smith",
    "email": "alice@example.com",
    "password": "Alice123Secure"
  }'

# Response includes token
```

### Test 2: Book Seat (Authenticated)

```bash
# Extract token from previous response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Book seat with token
curl -X PUT http://localhost:3000/api/booking/book/3 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Response: { success: true, data: { seatId: 3, userId: 1, bookedAt: "..." } }
```

### Test 3: Try Booking Without Token (Should Fail)

```bash
curl -X PUT http://localhost:3000/api/booking/book/3 \
  -H "Content-Type: application/json"

# Response: 401 { success: false, message: "No authentication token provided" }
```

### Test 4: Try Booking Already Booked Seat

```bash
# Attempt to book seat 3 again
curl -X PUT http://localhost:3000/api/booking/book/3 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Response: 409 { success: false, message: "Seat already booked or does not exist" }
```

---

## 🔄 Integration Points

| Component              | Role                                                           | Key Function                            |
| ---------------------- | -------------------------------------------------------------- | --------------------------------------- |
| **Frontend**           | Sends login request, stores token, includes in booking request | User interaction                        |
| **Auth Routes**        | Handle login/register endpoints                                | `/api/auth/login`, `/api/auth/register` |
| **Auth Controller**    | Verify credentials, generate tokens                            | `login()`, `register()`                 |
| **JWT Utils**          | Create and verify tokens                                       | `generateToken()`, `verifyToken()`      |
| **Auth Middleware**    | Validate token for protected routes                            | `authenticate()`                        |
| **Booking Routes**     | Route protected booking endpoints                              | Applies `authenticate` middleware       |
| **Booking Controller** | Process booking with user association                          | `bookSeatAuthenticated()`               |
| **PostgreSQL**         | Stores seat data with user_id                                  | `seats` table with `user_id` FK         |
| **MySQL**              | Stores user credentials                                        | `users` table                           |

---

## ✅ Data Consistency Checklist

- ✅ **Authentication** - User verified before booking
- ✅ **Authorization** - Token required for booking route
- ✅ **User Association** - Booking linked to user_id
- ✅ **Atomicity** - Booking transaction all-or-nothing
- ✅ **Isolation** - FOR UPDATE prevents race conditions
- ✅ **Durability** - COMMIT ensures persistence
- ✅ **Encryption** - Passwords hashed with bcrypt
- ✅ **Token Security** - JWT signed and validated
- ✅ **Concurrency Safe** - Multiple users can book simultaneously
- ✅ **Error Handling** - Clear error messages for failures

---

## 🚦 Request/Response Flow Summary

```
Client Request
     ↓
Enter Express App
     ↓
Authentication Middleware (for /book/:seatId)
     ├─ Check Authorization header
     ├─ Extract and verify JWT token
     ├─ Set req.user = { id, email, ... }
     └─ Call next() → proceed
     ↓
Booking Controller (bookSeatAuthenticated)
     ├─ Get seatId from params
     ├─ Get userId from req.user.id
     ├─ Begin transaction
     ├─ Lock seat row with SELECT FOR UPDATE
     ├─ Check if available
     ├─ Update with user_id
     ├─ Commit transaction
     └─ Return response
     ↓
Client Receives Response
     ├─ Success (200): Seat booked with user_id
     ├─ Conflict (409): Seat already booked
     ├─ Unauthorized (401): Invalid/missing token
     └─ Error (500): Server error
```

---

## 📚 Related Files

- **Authentication:** `src/auth/`, `src/controllers/authController.js`
- **Middleware:** `src/middleware/auth.js`
- **Booking:** `src/booking/bookingController.js`
- **Token Management:** `src/utils/jwt.js`
- **Routes:** `src/routes/auth.js`, `src/routes/booking.js`
- **Database:** `src/config/database.js`

---

## 🎯 Key Takeaways

1. **JWT Token** - Proves user identity without storing session server-side
2. **Middleware Pattern** - Centralized authentication check for protected routes
3. **User Association** - Booking data linked to authenticated user
4. **Transaction Safety** - Prevents concurrent booking of same seat
5. **Row-Level Locking** - Only target seat locked, others remain accessible
6. **ACID Properties** - Guarantees data consistency even under high load
