# Auth + Booking Integration - Code Examples

## 🎯 Complete Code Examples for Common Scenarios

---

## 1️⃣ Frontend: Register & Login Flow

### React Example

```javascript
import { useState } from "react";

export function AuthFlow() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  // STEP 1: Register New User
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: email.split("@")[0], // Use email prefix as name
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Registration failed");
      }

      // Success: Save token and user
      setToken(result.data.token);
      setUser(result.data.user);
      localStorage.setItem("authToken", result.data.token);
      localStorage.setItem("user", JSON.stringify(result.data.user));

      alert("Registration successful!");
    } catch (err) {
      setError(err.message);
    }
  };

  // STEP 2: Login Existing User
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed");
      }

      // Success: Save token and user
      setToken(result.data.token);
      setUser(result.data.user);
      localStorage.setItem("authToken", result.data.token);
      localStorage.setItem("user", JSON.stringify(result.data.user));

      alert("Login successful!");
    } catch (err) {
      setError(err.message);
    }
  };

  // STEP 3: Book Seat (with token)
  const bookSeat = async (seatId) => {
    if (!token) {
      setError("Please login first");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/booking/book/${seatId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ Include token!
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Booking failed");
      }

      alert(`Seat ${result.data.seatId} booked successfully!`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (token) {
    return (
      <div>
        <h2>Welcome, {user.name}!</h2>
        <button onClick={() => bookSeat(5)}>Book Seat 5</button>
        <button
          onClick={() => {
            setToken(null);
            setUser(null);
            localStorage.removeItem("authToken");
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
        <button type="button" onClick={handleRegister}>
          Register
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
```

---

### Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Book Tickets</title>
  </head>
  <body>
    <div id="auth-section">
      <h2>Login / Register</h2>
      <input type="email" id="email" placeholder="Email" />
      <input type="password" id="password" placeholder="Password" />
      <button onclick="login()">Login</button>
      <button onclick="register()">Register</button>
      <p id="error" style="color: red;"></p>
    </div>

    <div id="booking-section" style="display:none;">
      <h2>Book a Seat</h2>
      <div id="seats-list"></div>
      <button onclick="logout()">Logout</button>
    </div>

    <script>
      // Get token from localStorage
      function getToken() {
        return localStorage.getItem("authToken");
      }

      // STEP 1: Register
      async function register() {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
          const response = await fetch(
            "http://localhost:3000/api/auth/register",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: email.split("@")[0],
                email,
                password,
              }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message);
          }

          // Save token and show booking section
          localStorage.setItem("authToken", data.data.token);
          showBookingSection();
        } catch (err) {
          document.getElementById("error").textContent = err.message;
        }
      }

      // STEP 2: Login
      async function login() {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
          const response = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message);
          }

          // Save token and show booking section
          localStorage.setItem("authToken", data.data.token);
          showBookingSection();
        } catch (err) {
          document.getElementById("error").textContent = err.message;
        }
      }

      // STEP 3: Book Seat (with token)
      async function bookSeat(seatId) {
        const token = getToken();

        if (!token) {
          alert("Please login first");
          return;
        }

        try {
          const response = await fetch(
            `http://localhost:3000/api/booking/book/${seatId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`, // ✅ Include token!
              },
            },
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message);
          }

          alert(`Seat ${data.data.seatId} booked successfully!`);
          loadSeats(); // Refresh seat list
        } catch (err) {
          alert("Booking failed: " + err.message);
        }
      }

      // Load available seats
      async function loadSeats() {
        try {
          const response = await fetch(
            "http://localhost:3000/api/booking/seats",
          );
          const data = await response.json();

          let html = "";
          for (const seat of data.data) {
            const status = seat.isbooked ? "❌ Booked" : "✅ Available";
            const buttonHtml = !seat.isbooked
              ? `<button onclick="bookSeat(${seat.id})">Book</button>`
              : "";

            html += `<div>${seat.name} - ${status} ${buttonHtml}</div>`;
          }

          document.getElementById("seats-list").innerHTML = html;
        } catch (err) {
          console.error("Failed to load seats:", err);
        }
      }

      // Show booking section
      function showBookingSection() {
        document.getElementById("auth-section").style.display = "none";
        document.getElementById("booking-section").style.display = "block";
        loadSeats();
      }

      // Logout
      function logout() {
        localStorage.removeItem("authToken");
        document.getElementById("auth-section").style.display = "block";
        document.getElementById("booking-section").style.display = "none";
      }

      // Check if already logged in
      if (getToken()) {
        showBookingSection();
      }
    </script>
  </body>
