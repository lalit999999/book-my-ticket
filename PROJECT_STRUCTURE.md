# Project Refactoring Guide - Clean Folder Structure

## 📁 Final Folder Structure

```
book-my-ticket/
├── src/
│   ├── config/              📦 Database Connections
│   │   ├── database.js      ├─ MySQL/MariaDB connection pool
│   │   └── .env.example     └─ Environment template
│   │
│   ├── auth/                🔐 Authentication Logic (Business Logic)
│   │   ├── loginService.js  ├─ Login validation & token generation
│   │   └── registerService.js└─ Registration & password hashing
│   │
│   ├── controllers/         🎮 Route Handlers (HTTP Layer)
│   │   ├── authController.js├─ Auth endpoint handlers
│   │   ├── bookingController.js* └─ Booking endpoint handlers (MOVED)
│   │   └── userController.js └─ Optional: User management
│   │
│   ├── middleware/          🛡️  Express Middleware
│   │   ├── auth.js          ├─ JWT verification & authentication
│   │   └── errorHandler.js  └─ Optional: Error handling middleware
│   │
│   ├── routes/              🗺️  Route Definitions
│   │   ├── auth.js          ├─ /api/auth/* endpoints
│   │   ├── booking.js*      ├─ /api/booking/* endpoints (NEW)
│   │   └── index.js*        └─ Optional: Combine all routes
│   │
│   ├── utils/               🧰 Helper Functions
│   │   ├── jwt.js           ├─ Token generation & verification
│   │   ├── validators.js    └─ Input validation functions
│   │
│   └── booking/             🎫 Booking System (PostgreSQL)
│       └── bookingController.js* ├─ Seat booking logic (NEW - contains pool)
│
├── index.mjs                🚀 Server Entry Point
├── index.html               📄 Frontend
├── package.json             📦 Dependencies
├── .env                     🔑 Environment Variables
├── .gitignore              🙈 Git ignore rules
└── ...documentation files   📚

* = Files created/moved during refactoring
```

---

## 🎯 Directory Purposes & Why

### 1. **src/config/** - Database Connections

**Purpose:** Centralize all database connection logic
**Files:**

- `database.js` - MySQL/MariaDB connection pool
- `.env.example` - Environment template

**Why:**

- Single source of truth for database connections
- Easy to swap databases without touching other code
- Connection pooling in one place
- Can add other config (caching, logging) here later

**Usage:**

```javascript
import { getConnection } from "./config/database.js";
const conn = await getConnection();
```

---

### 2. **src/auth/** - Authentication Business Logic

**Purpose:** Pure authentication services (no HTTP layer)
**Files:**

- `loginService.js` - Login validation & token generation
- `registerService.js` - Registration & password hashing

**Why:**

- Separated from HTTP concerns
- Reusable in multiple contexts (API, CLI, webhooks)
- Easy to unit test
- Business logic independent of Express
- Database logic is here, not in controllers

**Usage:**

```javascript
import { loginUser } from "./auth/loginService.js";
const result = await loginUser(email, password);
```

**Key Difference from Controllers:**

- ✅ Auth service returns data objects
- ✅ Auth service throws errors with codes
- ✅ Controllers handle HTTP responses

---

### 3. **src/controllers/** - Route Handlers (HTTP Layer)

**Purpose:** Handle HTTP requests/responses
**Files:**

- `authController.js` - Express route handlers for auth
- `bookingController.js` - Express route handlers for booking

**Why:**

- Thin layer between routes and business logic
- Handles HTTP concerns (status codes, JSON)
- Converts service responses to API responses
- Easy to change response format without changing logic

**Usage:**

```javascript
// Service returns data
const result = await loginUser(email, password);

// Controller converts to HTTP response
res.status(200).json({
  success: result.success,
  data: result.data,
});
```

---

### 4. **src/middleware/** - Express Middleware

**Purpose:** Reusable HTTP middleware functions
**Files:**

- `auth.js` - JWT verification & user extraction
- `errorHandler.js` (optional) - Global error handling

**Why:**

