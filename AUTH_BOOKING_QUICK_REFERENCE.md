# Auth + Booking Integration - Quick Reference

## 🎯 Essential Flow

```
Login (POST /api/auth/login)
   ↓ (get JWT token)
Store Token
   ↓ (include in Authorization header)
Book Seat (PUT /api/booking/book/:seatId)
   ↓ (middleware validates token)
Extract User ID
   ↓ (from req.user.id)
Lock & Update Seat with user_id
   ↓ (transaction with FOR UPDATE)
Return Success ✅
```

---

## 📝 API Endpoints

### Authentication Endpoints

| Method | Endpoint                    | Auth Required | Purpose                  |
| ------ | --------------------------- | ------------- | ------------------------ |
| `POST` | `/api/auth/register`        | ❌ No         | Create new user account  |
| `POST` | `/api/auth/login`           | ❌ No         | Login and get JWT token  |
| `GET`  | `/api/auth/profile`         | ✅ Yes        | Get current user profile |
| `POST` | `/api/auth/change-password` | ✅ Yes        | Change password          |

### Booking Endpoints

| Method   | Endpoint                    | Auth Required | Purpose                             |
| -------- | --------------------------- | ------------- | ----------------------------------- |
| `GET`    | `/api/booking/seats`        | ❌ No         | List all seats                      |
| `GET`    | `/api/booking/seats/:id`    | ❌ No         | Get seat details                    |
| `PUT`    | `/api/booking/:id/:name`    | ❌ No         | Book seat (legacy, unauthenticated) |
| `PUT`    | `/api/booking/book/:seatId` | ✅ Yes        | **Book seat (authenticated)**       |
| `DELETE` | `/api/booking/:id`          | ✅ Yes        | Cancel booking                      |

---

## 🔑 JWT Token Structure