</html>
```

---

## 2️⃣ Backend: Middleware Usage

### Custom Implementation Example

```javascript
// src/middleware/auth.js

import { verifyToken } from "../utils/jwt.js";

/**
 * Authentication middleware for protected routes
 *
 * How to use:
 *   router.put("/book/:seatId", authenticate, bookSeatAuthenticated);
 *
 * After this middleware runs successfully:
 *   req.user = { id: 1, email: "user@example.com", iat: ..., exp: ... }
 *   req.userId = 1 (backward compat)
 */
export const authenticate = (req, res, next) => {
  try {
    // Step 1: Get Authorization header
    const authHeader = req.headers.authorization;

    // Validate header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided",
        code: "NO_TOKEN",
      });
    }

    // Step 2: Validate Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid Authorization header format. Use 'Bearer {token}'",
        code: "INVALID_FORMAT",
      });
    }

    // Step 3: Extract token (remove "Bearer " prefix)
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is empty",
        code: "EMPTY_TOKEN",
      });
    }

    // Step 4: Verify token signature & expiration
    const decoded = verifyToken(token);

    // Step 5: Attach to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp,
    };
    req.userId = decoded.userId; // Backward compatibility

    // Step 6: Proceed to next middleware/controller
    next();
  } catch (error) {
    // Handle specific errors
    if (error.message === "Token has expired") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.message === "Invalid token") {
      return res.status(401).json({
        success: false,
        message: "Invalid or tampered authentication token",
        code: "INVALID_TOKEN",
      });
    }

    // Generic error
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
};

/**
 * Optional: Create a role-based middleware
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // First, must have authentication
    authenticate(req, res, () => {
      // Then check role
      if (allowedRoles.includes(req.user.role)) {
        next();
      } else {
        res.status(403).json({
          success: false,
          message: "Insufficient permissions",
          code: "FORBIDDEN",
        });
      }
    });
  };
};
```

---

## 3️⃣ Backend: Protected Booking Controller

### Complete Authenticated Booking Example

```javascript
// src/booking/bookingController.js

import pg from "pg";

const pool = new pg.Pool({
  host: "localhost",
  port: 5433,
  user: "postgres",
  password: "postgres",
  database: "sql_class_2_db",
  max: 20,
});

/**
 * Book a seat with authentication
 *
 * Route: PUT /api/booking/book/:seatId
 * Auth: Required (JWT token in Authorization header)
 *
 * After authenticate middleware runs:
 *   req.user = { id: userId, email, ... }
 *
 * This controller:
 *   1. Extracts seatId from URL params
 *   2. Extracts userId from req.user (via JWT)
 *   3. Starts transaction
 *   4. Locks seat row
 *   5. Checks availability
 *   6. Updates with user_id and booked_at
 *   7. Commits transaction
 *   8. Returns response
 */