- Middleware is reusable across routes
- Separates cross-cutting concerns (auth, logging, errors)
- Express patterns expect middleware in dedicated file
- Easy to add more middleware later (logging, rate-limiting, etc.)

**Usage:**

```javascript
// Apply to protected routes
router.get("/profile", authenticate, getUserProfile);
```

---

### 5. **src/routes/** - Route Definitions

**Purpose:** Define API endpoints and map to controllers
**Files:**

- `auth.js` - /api/auth/\* routes
- `booking.js` - /api/booking/\* routes
- `index.js` (optional) - Combine all routes

**Why:**

- Single place to see all endpoints
- Route definitions separate from logic
- Easy to understand API structure
- Middleware applied at route level

**Usage:**

```javascript
router.post("/login", login);
router.get("/profile", authenticate, getUserProfile);
```

---

### 6. **src/utils/** - Helper Functions

**Purpose:** Reusable utility functions
**Files:**

- `jwt.js` - Token generation & verification
- `validators.js` - Input validation rules

**Why:**

- Pure functions used across multiple modules
- No side effects
- Easy to test
- Can be used in auth, controllers, middleware

**Usage:**

```javascript
import { generateToken } from "./utils/jwt.js";
import { validateEmail } from "./utils/validators.js";
```

---

### 7. **src/booking/** - Booking System Logic

**Purpose:** Seat booking business logic (PostgreSQL)
**Files:**

- `bookingController.js` - All seat booking endpoints

**Why:**

- Separate from MySQL user system
- Uses different database (PostgreSQL)
- Own connection pool
- Can scale independently
- Clear separation from authentication

**Difference from Auth:**

- ✅ Auth = MySQL (users, passwords)
- ✅ Booking = PostgreSQL (seats, reservations)

---

## 📋 File Responsibilities Matrix

| File                                 | Reads From        | Writes To         | Contains             |
| ------------------------------------ | ----------------- | ----------------- | -------------------- |
| **config/database.js**               | .env              | Pool              | Connections          |
| **auth/loginService.js**             | MySQL users table | Nothing           | Auth logic           |
| **auth/registerService.js**          | MySQL users table | MySQL users table | Registration logic   |
| **controllers/authController.js**    | Services          | HTTP responses    | Request handling     |
| **controllers/bookingController.js** | PostgreSQL seats  | HTTP responses    | Seat logic           |
| **middleware/auth.js**               | Request headers   | req.user          | JWT parsing          |
| **routes/auth.js**                   | Route params      | Router            | Endpoint definitions |
| **routes/booking.js**                | Route params      | Router            | Endpoint definitions |
| **utils/jwt.js**                     | .env (JWT_SECRET) | Tokens            | Token utilities      |
| **utils/validators.js**              | Input data        | Nothing           | Validation rules     |

---

## 🔄 Request Flow Through Layers

### Login Request Example

```
1. HTTP REQUEST arrives at server
   GET http://localhost:8080/api/auth/login
   Body: { email, password }
              ↓
2. EXPRESS ROUTES (src/routes/auth.js)
   Matches POST /login → calls authController.login
              ↓
3. CONTROLLER (src/controllers/authController.js)
   Extract email, password from req.body
   Call loginService.loginUser(email, password)
              ↓
4. AUTH SERVICE (src/auth/loginService.js)
   Validate inputs
   Query MySQL database
   Compare password with bcrypt
   Generate JWT token
   Return { success, data: { token, user } }
              ↓
5. CONTROLLER RESPONSE (back in authController)
   Convert service result to HTTP response
   res.status(200).json({ success, data })
              ↓
6. HTTP RESPONSE to client
   { success: true, data: { token: "eyJ...", user: {...} } }
```

---

## 🚀 How to Use Each Layer

### Adding a New Endpoint

**Step 1: Create Service** (src/auth/ or src/booking/)

```javascript
// src/auth/logoutService.js
export const logoutUser = async (userId) => {
  // Business logic here
  return { success: true, message: "Logged out" };
};
```

**Step 2: Create Controller** (src/controllers/)