```javascript
// What server encodes:
{
  userId: 1,              // Unique user ID from database
  email: "user@test.com", // User's email
  iat: 1681234567,        // Issued at timestamp
  exp: 1681321567         // Expiration timestamp (7 days)
}

// How to use in requests:
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🚀 Step-by-Step Usage

### 1️⃣ Register or Login

**Register (New User):**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Login (Existing User):**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Response from both:**

```json
{
  "success": true,
  "message": "Login/Registration successful",
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

### 2️⃣ Save Token on Client

```javascript
// In browser (localStorage)
const response = await fetch('/api/auth/login', {...});
const { data } = await response.json();
localStorage.setItem('token', data.token);

// In Node.js
const token = data.token;
```

### 3️⃣ Book a Seat (Using Token)

```bash
# Extract token from login response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Use token in Authorization header
curl -X PUT http://localhost:3000/api/booking/book/5 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Success Response:**

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

**Error: Already Booked:**

```json
{
  "success": false,
  "message": "Seat already booked or does not exist",
  "seatId": 5
}
```

---

## 🔐 Middleware Flow

```
HTTP Request arrives
     ↓
Express routes request to /api/booking/book/:seatId
     ↓
Middleware: authenticate (req, res, next)
     ├─ Check Authorization header exists
     ├─ Extract token (remove "Bearer " prefix)
     ├─ Call verifyToken(token)
     │  └─ JWT verification with secret key
     │  └─ Check expiration
     │  └─ Decode payload
     ├─ Set req.user = { id, email, iat, exp }
     └─ Call next() → proceed to controller
     ↓
Controller: bookSeatAuthenticated(req, res)
     ├─ Access req.user.id ← User ID from token
     ├─ Begin transaction with FOR UPDATE
     ├─ Update seats table with user_id
     └─ Return response
```

---

## ❌ Common Errors & Solutions

| Status | Error                               | Cause                        | Solution                                      |
| ------ | ----------------------------------- | ---------------------------- | --------------------------------------------- |
| 401    | No authentication token provided    | Missing Authorization header | Add `Authorization: Bearer {token}`           |
| 401    | Invalid Authorization header format | Wrong prefix                 | Use `"Bearer {token}"`, not `"Token {token}"` |
| 401    | Token has expired                   | Token is too old             | Login again to get new token                  |
| 401    | Invalid or tampered token           | Token was modified           | Get fresh token from login                    |
| 409    | Seat already booked                 | Seat is taken                | Choose different seat                         |
| 400    | Seat ID is required                 | Missing seatId in URL        | Use `/api/booking/book/:seatId` format        |
| 400    | Invalid email or password           | Wrong credentials            | Check email and password                      |

---

## 🔒 Data Security Checklist

✅ **User Registration:**

- Password hashed with bcrypt (10 rounds)
- Email validated for format
- Password checked for strength
- User stored in MySQL database

✅ **User Login:**

- Email/password compared against database
- Password verified with bcrypt
- JWT token generated with userId
- Token includes 7-day expiration

✅ **Authenticated Booking:**

- JWT token validated before processing
- User ID extracted from token
- User ID stored in booking record
- Transaction prevents double-booking
- Row-level lock prevents race conditions

---

## 📊 Database Tables

### users (MySQL)

```sql
id | name      | email           | password (bcrypt hash)
1  | John Doe  | john@example.com| $2b$10$xxxx...
2  | Jane Smith| jane@example.com| $2b$10$yyyy...
```

### seats (PostgreSQL)

```sql
id | name      | isbooked | user_id | booked_at
1  | Seat A1   | 0        | NULL    | NULL
2  | Seat A2   | 0        | NULL    | NULL
3  | Seat A3   | 1        | 1       | 2024-01-15 10:30:45
4  | Seat A4   | 1        | 2       | 2024-01-15 10:35:20
5  | Seat A5   | 0        | NULL    | NULL
```

---

## 🧪 Test Scenarios

### Scenario 1: Happy Path

```
1. Register user
2. Receive token
3. Book seat
4. ✅ Success - seat shows user_id = 1
```

### Scenario 2: Already Booked

```
1. Login user
2. Try to book seat 3 (already booked by user 2)
3. ✅ Get 409 Conflict error
```

### Scenario 3: Expired Token

```
1. Wait for token to expire (7 days)
2. Try to book seat with old token
3. ✅ Get 401 Token expired error
4. Login again to get new token
```

### Scenario 4: Missing Token

```
1. Try to book seat without Authorization header
2. ✅ Get 401 No authentication token provided error
```

### Scenario 5: Concurrent Bookings

```
1. User A & B both request to book seat 5
2. User A's request reaches first
3. User A gets lock, books seat, commits
4. User B waits for lock, gets released lock
5. User B sees seat is booked, returns 409
6. ✅ Only User A succeeds
```

---

## 🔗 Files Reference

| File                                | Purpose                          |
| ----------------------------------- | -------------------------------- |
| `src/controllers/authController.js` | Login/register logic             |
| `src/auth/loginService.js`          | Service for login business logic |
| `src/auth/registerService.js`       | Service for registration logic   |
| `src/middleware/auth.js`            | JWT validation middleware        |
| `src/utils/jwt.js`                  | Token generation/verification    |
| `src/booking/bookingController.js`  | Booking logic with transactions  |
| `src/routes/auth.js`                | Auth endpoint routes             |
| `src/routes/booking.js`             | Booking endpoint routes          |
| `src/config/database.js`            | Database connection pools        |

---

## 🎯 Key Points

1. **Token is Proof of Identity** - It's like a ticket that proves you're logged in
2. **Must Include in Every Request** - Add `Authorization: Bearer {token}` header
3. **Token Expires** - Default 7 days, then need to login again
4. **User ID from Token** - Controller gets user via `req.user.id` (from token)
5. **Booking Locked** - Only one person can book same seat (FOR UPDATE lock)
6. **Data Persists** - User ID stored in database with booking

---

## 💻 JavaScript Example (Frontend)

```javascript
// 1. Login
const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "john@example.com",
    password: "SecurePass123",
  }),
});

const { data } = await loginResponse.json();
const token = data.token; // Save this!

// 2. Store token (localStorage, sessionStorage, or state management)
localStorage.setItem("authToken", token);

// 3. Book seat
const bookingResponse = await fetch(
  "http://localhost:3000/api/booking/book/5",
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // ✅ Include token here
    },
  },
);

const bookingResult = await bookingResponse.json();

if (bookingResult.success) {
  console.log("Seat booked! User:", bookingResult.data.userId);
} else {
  console.error("Booking failed:", bookingResult.message);
}
```
