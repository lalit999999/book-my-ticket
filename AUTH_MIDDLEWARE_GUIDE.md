# Authentication Middleware Guide

## Overview

The authentication middleware handles JWT token verification and user authentication for your Express routes.

Two variants are provided:

1. **`authenticate`** - Strict protection (requires valid token)
2. **`authenticateOptional`** - Gentle protection (gracefully handles missing token)

## Middleware Details

### File Location

```
src/middleware/auth.js
```

### How It Works

```
Request with Authorization Header
    ↓
Extract "Bearer {token}" from header
    ↓
Verify token signature with secret key
    ↓
Decode payload and extract userId
    ↓
Attach user object to req.user
    ↓
Proceed to next middleware/route handler
```

## ✅ Strict Authentication (`authenticate`)

**Purpose:** Protect routes that require authentication

**Behavior:**

- Rejects requests without Authorization header (401)
- Rejects invalid/expired tokens (401)
- Returns user in `req.user` if valid

**Usage:**

```javascript
import { authenticate } from "./src/middleware/auth.js";

// Apply to specific route
app.get("/api/profile", authenticate, (req, res) => {
  console.log(req.user.id); // User ID
  console.log(req.user.email); // User email
  res.json({ user: req.user });
});

// Apply to multiple routes
app.post("/api/bookings", authenticate, bookRoute.create);
app.get("/api/bookings", authenticate, bookRoute.list);
app.put("/api/bookings/:id", authenticate, bookRoute.update);
```

**Available Properties on req.user:**

```javascript
req.user = {
  id: 123, // User ID from token
  email: "user@example.com",
  iat: 1234567890, // Issued at (timestamp)
  exp: 1234654290, // Expires at (timestamp)
};

// Also attached for backward compatibility:
req.userId; // = req.user.id
req.userEmail; // = req.user.email
req.token; // Original JWT token
```

**Success Response:**

```json
{
  "success": true,
  "user": {
    "id": 123,
    "email": "john@example.com",
    "iat": 1684741200,
    "exp": 1685346000
  }
}
```

**Error Responses:**

| Scenario                | Status | Error Code        | Message                                  |
| ----------------------- | ------ | ----------------- | ---------------------------------------- |
| No Authorization header | 401    | `NO_TOKEN`        | No authentication token provided         |
| Invalid header format   | 401    | `INVALID_FORMAT`  | Invalid Authorization header format      |
| Empty token             | 401    | `EMPTY_TOKEN`     | Token is empty                           |
| Invalid signature       | 401    | `INVALID_TOKEN`   | Invalid or tampered authentication token |
| Token expired           | 401    | `TOKEN_EXPIRED`   | Token has expired. Please login again.   |
| Malformed JWT           | 401    | `MALFORMED_TOKEN` | Malformed JWT token                      |

## 🔓 Optional Authentication (`authenticateOptional`)

**Purpose:** Protect routes that work for both authenticated and unauthenticated users

**Behavior:**

- Allows requests even without Authorization header
- Sets `req.authenticated = true/false`
- Populates `req.user` only if valid token provided
- Never rejects requests

**Usage:**

```javascript
import { authenticateOptional } from "./src/middleware/auth.js";

// Public endpoint with optional personalization
app.get("/api/public/posts", authenticateOptional, (req, res) => {
  let posts = getAllPosts();

  if (req.authenticated) {
    // User is logged in - show personalized content
    posts = posts.map((post) => ({
      ...post,
      isLiked: req.user.id ? checkIfLiked(post.id, req.user.id) : false,
    }));
  } else {
    // Guest user - show basic content
  }

  res.json(posts);
});

// Analytics endpoint
app.get("/api/analytics", authenticateOptional, (req, res) => {
  const dataToShow = {
    timestamp: new Date(),
    userId: req.user?.id || "guest",
    isAuthenticated: req.authenticated,
  };
  res.json(dataToShow);
});
```

**Available Properties:**

```javascript
req.authenticated; // boolean: true if valid token
req.user; // object or null
req.user.id; // User ID (if authenticated)
req.user.email; // User email (if authenticated)
req.token; // Original JWT token (if authenticated)
```

**Conditional Logic Examples:**

```javascript
// Check if user is authenticated
if (req.authenticated) {
  const userId = req.user.id;
  // Do something with authenticated user
}

// Safe access with optional chaining
const email = req.user?.email || "guest@example.com";

// In templates or responses
const content = {
  user: req.user || null,
  isGuest: !req.authenticated,
};
```

## 📋 Complete Route Examples

### Protected API Endpoint

```javascript
import express from "express";
import { authenticate } from "./src/middleware/auth.js";
import { getUserProfile } from "./src/controllers/userController.js";

const router = express.Router();

// This route requires authentication
router.get("/profile", authenticate, (req, res) => {
  console.log("User ID:", req.user.id);
  console.log("User Email:", req.user.email);

  // Get user data from database
  const user = getUserProfile(req.user.id);

  res.json({
    success: true,
    data: user,
  });
});

export default router;
```

### Mixed Protection

