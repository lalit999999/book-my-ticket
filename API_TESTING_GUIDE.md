# API Testing Guide - Quick Reference

## 🚀 Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure database:**
   - Update `.env` with your MySQL credentials
   - Ensure your database has the `users` table

3. **Start server:**

   ```bash
   npm run dev
   ```

4. **Test API:** Use the examples below

---

## 📲 API Testing Examples

### Testing Tool Options

- **Postman** (GUI) → Import the examples below
- **cURL** (Terminal) → Copy-paste commands
- **Thunder Client** (VS Code) → Visual + quick

---

## ✅ Test 1: User Registration

### Using cURL

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "password": "SecurePass123"
  }'
```

### Expected Response

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice@example.com"
    }
  }
}
```

### Test Cases

**Valid Registration:**

```json
{
  "name": "Bob Smith",
  "email": "bob@example.com",
  "password": "MyPassword123"
}
```

Expected: ✅ 201 Created

**Missing Name:**

```json
{
  "name": "",
  "email": "charlie@example.com",
  "password": "MyPassword123"
}
```

Expected: ❌ 400 - Name is required

**Invalid Email:**

```json
{
  "name": "Dave",
  "email": "invalid-email",
  "password": "MyPassword123"
}
```

Expected: ❌ 400 - Email format is invalid

**Weak Password (no uppercase):**

```json
{
  "name": "Eve",
  "email": "eve@example.com",
  "password": "mypassword123"
}
```

Expected: ❌ 400 - Password must contain at least one uppercase letter

**Weak Password (no number):**

```json
{
  "name": "Frank",
  "email": "frank@example.com",
  "password": "MyPassword"
}
```

Expected: ❌ 400 - Password must contain at least one number

**Duplicate Email:**

```json
{
  "name": "Bob Smith Jr",
  "email": "bob@example.com",
  "password": "AnotherPass456"
}
```

Expected: ❌ 409 - Email already registered

---

## ✅ Test 2: User Login

### Using cURL

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123"
  }'
```

### Expected Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice@example.com"
    }
  }
}
```

### Test Cases

**Valid Login:**

```json
{
  "email": "alice@example.com",
  "password": "SecurePass123"
}
```

Expected: ✅ 200 OK - Returns token

**Wrong Password:**

```json
{
  "email": "alice@example.com",
  "password": "WrongPassword456"
}
```

Expected: ❌ 401 - Invalid email or password

**Non-existent Email:**

```json
{
  "email": "nonexistent@example.com",
  "password": "AnyPassword123"
}
```

Expected: ❌ 401 - Invalid email or password

**Missing Email:**

```json
{
  "email": "",
  "password": "SecurePass123"
}
```

Expected: ❌ 400 - Email is required

**Missing Password:**

```json
{
  "email": "alice@example.com",
  "password": ""
}
```

Expected: ❌ 400 - Password is required

---

## ✅ Test 3: Get User Profile

### Using cURL

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Expected Response

```json
{
  "success": true,
  "message": "User profile retrieved",
  "data": {
    "user": {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Test Cases

**Valid Token:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Expected: ✅ 200 OK - User profile returned

**No Token:**

```
Authorization: (header not provided)
```

Expected: ❌ 401 - No authentication token provided

**Invalid Token:**

```
Authorization: Bearer invalid_token_12345
```

Expected: ❌ 401 - Invalid authentication token

**Expired Token:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (expired)
```

Expected: ❌ 401 - Token has expired

**Wrong Bearer Format:**

```
Authorization: InvalidFormat eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Expected: ❌ 401 - No authentication token provided

---

## ✅ Test 4: Change Password

### Using cURL

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:8080/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "SecurePass123",
    "newPassword": "NewPassword456",
    "confirmPassword": "NewPassword456"
  }'
```

### Expected Response

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Test Cases

**Valid Password Change:**

```json
{
  "oldPassword": "SecurePass123",
  "newPassword": "NewPassword456",
  "confirmPassword": "NewPassword456"
}
```

Expected: ✅ 200 OK

**Wrong Old Password:**

```json
{
  "oldPassword": "WrongPassword123",
  "newPassword": "NewPassword456",
  "confirmPassword": "NewPassword456"
}
```

Expected: ❌ 401 - Old password is incorrect

**Passwords Don't Match:**

```json
{
  "oldPassword": "SecurePass123",
  "newPassword": "NewPassword456",
  "confirmPassword": "DifferentPassword789"
}
```

Expected: ❌ 400 - New passwords do not match

**Same Old and New Password:**

```json
{
  "oldPassword": "SecurePass123",
  "newPassword": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

Expected: ❌ 400 - New password must be different from old password

**Missing Fields:**

```json
{
  "oldPassword": "SecurePass123",
  "newPassword": ""
}
```

Expected: ❌ 400 - All fields are required

---

## 🔐 Token Structure

When you get a token, it contains:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWxpY2VAZXhhbXBsZS5jb20iLCJpYXQiOjE2ODQ3NDEyMDAsImV4cCI6MTY4NTM0NjAwMH0.xYz...
├─ Header (Base64)
├─ Payload (Base64) → Contains userId, email, iat, exp
└─ Signature (HMAC SHA256)
```

To decode without verification, use: https://jwt.io

---

## 🧪 Postman Collection

Copy this into Postman as a new collection:

```json
{
  "info": {
    "name": "Login API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/register",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Test User\",\n  \"email\": \"test@example.com\",\n  \"password\": \"TestPass123\"\n}"
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"TestPass123\"\n}"
        }
      }
    },
    {
      "name": "Get Profile",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/auth/profile",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ]
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8080"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

---

## 📊 Success Code Outcomes

| Code    | Meaning               | Example                       |
| ------- | --------------------- | ----------------------------- |
| **200** | ✅ Request successful | Login, get profile            |
| **201** | ✅ Resource created   | Register user                 |
| **400** | ❌ Bad request        | Invalid input data            |
| **401** | ❌ Unauthorized       | Wrong password, invalid token |
| **404** | ❌ Not found          | User not found                |
| **409** | ❌ Conflict           | Email already exists          |
| **500** | ❌ Server error       | Database connection failed    |

---

## 💡 Tips

1. **Save the token** from login/register response
2. **Use the token** in Authorization header for protected routes
3. **Test invalid inputs** to ensure validation works
4. **Check error messages** carefully - they help debug
5. **Look at database** directly to verify data was saved

---

## 🐛 Debugging Tips

### Check if server is running

```bash
curl http://localhost:8080
```

### View server logs

Check the terminal where you ran `npm run dev`

### Verify database connection

Check `.env` file has correct DB credentials

### Check token validity

Paste token at https://jwt.io to see contents

### Create fresh test user

Use registration endpoint with new email each time

---

Good luck testing! 🚀