export const bookSeatAuthenticated = async (req, res) => {
  const conn = await pool.connect();

  try {
    // Extract parameters
    const { seatId } = req.params;
    const userId = req.user.id; // ✅ From authenticated request!

    // === STEP 1: Input Validation ===
    if (!seatId) {
      return res.status(400).json({
        success: false,
        message: "Seat ID is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in authentication token",
      });
    }

    // === STEP 2: Transaction ===
    await conn.query("BEGIN");

    // === STEP 3: Lock & Check ===
    // SELECT FOR UPDATE acquires exclusive row-level lock
    // This prevents other transactions from modifying this row
    const checkSql =
      "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE";
    const checkResult = await conn.query(checkSql, [seatId]);

    // If no rows returned, seat is either:
    //   - Already booked (isbooked = 1)
    //   - Doesn't exist
    if (checkResult.rowCount === 0) {
      await conn.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Seat already booked or does not exist",
        seatId: seatId,
      });
    }

    // === STEP 4: Update with User ===
    // Update while lock is still held
    // This ensures atomicity (check + update without gap)
    try {
      // Try to update with user_id and timestamp
      const updateSql =
        "UPDATE seats SET isbooked = 1, user_id = $2, booked_at = NOW() WHERE id = $1";
      await conn.query(updateSql, [seatId, userId]);
    } catch (error) {
      // Fallback if user_id column doesn't exist
      if (error.message.includes('column "user_id" does not exist')) {
        const updateSql = "UPDATE seats SET isbooked = 1 WHERE id = $1";
        await conn.query(updateSql, [seatId]);
      } else {
        throw error; // Re-throw if different error
      }
    }

    // === STEP 5: Commit ===
    // Finalizes transaction and releases lock
    await conn.query("COMMIT");

    // === STEP 6: Return Success ===
    res.status(200).json({
      success: true,
      message: "Seat booked successfully",
      data: {
        seatId: seatId,
        userId: userId,
        bookedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    // === ERROR HANDLING: Rollback ===
    try {
      await conn.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError);
    }

    console.error("Booking error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to book seat",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    // Always release connection back to pool
    conn.release();
  }
};

/**
 * Cancel a booking
 *
 * Route: DELETE /api/booking/:id
 * Auth: Required
 */
export const releaseSeat = async (req, res) => {
  const conn = await pool.connect();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Begin transaction
    await conn.query("BEGIN");

    // Check if seat exists and belongs to this user
    const checkSql = "SELECT * FROM seats WHERE id = $1 FOR UPDATE";
    const checkResult = await conn.query(checkSql, [id]);

    if (checkResult.rowCount === 0) {
      await conn.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Seat not found",
      });
    }

    const seat = checkResult.rows[0];

    // Optional: Check if booking belongs to this user
    if (seat.user_id !== userId) {
      await conn.query("ROLLBACK");
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own bookings",
      });
    }

    // Release the seat
    await conn.query(
      "UPDATE seats SET isbooked = 0, user_id = NULL, booked_at = NULL WHERE id = $1",
      [id],
    );

    // Commit transaction
    await conn.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Seat released successfully",
    });
  } catch (error) {
    try {
      await conn.query("ROLLBACK");
    } catch (e) {}

    console.error("Release error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to release seat",
    });
  } finally {
    conn.release();
  }
};
```

---

## 4️⃣ Backend: Routes Setup

### Complete Routes Configuration

```javascript
// src/routes/booking.js

import express from "express";
import {
  getAllSeats,
  bookSeat,
  getSeatById,
  releaseSeat,
  bookSeatAuthenticated, // ✅ New authenticated endpoint
} from "../booking/bookingController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**
 * ========================================
 * PUBLIC ROUTES (No Authentication)
 * ========================================
 */

/**
 * GET /api/booking/seats
 * Retrieve all seats with their booking status
 *
 * Response: { success: true, data: [ { id, name, isbooked }, ... ] }
 */
router.get("/seats", getAllSeats);

/**
 * GET /api/booking/seats/:id
 * Get details of a specific seat
 *
 * Response: { success: true, data: { id, name, isbooked } }
 */
router.get("/seats/:id", getSeatById);

/**
 * PUT /api/booking/:id/:name
 * Book a seat (legacy endpoint for backward compatibility)
 * No user association
 *
 * Parameters:
 *   - id: Seat ID
 *   - name: Customer name (not validated)
 *
 * Response: { success: true, data: { seatId, customerName, bookedAt } }
 */
router.put("/:id/:name", bookSeat);

/**
 * ========================================
 * PROTECTED ROUTES (Auth Required)
 * ========================================
 *
 * Each protected route must:
 *   1. Include authenticate middleware
 *   2. Check req.user.id (set by middleware)
 *   3. Use JWT token for authorization
 */

