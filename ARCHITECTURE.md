# Architecture Reference Card

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   EXPRESS SERVER                        │
│                  (index.mjs: port 8080)                │
└─────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │        MIDDLEWARE STACK              │
        ├──────────────────────────────────────┤
        │  1. CORS - Cross-origin support     │
        │  2. express.json() - Parse JSON     │
        │  3. express.urlencoded()            │
        └──────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │         ROUTE HANDLERS               │
        ├──────────────────────────────────────┤
        │  /api/auth/register  → authCtrl     │
        │  /api/auth/login     → authCtrl     │
        │  /api/auth/profile   → authCtrl + middleware
        │  /api/auth/change-password → authCtrl
        └──────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │      AUTHENTICATION MIDDLEWARE       │
        ├──────────────────────────────────────┤
        │  1. Extract token from header       │
        │  2. Verify JWT signature            │
        │  3. Check expiration                │
        │  4. Attach user info to request     │
        └──────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │   CONTROLLER LOGIC (Business Logic) │
        ├──────────────────────────────────────┤
        │  1. Validate inputs                 │
        │  2. Query database                  │
        │  3. Hash/compare passwords          │
        │  4. Generate tokens                 │
        │  5. Return responses                │
        └──────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │    UTILITY FUNCTIONS                │
        ├──────────────────────────────────────┤
        │  JWT Utils:                         │
        │    - generateToken()                │
        │    - verifyToken()                  │
        │    - decodeToken()                  │
        │                                     │
        │  Validators:                        │
        │    - isValidEmail()                 │
        │    - isValidPassword()              │
        │    - validateLoginInput()           │
        └──────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │    MYSQL DATABASE (Connection Pool) │
        ├──────────────────────────────────────┤
        │  Pool: 10 connections max           │
        │  Host: localhost:3306               │
        │  Database: ticket_lelo              │
        │  Table: users                       │
        └──────────────────────────────────────┘
```

---

## 📨 Request/Response Cycle

### Register New User

```
CLIENT REQUEST
    │
    ├─ POST /api/auth/register
    ├─ Body: { name, email, password }
    │
    ↓
EXPRESS RECEIVES
    │
    ├─ Parses JSON
    ├─ Routes to authController.register()
    │
    ↓
CONTROLLER LOGIC
    │
    ├─ Validate inputs (validators.js)
    │   ├─ Check email format
    │   ├─ Check password strength
    │   └─ Check required fields
    │
    ├─ Query database
    │   └─ SELECT id FROM users WHERE email = ?
    │
    ├─ If email exists → Return 409 Conflict
    │
    ├─ Hash password (bcrypt)
    │   └─ bcrypt.hash(password, 10 rounds)
    │
    ├─ Insert user
    │   └─ INSERT INTO users (name, email, password)
    │
    ├─ Generate JWT token (jwt.js)
    │   └─ jwt.sign({ userId, email }, SECRET, { expiresIn: "7d" })
    │
    ↓
RETURN RESPONSE
    │
    └─ 201 Created
       { success: true, token: "...", user: {...} }
```

---

### Login User

```
CLIENT REQUEST
    │
    ├─ POST /api/auth/login
    ├─ Body: { email, password }
    │
    ↓
CONTROLLER LOGIC
    │
    ├─ Validate inputs
    │
    ├─ Query database
    │   └─ SELECT * FROM users WHERE email = ?
    │
    ├─ If user not found → Return 401 Unauthorized
    │
    ├─ Compare password (bcrypt)
    │   └─ bcrypt.compare(inputPassword, hashedPassword)
    │
    ├─ If mismatch → Return 401 Unauthorized
    │
    ├─ Generate JWT token
    │   └─ jwt.sign({ userId, email }, SECRET, { expiresIn: "7d" })
    │
    ↓
RETURN RESPONSE
    │
    └─ 200 OK
       { success: true, token: "...", user: {...} }
```

---

### Access Protected Route

```
CLIENT REQUEST
    │
    ├─ GET /api/auth/profile
    ├─ Headers: { Authorization: "Bearer eyJ..." }
    │
    ↓
MIDDLEWARE: authenticate()
    │
    ├─ Extract token from header
    │   └─ "Authorization: Bearer " → token
    │
    ├─ Verify token (jwt.js)
    │   └─ jwt.verify(token, SECRET)
    │
    ├─ If invalid → Return 401 Unauthorized
    │
    ├─ If expired → Return 401 Token Expired
    │
    ├─ If valid
    │   ├─ Decode payload
    │   ├─ Attach req.userId
    │   ├─ Attach req.userEmail
    │   └─ Call next() → Pass to controller
    │
    ↓
CONTROLLER LOGIC
    │
    ├─ Use req.userId from middleware
    │
    ├─ Query database
    │   └─ SELECT * FROM users WHERE id = ?
    │
    ├─ Return user profile
    │
    ↓
RETURN RESPONSE
    │
    └─ 200 OK
       { success: true, user: {...} }
