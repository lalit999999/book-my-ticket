# Login API - Complete Setup & Usage Guide

## 📋 Requirements

### Database: MySQL/MariaDB

Ensure you have created:

- `users` table
- `bookings` table (optional)
- `seats` table

### Tables Structure

```sql
-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Bookings table (optional)
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    seat_id INT NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    booked_at TIMESTAMP NOT NULL,
    cancelled_at TIMESTAMP NULL,
    payment_amount DECIMAL(10, 2),
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE RESTRICT,
    INDEX idx_user_id (user_id),
    INDEX idx_seat_id (seat_id),
    INDEX idx_status (status),
    INDEX idx_booking_date (booking_date)
);
```

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

This will install:

- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT token generation
- `mysql2` - MySQL driver
- `dotenv` - Environment variables
- `express` - Web framework
- `cors` - Cross-origin requests

### Step 2: Configure Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
# Server Configuration
PORT=8080
NODE_ENV=development

# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=ticket_lelo

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Bcrypt Configuration
BCRYPT_ROUNDS=10
```

**⚠️ IMPORTANT**: Change `JWT_SECRET` to a strong random string in production!

### Step 3: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

You should see:

```
========================================
🚀 Server starting on port: 8080
========================================
```

---

## 🔐 API Endpoints

### 1️⃣ Register User

**Endpoint:** `POST /api/auth/register`

**Description:** Create a new user account

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Account created successfully",
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

**Error Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Email format is invalid",
    "password": "Password must contain at least one uppercase letter"
  }
}
```

**Password Requirements:**

- Minimum 6 characters
- At least 1 uppercase letter (A-Z)
- At least 1 number (0-9)

---

### 2️⃣ Login User

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user and get JWT token

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
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

**Error Response (401):**

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 3️⃣ Get User Profile

**Endpoint:** `GET /api/auth/profile`

**Description:** Retrieve authenticated user's profile

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "User profile retrieved",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "message": "No authentication token provided"
}
```

---

### 4️⃣ Change Password

**Endpoint:** `POST /api/auth/change-password`

**Description:** Update user password

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "oldPassword": "SecurePassword123",
  "newPassword": "NewPassword456",
  "confirmPassword": "NewPassword456"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Old password is incorrect"
}
```

---

## 🧪 Testing with cURL

### Register a User

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "MyPassword123"
  }'
```

### Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "MyPassword123"
  }'
```

### Get Profile (replace TOKEN with actual token)

```bash
curl -X GET http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

### Change Password

```bash
curl -X POST http://localhost:8080/api/auth/change-password \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "MyPassword123",
    "newPassword": "NewPassword456",
    "confirmPassword": "NewPassword456"
  }'
```

---

## 📁 Project Structure

```
book-my-ticket/
├── config/
│   ├── .env.example          # Environment variables template
│   └── database.js           # MySQL connection pool
├── controllers/
│   └── authController.js     # Login, register, profile logic
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   └── auth.js              # Authentication routes
├── utils/
│   ├── jwt.js               # JWT token utilities
│   └── validators.js        # Input validation utilities
├── index.mjs                # Main server file
├── package.json             # Dependencies
└── index.html               # Frontend
```

---

## 🔒 Security Features

### 1. Password Hashing

- Uses bcrypt with configurable rounds (default: 10)
- Passwords never stored in plain text
- Hashing is one-way (cannot be reversed)

### 2. JWT Authentication

- Token-based stateless authentication
- Tokens include expiration time
- Verified on each protected request

### 3. SQL Injection Prevention

- Parameterized queries (`?` placeholders)
- User input never directly concatenated in SQL

### 4. Input Validation

- Email format validation
- Password strength requirements
- Type checking on all inputs

### 5. Error Handling

- Generic error messages (don't reveal user existence)
- Detailed logs for debugging
- Proper HTTP status codes

---

## 🛠️ How Authentication Works

### Flow Diagram

```
1. User Registers
   ├─ Validate email, password, name
   ├─ Check if email already exists
   ├─ Hash password with bcrypt
   ├─ Store in database
   └─ Return JWT token

2. User Logs In
   ├─ Validate email, password
   ├─ Find user by email
   ├─ Compare password with bcrypt
   ├─ Generate JWT token
   └─ Return token + user info

3. Protected Requests
   ├─ Extract token from Authorization header
   ├─ Verify JWT signature
   ├─ Check expiration
   ├─ Attach userId to request
   └─ Allow access to protected routes
```

---

## 📊 Token Structure

The JWT token contains:

```json
{
  "userId": 1,
  "email": "john@example.com",
  "iat": 1684148400, // Issued at
  "exp": 1684753200 // Expiration time
}
```

Token format: `header.payload.signature`

---

## ⚠️ Common Issues & Solutions

### Issue: Database connection fails

```
Error: Failed to connect to database
```

**Solution:**

- Check MySQL is running
- Verify credentials in `.env`
- Ensure database exists

### Issue: Token expired

```
Error: Token has expired. Please login again.
```

**Solution:**

- User needs to login again to get new token
- Increase `JWT_EXPIRE` in `.env` (not recommended)

### Issue: Invalid password validation

```
Error: Password must contain at least one uppercase letter
```

**Solution:**

- Password must have uppercase letter (A-Z)
- Password must have number (0-9)
- Minimum 6 characters

### Issue: Email already registered

```
Error: Email already registered
```

**Solution:**

- Use different email
- Or reset password if already have account

---

## 🚀 Next Steps

1. **Add password reset functionality**
2. **Implement refresh tokens** for better security
3. **Add email verification** on registration
4. **Implement rate limiting** on login attempts
5. **Add OAuth login** (Google, GitHub)
6. **Create frontend login form** (React, Vue, etc.)
7. **Add API key authentication** for server-to-server calls

---

## 📚 Resources

- [bcrypt.js Documentation](https://github.com/dcodeIO/bcrypt.js)
- [jsonwebtoken Documentation](https://github.com/auth0/node-jsonwebtoken)
- [Express.js Guide](https://expressjs.com/)
- [MySQL2 Documentation](https://github.com/sidorares/node-mysql2)

---

## 📝 License

ISC
