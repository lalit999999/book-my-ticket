# Testing Guide - Refactored Project

## ✅ Quick Start

```bash
# Install dependencies (if needed)
npm install

# Start the server
node index.mjs

# Server output
🚀 Server starting on port: 8080
════════════════════════════════════════

📚 Available Routes:
  Authentication (MySQL):
    POST   /api/auth/login
    POST   /api/auth/register
    GET    /api/auth/profile (protected)
    POST   /api/auth/change-password (protected)

  Booking - LEGACY ENDPOINTS:
    GET    /seats
    PUT    /:id/:name (book seat)

  Booking - NEW MODULAR ENDPOINTS (Recommended):
    GET    /api/booking/seats
    GET    /api/booking/seats/:id
    PUT    /api/booking/:id/:name (book seat)
    DELETE /api/booking/:id (release booking, protected)
```

---

## 🧪 Test Commands

Use any of these tools:

- **curl** (command line)
- **Postman** (GUI)
- **Insomnia** (GUI)
- **Thunder Client** (VS Code)

---

## 📝 Test Scenarios

### Scenario 1: User Registration

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Secure123"
  }'
```

**Success Response (201):**

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

**Error Response (400 - Invalid email):**

```json
{
  "success": false,
  "message": "Invalid email format"
}
```

**Error Response (409 - Email exists):**

```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

### Scenario 2: User Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Secure123"
  }'
```

**Success Response (200):**

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

**Error Response (401 - Wrong password):**

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### Scenario 3: Get User Profile (Protected)

**Save token from login response, then:**

```bash
curl -X GET http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (401 - Missing token):**

```json
{
  "success": false,
  "message": "Access denied: No token provided"
}
```

---

### Scenario 4: Change Password (Protected)

```bash
curl -X POST http://localhost:8080/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "currentPassword": "Secure123",
    "newPassword": "NewSecure456"
  }'
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### Scenario 5: Get All Seats (NEW API)

```bash
curl -X GET http://localhost:8080/api/booking/seats
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Seats retrieved successfully",
  "data": [
    { "id": 1, "name": null, "isbooked": 0 },
    { "id": 2, "name": null, "isbooked": 0 },
    { "id": 3, "name": "John Doe", "isbooked": 1 },
    ...
  ]
}
```

---

### Scenario 6: Get Specific Seat (NEW API)

```bash
curl -X GET http://localhost:8080/api/booking/seats/1
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Seat retrieved successfully",
  "data": { "id": 1, "name": null, "isbooked": 0 }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Seat not found"
}
```

---

### Scenario 7: Book a Seat (NEW API)

```bash
curl -X PUT http://localhost:8080/api/booking/1/John%20Doe \
  -H "Content-Type: application/json"
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Seat booked successfully",
  "data": {
    "seatId": 1,
    "customerName": "John Doe",
    "bookedAt": "2024-01-15T10:45:00.000Z"
  }
}
```

**Error Response (409 - Seat already booked):**

```json
{
  "success": false,
  "message": "Seat already booked or does not exist"
}
```

---

### Scenario 8: Release Booking (NEW API - Protected)

```bash
curl -X DELETE http://localhost:8080/api/booking/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Seat released successfully"
}
```

---

### Scenario 9: Book Seat Using LEGACY API (Still Works!)

```bash
curl -X PUT http://localhost:8080/1/John%20Doe
```

**Success Response:**

```json
{
  "success": true,
  "message": "Seat booked successfully",
  "data": { ...seat info... }
}
```

---

### Scenario 10: Get Seats Using LEGACY API (Still Works!)

```bash
curl -X GET http://localhost:8080/seats
```

**Success Response:**

```json
{
  "success": true,
  "data": [ ...all seats... ]
}
```

---

## 🔑 Authentication Header Format

All protected endpoints require this header:

```
Authorization: Bearer <JWT_TOKEN>
```

**Example:**

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwiaWF0IjoxNjA1MzMyMzM1LCJleHAiOjE2MDUzMzU5MzV9.TJVA95OrM...
```

Token format:

- Generated on login/register
- Valid for 7 days (configurable via JWT_EXPIRE in .env)
- Signed with JWT_SECRET from .env

---

## 📊 Complete Test Suite

**Run all these in order to validate the system:**

### 1. Authentication Flow

```bash
# Register
POST /api/auth/register
→ Get token from response

# Login
POST /api/auth/login
→ Get token from response

# Get Profile (use token)
GET /api/auth/profile
→ Verify user data

# Change Password (use token)
POST /api/auth/change-password
→ Verify success

# Login with new password
POST /api/auth/login (with new password)
→ Get new token
```

### 2. Booking Flow (NEW API)

```bash
# Get all seats
GET /api/booking/seats
→ See available seats

# Get specific seat
GET /api/booking/seats/1
→ See seat details

# Book a seat
PUT /api/booking/1/CustomerName
→ Seat marked as booked

# Try to book again
PUT /api/booking/1/AnotherName
→ Should fail (already booked)

# Release booking (use token)
DELETE /api/booking/1
→ Seat becomes available

# Get seats again
GET /api/booking/seats
→ Seat should be available
```

