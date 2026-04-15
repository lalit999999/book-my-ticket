# Integration Guide: Auth Services with Controllers

## Overview

The authentication system is now organized into layers:

```
Routes (src/routes/auth.js)
        ↓
Controllers (src/controllers/authController.js)
        ↓
Services (src/auth/loginService.js, registerService.js)
        ↓
Utils (validators, jwt)
        ↓
Config (database)
```

This guide shows how to properly integrate services into controllers.

---

## Current State

### ✅ What's Done

- `src/auth/loginService.js` - Login business logic service created
- `src/auth/registerService.js` - Registration business logic service created
- `src/routes/auth.js` - Routes still call controller functions directly
- `src/controllers/authController.js` - Controllers contain business logic (should be refactored)

### ⏳ What's Next

- Update `authController.js` to use the new services
- Keep HTTP request/response handling in controllers
- Move business logic calls to services

---

## How Services Work

### loginService.js

```javascript
export const loginUser = async (email, password) => {
  // 1. Validates input
  // 2. Queries MySQL database
  // 3. Verifies password with bcrypt
  // 4. Generates JWT token
  // 5. Returns { success: true, data: { token, user } }
  // OR throws error with code
};
```

**Usage in Controller:**

```javascript
const result = await loginUser(email, password);
// result = {
//   success: true,
//   data: {
//     token: "eyJ...",
//     user: { id, name, email }
//   }
// }
```

### registerService.js

```javascript
export const registerUser = async (name, email, password) => {
  // 1. Validates input
  // 2. Checks if email exists
  // 3. Hashes password with bcrypt
  // 4. Creates user in MySQL
  // 5. Generates JWT token
  // 6. Returns { success: true, data: { token, user } }
  // OR throws error with code
};
```

**Usage in Controller:**

```javascript
const result = await registerUser(name, email, password);
// result = {
//   success: true,
//   data: {
//     token: "eyJ...",
//     user: { id, name, email }
//   }
// }
```

---

## Current authController.js Issues

The controller currently mixes HTTP handling with business logic:

```javascript
// ❌ BAD - Business logic in controller
export const login = async (req, res) => {
  try {
    // Validation logic here (should be in service)
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ... });
    }

    // Database query here (should be in service)
    const conn = await getConnection();
    const [user] = await conn.execute("SELECT * FROM users WHERE email = ?", [email]);

    // Password comparison here (should be in service)
    const passwordMatch = await bcrypt.compare(password, user.password);

    // Token generation here (should be in service)
    const token = generateToken(user.id, user.email);

    // Response formatting here ✅ (this belongs in controller)
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { token, user: { id: user.id, name: user.name, email: user.email } }
    });
  } catch (error) {
    res.status(500).json({ ... });
  }
};
```

---

## Refactored authController.js (How It Should Be)

### ✅ GOOD - Thin controller using services

```javascript
import { loginUser } from "../auth/loginService.js";
import { registerUser } from "../auth/registerService.js";
import { getConnection } from "../config/database.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt.js";

/**
 * Login endpoint handler
 * POST /api/auth/login
 *
 * Converts HTTP request to service call
 * Converts service response to HTTP response
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Call service (all business logic happens here)
    const result = await loginUser(email, password);

    // Convert result to HTTP response
    res.status(200).json({
      success: result.success,
      message: "Login successful",
      data: result.data,
    });
  } catch (error) {
    console.error("Login error:", error);

    // Handle service errors
    if (error.code === "VALIDATION_ERROR") {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    if (error.code === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    // Unexpected error
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

/**
 * Register endpoint handler
 * POST /api/auth/register
 *
 * Converts HTTP request to service call
 * Converts service response to HTTP response
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Call service (all business logic happens here)
    const result = await registerUser(name, email, password);

    // Convert result to HTTP response
    res.status(201).json({
      success: result.success,
      message: "Registration successful",
      data: result.data,
    });
  } catch (error) {
    console.error("Register error:", error);

    // Handle service errors
    if (error.code === "VALIDATION_ERROR") {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    if (error.code === "EMAIL_EXISTS") {
      return res.status(409).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    // Unexpected error
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

/**
 * Get user profile (protected endpoint)
 * GET /api/auth/profile
 *
 * req.user is populated by authenticate middleware
 */
export const getUserProfile = async (req, res) => {
  try {
    const conn = await getConnection();

    // Get user details from database
    const [user] = await conn.execute(
      "SELECT id, name, email, created_at FROM users WHERE id = ?",
      [req.user.id],
    );

    res.status(200).json({
      success: true,
      message: "Profile retrieved",
      data: user,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve profile",
    });
  }
};

/**
 * Change password (protected endpoint)
 * POST /api/auth/change-password
 *
 * req.user is populated by authenticate middleware
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const conn = await getConnection();

    // Get current user's password hash
    const [user] = await conn.execute(
      "SELECT password FROM users WHERE id = ?",
      [req.user.id],
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCorrect) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await conn.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      req.user.id,
    ]);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};
```

