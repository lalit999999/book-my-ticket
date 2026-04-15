# 🗺️ Project Quick Reference Guide

## 📁 File Locations & Purposes

### Root Level

```
index.mjs                    → Server entry point, middleware setup, route mounting
index.html                   → Frontend HTML
package.json                 → Dependencies and scripts
.env                         → Environment variables (DATABASE, JWT, etc.)
.gitignore                   → Git ignore rules (protects secrets)
```

---

## 🔧 src/config/ - Database Connections

### database.js

**Purpose:** MySQL/MariaDB connection pool
**Exports:** `getConnection()` - Returns MySQL connection from pool
**Used By:** Auth services and controllers
**Key Config:** DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

```javascript
// Usage
import { getConnection } from "../config/database.js";
const conn = await getConnection();
```

---

## 🔐 src/auth/ - Authentication Business Logic

### loginService.js

**Purpose:** Pure login logic (no HTTP)
**Exports:** `loginUser(email, password)`
**Returns:** `{ success: true, data: { token, user } }` or throws error
**Logic:** Validate → Query → Compare password → Generate token

### registerService.js

**Purpose:** Pure registration logic (no HTTP)
**Exports:** `registerUser(name, email, password)`
**Returns:** `{ success: true, data: { token, user } }` or throws error
**Logic:** Validate → Check email exists → Hash password → Create user → Generate token

---

## 🎮 src/controllers/ - HTTP Request Handlers

### authController.js

**Purpose:** Express route handlers for auth endpoints
**Exports:**

- `login(req, res)` - POST /api/auth/login handler
- `register(req, res)` - POST /api/auth/register handler
- `getUserProfile(req, res)` - GET /api/auth/profile handler
- `changePassword(req, res)` - POST /api/auth/change-password handler

**Pattern:** Extract from request → Call service → Format response

---

## 🎫 src/booking/ - Booking System

### bookingController.js

**Purpose:** Booking endpoints and PostgreSQL pool
**Exports:**

- `getAllSeats(req, res)` - GET all seats
- `getSeatById(req, res)` - GET specific seat
- `bookSeat(req, res)` - PUT to book seat (with transaction)
- `releaseSeat(req, res)` - DELETE to release booking

**Database:** PostgreSQL (separate pool)
**Features:** Transactions, FOR UPDATE locking, row-level safety

---

## 🧰 src/utils/ - Reusable Utilities

### jwt.js

**Purpose:** JWT token operations
**Exports:**

- `generateToken(userId, email)` - Creates signed JWT
- `verifyToken(token)` - Validates signature and expiration
- `decodeToken(token)` - Decodes without validation

### validators.js

**Purpose:** Input validation rules
**Exports:**

- `isValidEmail(email)` - Email regex check
- `isValidPassword(password)` - Strength requirements
- `validateLoginInput(email, password)` - Combined login validation
- `validateRegisterInput(name, email, password)` - Combined register validation

---

## 🛡️ src/middleware/ - Express Middleware

### auth.js

**Purpose:** JWT authentication verification
**Exports:**

- `authenticate(req, res, next)` - Strict: rejects missing tokens (401)
- `authenticateOptional(req, res, next)` - Flexible: allows missing tokens

**Sets:** `req.user`, `req.userId`, `req.userEmail`, `req.authenticated`

---

## 🗺️ src/routes/ - API Route Definitions

### auth.js

**Purpose:** Auth endpoint routes
**Routes:**

- POST `/api/auth/register` → register controller
- POST `/api/auth/login` → login controller
- GET `/api/auth/profile` → authenticate middleware → getUserProfile controller
- POST `/api/auth/change-password` → authenticate middleware → changePassword controller

### booking.js

**Purpose:** Booking endpoint routes
**Routes:**

- GET `/api/booking/seats` → getAllSeats controller
- GET `/api/booking/seats/:id` → getSeatById controller
- PUT `/api/booking/:id/:name` → bookSeat controller
- DELETE `/api/booking/:id` → authenticate middleware → releaseSeat controller