/**
 * PUT /api/booking/book/:seatId
 * Book a seat with user authentication
 *
 * ✅ Authentication Required: Yes
 * ✅ User Association: Yes
 * ✅ Transaction Protected: Yes
 * ✅ Prevents Double-Booking: Yes (FOR UPDATE)
 *
 * Request Headers:
 *   Authorization: "Bearer {jwt_token}"
 *
 * Parameters:
 *   - seatId: Seat ID (from URL)
 *
 * Gets userId from:
 *   - req.user.id (set by authenticate middleware)
 *
 * Response Success (200):
 *   { success: true, data: { seatId, userId, bookedAt } }
 *
 * Response Conflict (409):
 *   { success: false, message: "Seat already booked" }
 *
 * Response Unauthorized (401):
 *   { success: false, message: "No authentication token provided" }
 */
router.put(
  "/book/:seatId",
  authenticate, // ✅ Check JWT token
  bookSeatAuthenticated, // → Receives authenticated request
);

/**
 * DELETE /api/booking/:id
 * Release/cancel a booking
 *
 * ✅ Authentication Required: Yes
 *
 * Request Headers:
 *   Authorization: "Bearer {jwt_token}"
 *
 * Parameters:
 *   - id: Seat ID to release
 *
 * Response: { success: true, message: "Seat released" }
 */
router.delete(
  "/:id",
  authenticate, // ✅ Check JWT token
  releaseSeat, // → Receives authenticated request
);

export default router;
```

```javascript
// src/routes/auth.js