### 3. Booking Flow (LEGACY API - Backward Compatibility)

```bash
# Get all seats (legacy)
GET /seats
→ See available seats

# Book a seat (legacy)
PUT /1/CustomerName
→ Seat marked as booked
```

### 4. Error Handling

```bash
# No token on protected endpoint
GET /api/auth/profile
→ Should get 401

# Invalid token
GET /api/auth/profile (with wrong token)
→ Should get 401

# Token expired
(Wait 7 days, then try to use old token)
→ Should get 401

# Invalid email on login
POST /api/auth/login (with "notanemail")
→ Should get 400

# Invalid password on login
POST /api/auth/login (with wrong password)
→ Should get 401

# Duplicate email on register
POST /api/auth/register (with existing email)
→ Should get 409

# Book non-existent seat
PUT /api/booking/9999/Name
→ Should get 409
```

---

## 🛠️ Postman Collection

Create a new Postman collection with these requests:

```json
{
  "requests": [
    {
      "name": "Register",
      "method": "POST",
      "url": "http://localhost:8080/api/auth/register",
      "body": {
        "name": "Test User",
        "email": "test@example.com",
        "password": "Test123"
      }
    },
    {
      "name": "Login",
      "method": "POST",
      "url": "http://localhost:8080/api/auth/login",
      "body": {
        "email": "test@example.com",
        "password": "Test123"
      }
    },
    {
      "name": "Get Profile",
      "method": "GET",
      "url": "http://localhost:8080/api/auth/profile",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    },
    {
      "name": "Get All Seats",
      "method": "GET",
      "url": "http://localhost:8080/api/booking/seats"
    },
    {
      "name": "Book Seat",
      "method": "PUT",
      "url": "http://localhost:8080/api/booking/1/Test%20User"
    },
    {
      "name": "Release Seat",
      "method": "DELETE",
      "url": "http://localhost:8080/api/booking/1",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    }
  ]
}
```

**Tips:**

- Save token from login response as `{{token}}` variable
- Use variable `{{token}}` in protected endpoints
- Postman will automatically substitute the value

---

## 🐛 Debugging Tips

### Check if Server is Running

```bash
curl http://localhost:8080/

# Should return the HTML from index.html
```

### Check Database Connection

```bash
# If you get "Error fetching seats", check:
# 1. PostgreSQL is running on port 5433
# 2. MySQL/MariaDB is running on port 3306
# 3. Credentials in .env are correct
```

### Check JWT Token

```bash
# Decode token at https://jwt.io
# Paste token to see payload:
# {
#   "id": 1,
#   "email": "user@example.com",
#   "iat": 1705324200,
#   "exp": 1705928200
# }

# If iat/exp looks weird, check JWT_SECRET
```

### Check Authorization Header

```bash
# Make sure format is correct:
Authorization: Bearer <token>

# NOT:
Authorization: <token>
Authorization: JWT <token>
Authorization: Token <token>
```

### Check Email Validation

```bash
# For registration, email must match regex:
# /^[^\s@]+@[^\s@]+\.[^\s@]+$/

# Valid: user@example.com
# Invalid: userexample.com
# Invalid: user@
```

### Check Password Requirements

```bash
# For registration, password must have:
# - At least 6 characters
# - At least 1 uppercase letter
# - At least 1 number

# Valid: Secure123
# Invalid: secure123 (no uppercase)
# Invalid: Secure (no number)
# Invalid: Pass1 (too short)
```

---

## 📈 Performance Testing

```bash
# Test concurrent bookings (stress test)
for i in {1..10}; do
  curl -X PUT http://localhost:8080/api/booking/$i/User$i &
done
wait

# All should succeed without double-booking due to FOR UPDATE lock
```

---

## 📋 Test Checklist

- [ ] Register new user
- [ ] Login with correct credentials
- [ ] Login with wrong password fails
- [ ] Login with non-existent user fails
- [ ] Get profile without token fails
- [ ] Get profile with valid token works
- [ ] Change password works
- [ ] Login with new password works
- [ ] Get all seats works
- [ ] Book available seat works
- [ ] Book already-booked seat fails
- [ ] Release booking (with token) works
- [ ] Seat becomes available after release
- [ ] Legacy /seats endpoint still works
- [ ] Legacy /:id/:name endpoint still works
- [ ] 404 on non-existent route
- [ ] Error messages don't leak info

---

## ✅ Success Criteria

All of the following should work:

✅ POST /api/auth/register
✅ POST /api/auth/login
✅ GET /api/auth/profile (protected)
✅ POST /api/auth/change-password (protected)
✅ GET /api/booking/seats
✅ GET /api/booking/seats/:id
✅ PUT /api/booking/:id/:name
✅ DELETE /api/booking/:id (protected)
✅ GET /seats (legacy)
✅ PUT /:id/:name (legacy)

---

Happy testing! 🚀