```javascript
// In authController.js
export const logout = async (req, res) => {
  try {
    const result = await logoutUser(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

**Step 3: Add Route** (src/routes/)

```javascript
// In auth.js
router.post("/logout", authenticate, logout);
```

**Step 4: Done!** Server automatically picks it up

---

## 🧪 Testing Each Layer

### Test Service (Unit Test)

```javascript
import { loginUser } from "../src/auth/loginService.js";

test("loginUser validates email", async () => {
  try {
    await loginUser("invalid-email", "password");
  } catch (error) {
    expect(error.code).toBe("VALIDATION_ERROR");
  }
});
```

### Test Controller (Integration Test)

```javascript
test("POST /api/auth/login returns token", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email: "test@example.com", password: "Test123" });

  expect(response.status).toBe(200);
  expect(response.body.data.token).toBeDefined();
});
```

### Test Middleware (Unit Test)

```javascript
test("authenticate rejects missing token", async () => {
  const req = { headers: {} };
  const res = { status: jest.fn().json };

  authenticate(req, res);
  expect(res.status).toHaveBeenCalledWith(401);
});
```

---

## 🔐 Security Considerations by Layer

| Layer            | Security  | How                                         |
| ---------------- | --------- | ------------------------------------------- |
| **Config**       | 🔐 High   | Keep .env secret, use environment variables |
| **Auth Service** | 🔐 High   | Bcrypt hashing, input validation            |
| **Controllers**  | 🟡 Medium | Don't expose sensitive data                 |
| **Middleware**   | 🔐 High   | Verify tokens before passing request        |
| **Routes**       | 🟡 Medium | Apply middleware to protect routes          |
| **Utils**        | 🟡 Medium | Keep pure functions predictable             |

---

## 📊 Import Paths Reference

```javascript
// Import database connection
import { getConnection } from "../config/database.js";

// Import auth services
import { loginUser } from "../auth/loginService.js";
import { registerUser } from "../auth/registerService.js";

// Import auth middleware
import { authenticate } from "../middleware/auth.js";

// Import validators
import { validateLoginInput } from "../utils/validators.js";

// Import JWT utils
import { generateToken, verifyToken } from "../utils/jwt.js";

// Import booking controller
import { getAllSeats, bookSeat } from "../booking/bookingController.js";

// Import routes
import authRoutes from "../routes/auth.js";
import bookingRoutes from "../routes/booking.js";
```

---

## ✅ Migration Checklist

- [x] Create src/config/ for database
- [x] Create src/auth/ for auth services
- [x] Create src/controllers/ for HTTP handlers
- [x] Create src/middleware/ for middlewares
- [x] Create src/routes/ for endpoints
- [x] Create src/utils/ for helpers
- [x] Create src/booking/ for booking logic
- [x] All existing endpoints still work
- [x] Can add new features easily
- [x] Code is testable and maintainable

---

## 🎓 Learning Path

**Understand each layer in order:**

1. **config/** - How the app connects to databases
2. **utils/** - Reusable helper functions
3. **auth/** or **booking/** - Business logic
4. **controllers/** - HTTP request handling
5. **middleware/** - Shared HTTP logic
6. **routes/** - Endpoint definitions
7. **index.mjs** - How it all comes together

---

## 🚀 Benefits of This Structure

✅ **Separation of Concerns** - Each layer has one job
✅ **Testability** - Easy to unit test services without HTTP
✅ **Reusability** - Services can be used in multiple contexts
✅ **Scalability** - Add new features without touching existing code
✅ **Maintainability** - Clear where each piece lives
✅ **Modularity** - Replace one piece without affecting others
✅ **Industry Standard** - Follows MVC + service layer pattern

---

## 💡 Pro Tips

1. **Services don't know about HTTP** - They only handle logic
2. **Controllers are thin** - Just convert service responses to HTTP
3. **Middleware is for shared concerns** - Auth, logging, validation
4. **Routes define the API** - See all endpoints in one place
5. **Utils are pure functions** - No side effects
6. **Config is centralized** - One place to change databases
7. **Each layer imports down only** - Routes don't import controllers directly

---

**Your project is now perfectly structured for growth!** 🎉