import express from "express";
import {
  login,
  register,
  getUserProfile,
  changePassword,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**
 * ========================================
 * PUBLIC ROUTES (No Authentication)
 * ========================================
 */

/**
 * POST /api/auth/login
 * Authenticate user and receive JWT token
 *
 * Request Body:
 *   {
 *     "email": "user@example.com",
 *     "password": "SecurePassword123"
 *   }
 *
 * Response Success (200):
 *   {
 *     "success": true,
 *     "message": "Login successful",
 *     "data": {
 *       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *       "user": { "id": 1, "name": "John", "email": "john@example.com" }
 *     }
 *   }
 *
 * Response Error (401):
 *   { "success": false, "message": "Invalid email or password" }
 */
router.post("/login", login);

/**
 * POST /api/auth/register
 * Create new user account and receive JWT token
 *
 * Request Body:
 *   {
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "password": "SecurePassword123"
 *   }
 *
 * Response Success (201 or 200):
 *   {
 *     "success": true,
 *     "message": "Registration successful",
 *     "data": {
 *       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *       "user": { "id": 1, "name": "John Doe", "email": "john@example.com" }
 *     }
 *   }
 *
 * Response Error (400):
 *   { "success": false, "message": "Email already exists" }
 */
router.post("/register", register);

/**
 * ========================================
 * PROTECTED ROUTES (Auth Required)
 * ========================================
 */

/**
 * GET /api/auth/profile
 * Get current authenticated user's profile
 *
 * ✅ Authentication Required: Yes
 *
 * Request Headers:
 *   Authorization: "Bearer {jwt_token}"
 *
 * Response: { success: true, data: { id, name, email, ... } }
 */
router.get(
  "/profile",
  authenticate, // ✅ Check JWT token
  getUserProfile, // → Receives authenticated request
);

/**
 * POST /api/auth/change-password
 * Change user password (requires old password)
 *
 * ✅ Authentication Required: Yes
 *
 * Request Headers:
 *   Authorization: "Bearer {jwt_token}"
 *
 * Request Body:
 *   {
 *     "oldPassword": "CurrentPassword123",
 *     "newPassword": "NewPassword456",
 *     "confirmPassword": "NewPassword456"
 *   }
 *
 * Response: { success: true, message: "Password changed successfully" }
 */
router.post(
  "/change-password",
  authenticate, // ✅ Check JWT token
  changePassword, // → Receives authenticated request
);

export default router;
```

---

## 5️⃣ Testing with cURL

### Complete Test Sequence

```bash
#!/bin/bash
# Complete auth + booking flow test

BASE_URL="http://localhost:3000"
EMAIL="testuser@example.com"
PASSWORD="TestPass123!"
SEAT_ID=5

echo "===== 1. Register User ====="
REGISTER=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "$REGISTER" | jq '.'
TOKEN=$(echo "$REGISTER" | jq -r '.data.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Registration failed"
  exit 1
fi

echo "✅ Token received: ${TOKEN:0:50}..."

echo -e "\n===== 2. Get Profile (Authenticated) ====="
curl -s -X GET "$BASE_URL/api/auth/profile" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'

echo -e "\n===== 3. Get Available Seats ====="
curl -s -X GET "$BASE_URL/api/booking/seats" \
  | jq '.data[] | {id, name, isbooked}'

echo -e "\n===== 4. Book Seat (Authenticated) ====="
BOOKING=$(curl -s -X PUT "$BASE_URL/api/booking/book/$SEAT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$BOOKING" | jq '.'
BOOKED_USER_ID=$(echo "$BOOKING" | jq '.data.userId')
echo "✅ Seat booked by user: $BOOKED_USER_ID"

echo -e "\n===== 5. Try Booking Same Seat Again (Should Fail) ====="
curl -s -X PUT "$BASE_URL/api/booking/book/$SEAT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.'

echo -e "\n===== 6. Try Booking Without Token (Should Fail) ====="
curl -s -X PUT "$BASE_URL/api/booking/book/6" \
  -H "Content-Type: application/json" \
  | jq '.'

echo -e "\n===== 7. Release Booked Seat ====="
curl -s -X DELETE "$BASE_URL/api/booking/$SEAT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'

echo -e "\n===== Test Complete ====="
```

### Run Tests

```bash
# Make script executable
chmod +x test-auth-booking.sh

# Run tests
./test-auth-booking.sh
```

---

## 6️⃣ Environment Variables

### `.env` Configuration

```bash
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10

# MySQL (User Authentication)
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

---

## 7️⃣ Key Integration Points

### Where Authentication Meets Booking

```
┌─ Frontend ─────────────────────────────────────────────────────┐
│                                                                 │
│ 1. User logs in → receives token                              │
│ 2. Stores token (localStorage)                                │
│ 3. When booking, includes token in Authorization header       │
│                                                                 │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ↓ Authorization: Bearer {token}

┌─ Middleware ───────────────────────────────────────────────────┐
│                                                                 │
│ 4. Middleware receives request                                │
│ 5. Validates JWT token (verifyToken)                          │
│ 6. Sets req.user = { id, email, ... }                         │
│ 7. Calls next() to proceed                                    │
│                                                                 │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ↓ req.user.id = 1

┌─ Controller ───────────────────────────────────────────────────┐
│                                                                 │
│ 8. Controller receives authenticated request                  │
│ 9. Extracts userId from req.user.id ← KEY POINT!             │
│ 10. Gets seatId from params                                  │
│ 11. Begins transaction & acquires lock                       │
│ 12. Updates seats table with user_id                         │
│ 13. Commits and releases lock                                │
│                                                                 │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ↓ UPDATE seats SET user_id = 1

┌─ Database ─────────────────────────────────────────────────────┐
│                                                                 │
│ 14. Booking stored with user association                      │
│     seats.id = 5                                              │
│     seats.user_id = 1  ← ✅ User associated!                  │
│     seats.isbooked = 1                                        │
│     seats.booked_at = NOW()                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📚 Summary

**Key Integration Points:**

1. ✅ JWT token generated on login/register
2. ✅ Token sent in Authorization header by client
3. ✅ Middleware validates and extracts user ID
4. ✅ Controller receives authenticated request
5. ✅ User ID from token stored in booking record
6. ✅ Transaction prevents double-booking
7. ✅ Lock released when transaction commits

**Security Checks:**

- ✅ Password hashed with bcrypt
- ✅ JWT token signed with secret key
- ✅ Token expiration enforced
- ✅ Row-level locking prevents race conditions
- ✅ User can only cancel own bookings (optional)