```javascript
// Public endpoint
app.get("/api/posts", (req, res) => {
  const posts = getAllPosts();
  res.json(posts);
});

// Protected endpoint
app.get("/api/posts/:id/edit", authenticate, (req, res) => {
  const post = getPost(req.params.id);

  // Only allow editing own posts
  if (post.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Cannot edit other users' posts",
    });
  }

  res.json(post);
});

// Optional protection
app.get("/api/posts/:id", authenticateOptional, (req, res) => {
  const post = getPost(req.params.id);

  // Show extra info only to authenticated users
  if (req.authenticated) {
    post.likedByUser = checkIfLiked(post.id, req.user.id);
  }

  res.json(post);
});
```

### Chaining Multiple Middleware

```javascript
import { authenticate, validateInput } from "./middleware";

// Use multiple middleware in order
app.post(
  "/api/bookings",
  authenticate, // 1. Verify user is logged in
  validateInput, // 2. Validate request body
  bookings.create, // 3. Create booking
);

// Or with express middleware patterns
app
  .route("/api/user/:id")
  .get(authenticateOptional, getUserProfile)
  .put(authenticate, validateInput, updateUserProfile)
  .delete(authenticate, deleteUser);
```

## 🧪 Testing the Middleware

### With cURL

**Protected Route (with valid token):**

```bash
curl -X GET http://localhost:8080/api/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Protected Route (without token):**

```bash
curl -X GET http://localhost:8080/api/profile

# Response 401:
# {
#   "success": false,
#   "message": "No authentication token provided",
#   "code": "NO_TOKEN"
# }
```

**Protected Route (with invalid token):**

```bash
curl -X GET http://localhost:8080/api/profile \
  -H "Authorization: Bearer invalid_token_12345"

# Response 401:
# {
#   "success": false,
#   "message": "Invalid or tampered authentication token",
#   "code": "INVALID_TOKEN"
# }
```

**Optional Route (with token):**

```bash
curl -X GET http://localhost:8080/api/posts \
  -H "Authorization: Bearer valid_token..."

# req.authenticated = true
# req.user = { id: 1, email: "user@example.com" }
```

**Optional Route (without token):**

```bash
curl -X GET http://localhost:8080/api/posts

# req.authenticated = false
# req.user = null
# Request proceeds normally
```

### With Postman

1. Register/Login to get token
2. Copy token from response
3. Go to Headers tab
4. Add header:
   ```
   Key: Authorization
   Value: Bearer {your_token_here}
   ```
5. Send request

## 🔒 Security Features

✅ **Secret Key Protection**

- Token verified with secret key
- Cannot forge tokens without key
- Tampered tokens rejected

✅ **Expiration Checking**

- Expired tokens rejected
- Clear error message on expiry
- User must login again

✅ **Header Validation**

- Format: `Authorization: Bearer <token>`
- Invalid format rejected
- Empty tokens rejected

✅ **Error Handling**

- Comprehensive error codes
- Different HTTP status codes
- Generic production error messages
- Detailed development logs

## 📊 Request & Response Flow

```
Client Request
    │
    ├─ Authorization: Bearer {token}
    │
    ↓
middleware/auth.js
    │
    ├─ Extract token from header
    ├─ Verify signature with secret
    ├─ Check expiration
    ├─ Decode payload
    │
    ↓
req.user populated
    {
        id: 123,
        email: "user@example.com",
        iat: 1684741200,
        exp: 1685346000
    }
    │
    ↓
Route Handler
    res.json({ user: req.user })
```

## 💡 Best Practices

### DO ✅

- Use `authenticate` for sensitive operations (delete, update)
- Use `authenticateOptional` for read endpoints with personalization
- Check `req.user.id` to access authenticated user data
- Log authentication failures for security monitoring
- Always use HTTPS in production

### DON'T ❌

- Don't expose JWT token in response body unnecessarily
- Don't store tokens in localStorage (use httpOnly cookies)
- Don't validate token signature twice in same request
- Don't log sensitive token data in production
- Don't bypass middleware for "convenience"

## 🚀 Performance Considerations

- **Token Verification:** O(1) - Very fast
- **Middleware Execution:** ~1ms per request
- **No Database Lookup:** Stateless authentication
- **Scalable:** Works across multiple servers

## 🔧 Customization

### Add Custom Claims to Token

```javascript
// In controllers/authController.js
const token = generateToken(user.id, user.email);
// Token payload: { userId, email }

// Middleware automatically extracts these
req.user.id;
req.user.email;
```

### Extend req.user Object

```javascript
// In your route handler
const extendedUser = {
  ...req.user,
  role: user.role,
  permissions: user.permissions,
};

// Or add middleware to enhance user object
const enrichUser = (req, res, next) => {
  if (req.user) {
    req.user.role = getUserRole(req.user.id);
  }
  next();
};
```

## 📚 Files Used

- **`src/middleware/auth.js`** - Middleware implementation
- **`src/utils/jwt.js`** - Token verification functions
- **`.env`** - JWT_SECRET configuration

## 🆘 Troubleshooting

| Problem                  | Solution                                                |
| ------------------------ | ------------------------------------------------------- |
| "No token provided"      | Add `Authorization: Bearer {token}` header              |
| "Invalid token"          | Ensure token hasn't been modified                       |
| "Token expired"          | Login again to get new token                            |
| req.user is undefined    | Use `authenticateOptional` or check `req.authenticated` |
| Middleware not executing | Ensure it's placed before route handler                 |

---

**Your authentication middleware is now fully set up and documented!** 🎉