---

## 📚 Documentation Files

### PROJECT_STRUCTURE.md

**What:** Complete explanation of folder structure
**When:** Read to understand "why" each folder exists
**Read Time:** 10 minutes

### REFACTORING_COMPLETE.md

**What:** What changed and backward compatibility info
**When:** Read to understand migration from old to new structure
**Read Time:** 5 minutes

### AUTH_INTEGRATION_GUIDE.md

**What:** How to use auth services in controllers
**When:** Read before modifying auth controllers
**Read Time:** 10 minutes

### TESTING_GUIDE.md

**What:** cURL commands and Postman setup for all endpoints
**When:** Read to test the system
**Read Time:** 15 minutes (includes execution)

### SUMMARY.md

**What:** Complete project overview and statistics
**When:** Read for high-level understanding
**Read Time:** 10 minutes

### COMPLETION_CHECKLIST.md

**What:** Verification that all refactoring is complete
**When:** Check to verify status
**Read Time:** 5 minutes

### Existing Documentation

- LOGIN_API_GUIDE.md
- API_TESTING_GUIDE.md
- ARCHITECTURE.md
- DELIVERY_CHECKLIST.md
- README.md

---

## 🔄 Data Flow Patterns

### Authentication Flow

```
Routes (auth.js)
  ↓
Controllers (authController.js)
  ↓
Services (loginService.js / registerService.js)
  ↓
Utils (validators, jwt)
  ↓
Config (database.js)
  ↓
MySQL Database
```

### Protected Endpoint Flow

```
Routes (auth.js)
  ↓
Middleware (auth.js) [JWT verification]
  ↓
Controllers (authController.js)
  ↓
MySQL Database
```

### Booking Flow

```
Routes (booking.js)
  ↓
Controllers (bookingController.js)
  ↓
PostgreSQL Database [with transactions]
```

---

## 🚀 Common Tasks

### Find Where an Endpoint is Handled

1. Check URL path
2. Look in `src/routes/` for matching route file
3. Find the controller function name
4. Look in `src/controllers/` or `src/booking/` for that function

Example: GET /api/booking/seats
→ Check `src/routes/booking.js`
→ Find `getAllSeats` controller function
→ Check `src/booking/bookingController.js` for implementation

### Add a New Endpoint

1. Create service function in `src/auth/` (if business logic)
2. Create/update controller function in `src/controllers/`
3. Add route in appropriate `src/routes/` file
4. Test with cURL or Postman

### Modify Database Connection

- MySQL: Update `src/config/database.js`
- PostgreSQL: Update `src/booking/bookingController.js`

### Add Input Validation

1. Add validator function to `src/utils/validators.js`
2. Use in service or controller

### Add Middleware

1. Create in `src/middleware/`
2. Import in `src/routes/` files
3. Apply with `router.use(middleware)`

---

## 📊 Key Statistics

| Metric              | Value                |
| ------------------- | -------------------- |
| Main routes         | 2 (auth, booking)    |
| Auth endpoints      | 4                    |
| Booking endpoints   | 4 (new) + 2 (legacy) |
| Service files       | 2                    |
| Controller files    | 2                    |
| Middleware files    | 1                    |
| Utility files       | 2                    |
| Config files        | 1                    |
| Total src files     | ~10                  |
| Documentation files | 6                    |
| Lines per file      | 50-150 (focused)     |

---

## 🔑 Environment Variables

Required in `.env`:

```
# MySQL/MariaDB
DB_HOST=your_host
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database

# Authentication
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10

# Server
PORT=8080
NODE_ENV=development
```

---

## 🧪 Testing Quick Commands

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"User","email":"user@test.com","password":"Pass123"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Pass123"}'

# Get Seats
curl http://localhost:8080/api/booking/seats

# Book Seat
curl -X PUT http://localhost:8080/api/booking/1/UserName