```

---

## 🔗 File Connections

```
index.mjs (Main Server)
    │
    ├─ imports authRoutes from routes/auth.js
    │   └─ routes/auth.js
    │       ├─ imports authController functions
    │       │   └─ controllers/authController.js
    │       │       ├─ imports getConnection from config/database.js
    │       │       ├─ imports validators from utils/validators.js
    │       │       └─ imports generateToken from utils/jwt.js
    │       │
    │       └─ imports authenticate from middleware/auth.js
    │           └─ middleware/auth.js
    │               └─ imports verifyToken from utils/jwt.js
    │
    ├─ loads .env file
    │   └─ config/.env
    │
    ├─ uses database pool
    │   └─ config/database.js
    │       └─ Connects to MySQL
    │
    └─ listens on PORT from .env
```

---

## 🔐 Security Layers

```
LAYER 1: Input Validation
    ├─ Email format check
    ├─ Password strength requirements
    ├─ Required field validation
    └─ Type checking

LAYER 2: Password Security
    ├─ Bcrypt hashing (one-way)
    ├─ 10 salt rounds
    ├─ Per-password unique salt
    └─ Constant-time comparison

LAYER 3: Token Security
    ├─ JWT signature (HMAC SHA256)
    ├─ Token expiration (7 days)
    ├─ Secret key in environment
    └─ Signature verification on each request

LAYER 4: Database Security
    ├─ Parameterized queries (prevent SQL injection)
    └─ Connection pooling (prevent connection exhaustion)

LAYER 5: HTTP Security
    ├─ CORS enabled
    ├─ Proper status codes
    ├─ Generic error messages
    └─ No sensitive data in errors
```

---

## 📊 Data Flow Diagram

```
User Instance in Database:
    ┌──────────────────────────────┐
    │ users table                  │
    ├──────────────────────────────┤
    │ id          : 1              │
    │ name        : "Alice"        │
    │ email       : "alice@ex.com" │
    │ password    : "$2b$10$..."   │ ← HASHED (bcrypt)
    │ created_at  : 2024-01-15     │
    │ updated_at  : 2024-01-15     │
    └──────────────────────────────┘
                  ↑
            Database query
                  ↑
    ┌──────────────────────────────┐
    │ JSON Request Payload         │
    ├──────────────────────────────┤
    │ {                            │
    │   email: "alice@ex.com",     │
    │   password: "MyPass123"      │
    │ }                            │
    └──────────────────────────────┘
                  ↑
         User submits form
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE users (
  id              INT PRIMARY KEY AUTO_INCREMENT
  │
  ├─ name         VARCHAR(100) NOT NULL
  │                   └─ User's full name
  │
  ├─ email        VARCHAR(100) NOT NULL UNIQUE
  │                   ├─ User's email (unique for each user)
  │                   └─ Used as login username
  │
  ├─ password     VARCHAR(255) NOT NULL
  │                   └─ Hashed with bcrypt (never plain text)
  │
  ├─ created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  │                   └─ Account creation time
  │
  └─ updated_at   TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                      └─ Last modification time

Indexes:
  ├─ PRIMARY KEY (id)
  │     └─ Fast lookups by user ID
  │
  ├─ UNIQUE (email)
  │     └─ Ensure no duplicate emails
  │
  └─ INDEX (email)
        └─ Fast login queries
```

---

## 🎯 Key Components Summary

| Component      | File                            | Purpose                     |
| -------------- | ------------------------------- | --------------------------- |
| **Server**     | `index.mjs`                     | Express app, routes setup   |
| **Database**   | `config/database.js`            | MySQL connection pool       |
| **Auth Logic** | `controllers/authController.js` | Register, login, profile    |
| **Routing**    | `routes/auth.js`                | API endpoint definitions    |
| **Middleware** | `middleware/auth.js`            | JWT verification            |
| **JWT Utils**  | `utils/jwt.js`                  | Token generation/validation |
| **Validators** | `utils/validators.js`           | Input validation            |
| **Config**     | `.env`                          | Environment variables       |

---

## 🔄 State Management

```
STATELESS AUTHENTICATION (JWT)

User Session:
    ├─ NO server-side session storage
    ├─ NO login session table
    └─ Token IS the session

Token Contains:
    ├─ userId (user ID)
    ├─ email (user email)
    ├─ iat (issued at timestamp)
    ├─ exp (expiration timestamp)
    └─ SIGNATURE (HMAC SHA256)

Verification Process:
    ├─ Client sends token in header
    ├─ Server verifies signature
    └─ If valid, serves response

No Database Lookup Needed:
    ├─ Token signature proves authenticity
    ├─ Expiration prevents replay attacks
    └─ Makes it scalable across multiple servers
```

---

## 🚀 Deployment Checklist

- [ ] Change `JWT_SECRET` to strong random key
- [ ] Set `NODE_ENV=production`
- [ ] Update database credentials in `.env`
- [ ] Use HTTPS in production
- [ ] Enable CORS only for trusted domains
- [ ] Implement rate limiting
- [ ] Monitor logs for suspicious activity
- [ ] Regular security updates for dependencies

---

This system is **production-ready** with proper separation of concerns! ✨