---

## Key Differences

| Aspect                        | Before (Bad)          | After (Good)                |
| ----------------------------- | --------------------- | --------------------------- |
| **Login Logic**               | In controller         | In loginService.js          |
| **Validation**                | In controller         | In service                  |
| **Database Query**            | In controller         | In service                  |
| **Password Hashing**          | In controller         | In service                  |
| **Token Generation**          | In controller         | In service                  |
| **Error Handling**            | Generic in controller | Specific codes from service |
| **Controller Responsibility** | Everything            | Just HTTP handling          |

---

## Service Error Codes

Services throw errors with specific codes for controllers to handle:

### loginService.js Errors

```javascript
throw {
  code: "VALIDATION_ERROR",
  message: "Email and password are required",
};

throw {
  code: "INVALID_CREDENTIALS",
  message: "Invalid email or password",
};
```

### registerService.js Errors

```javascript
throw {
  code: "VALIDATION_ERROR",
  message: "Email must be valid",
};

throw {
  code: "EMAIL_EXISTS",
  message: "Email already registered",
};
```

### Controller Handles These

```javascript
if (error.code === "VALIDATION_ERROR") {
  // Return 400 Bad Request
} else if (error.code === "INVALID_CREDENTIALS") {
  // Return 401 Unauthorized
} else if (error.code === "EMAIL_EXISTS") {
  // Return 409 Conflict
} else {
  // Return 500 Internal Server Error (unexpected)
}
```

---

## Step-by-Step Migration

### Step 1: Update Login Handler

Replace the entire `login` function in `authController.js` with the refactored version above.

### Step 2: Update Register Handler

Replace the entire `register` function in `authController.js` with the refactored version above.

### Step 3: Add Service Imports

At the top of `authController.js`, add:

```javascript
import { loginUser } from "../auth/loginService.js";
import { registerUser } from "../auth/registerService.js";
```

### Step 4: Test

```bash
# Test login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}'

# Test register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test2@example.com","password":"Test123"}'
```

### Step 5: Verify

- ✅ Login still works
- ✅ Register still works
- ✅ JWT tokens still valid
- ✅ Protected endpoints still require auth

---

## Why This Pattern?

### Separation of Concerns

- **Services:** Pure business logic (no HTTP)
- **Controllers:** HTTP request/response handling
- **Utils:** Reusable functions

### Easy to Test

```javascript
// Test service without HTTP
const result = await loginUser("test@example.com", "password");

// No need to mock Express req/res
```

### Reusable Logic

Services can be used in:

- REST APIs
- GraphQL resolvers
- CLI commands
- Background jobs
- Webhooks

### Clear Error Handling

Services throw typed errors that controllers know how to handle.

### Flexible Response Formats

Same service logic can return:

- JSON for REST APIs
- GraphQL for GraphQL APIs
- Plain data for CLI
- Custom format for webhooks

---

## Summary

The refactoring is **almost complete**!

**Done:**
✅ Folder structure organized
✅ Routes separated
✅ Booking endpoints extracted
✅ Services created
✅ index.mjs updated

**Next Step:**
⏳ Update `authController.js` to use services (follow the examples above)

Once controllers are updated, your system will have perfect separation of concerns!

---

## Files Involved

| File                                | Changes                                       |
| ----------------------------------- | --------------------------------------------- |
| `src/controllers/authController.js` | Update login() and register() to use services |
| `src/auth/loginService.js`          | ✅ Already created and ready                  |
| `src/auth/registerService.js`       | ✅ Already created and ready                  |
| `src/routes/auth.js`                | ✅ No changes needed                          |
| `src/middleware/auth.js`            | ✅ No changes needed                          |

---

**Ready to refactor your auth controllers?**

Follow the code examples in this guide to update `src/controllers/authController.js`!