# Get Profile (use token from login)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/auth/profile
```

---

## 🎯 Endpoint Matrix

| Method | Path                      | Handler        | Protection | Database   |
| ------ | ------------------------- | -------------- | ---------- | ---------- |
| POST   | /api/auth/register        | register       | None       | MySQL      |
| POST   | /api/auth/login           | login          | None       | MySQL      |
| GET    | /api/auth/profile         | getUserProfile | JWT        | MySQL      |
| POST   | /api/auth/change-password | changePassword | JWT        | MySQL      |
| GET    | /api/booking/seats        | getAllSeats    | None       | PostgreSQL |
| GET    | /api/booking/seats/:id    | getSeatById    | None       | PostgreSQL |
| PUT    | /api/booking/:id/:name    | bookSeat       | None       | PostgreSQL |
| DELETE | /api/booking/:id          | releaseSeat    | JWT        | PostgreSQL |
| GET    | /seats                    | built-in       | None       | PostgreSQL |
| PUT    | /:id/:name                | built-in       | None       | PostgreSQL |

---

## 🔐 Security Checklist

- [x] Passwords hashed with bcrypt (10 rounds)
- [x] JWT tokens verified on protected routes
- [x] SQL injection prevented (parameterized queries)
- [x] Credentials in .env (not in code)
- [x] .env protected by .gitignore
- [x] Error messages don't leak info
- [x] CORS enabled
- [x] Transaction support for booking safety

---

## 💻 Code Examples

### Using a Service

```javascript
import { loginUser } from "../auth/loginService.js";

try {
  const result = await loginUser(email, password);
  res.json(result); // { success: true, data: { token, user } }
} catch (error) {
  res.status(401).json({ success: false, message: error.message });
}
```

### Using Database

```javascript
import { getConnection } from "../config/database.js";

const conn = await getConnection();
const result = await conn.execute("SELECT * FROM users WHERE email = ?", [
  email,
]);
```

### Using Middleware

```javascript
import { authenticate } from "../middleware/auth.js";

router.get("/profile", authenticate, getUserProfile);
// authenticate middleware runs first, then controller
```

### Using Validators

```javascript
import { validateLoginInput } from "../utils/validators.js";

const { isValid, errors } = validateLoginInput(email, password);
if (!isValid) {
  return res.status(400).json({ errors });
}
```

---

## 📱 API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "token": "eyJ...",
    "user": { "id": 1, "name": "User", "email": "user@test.com" }
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE" (optional)
}
```

---

## 🎓 Learning Path

1. **Start:** Read SUMMARY.md
2. **Structure:** Read PROJECT_STRUCTURE.md
3. **Changes:** Read REFACTORING_COMPLETE.md
4. **Test:** Follow TESTING_GUIDE.md
5. **Integrate:** Check AUTH_INTEGRATION_GUIDE.md
6. **Code:** Start modifying files

---

## 📞 Quick Lookups

### "Where is the login logic?"

→ `src/auth/loginService.js`

### "Where is the book seat logic?"

→ `src/booking/bookingController.js` (function: bookSeat)

### "Where are the routes defined?"

→ `src/routes/` (auth.js or booking.js)

### "Where is middleware?"

→ `src/middleware/auth.js`

### "Where is input validation?"

→ `src/utils/validators.js`

### "Where is token handling?"

→ `src/utils/jwt.js`

### "Where is database config?"

→ `src/config/database.js` (MySQL)
→ `src/booking/bookingController.js` (PostgreSQL)

### "How do I test something?"

→ See `TESTING_GUIDE.md`

### "How do I add a new endpoint?"

→ Read `PROJECT_STRUCTURE.md` (Adding New Features section)

---

## ✅ Status

**All refactoring complete and ready to use!**

- ✅ Code organized
- ✅ Functions separated
- ✅ Everything documented
- ✅ All endpoints working
- ✅ Tests available
- ✅ Security implemented

**Start coding!** 🚀
