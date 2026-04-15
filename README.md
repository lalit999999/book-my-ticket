# 🎬 Movie Ticket Booking System

A modern, production-ready API for managing movie ticket bookings with secure user authentication and transaction-safe seat reservations.

## 📋 Project Overview

This project is a complete backend solution for a movie ticket booking system. It provides secure user authentication using JWT tokens, seat inventory management, and protected booking operations with built-in transaction safety to prevent double-booking. The system is designed to handle concurrent requests reliably and maintain data integrity.

**Key Capabilities:**

- User registration and authentication with JWT
- Secure password management with bcrypt hashing
- Real-time seat availability tracking
- Protected booking API with token-based auth
- Transaction-safe seat reservations
- Comprehensive API testing with Jest

---

## ✨ Features

### 🔐 Authentication System

- **User Registration** - Create new accounts with email validation
- **Login** - Secure authentication with JWT token generation
- **Profile Management** - View and manage user profiles
- **Password Management** - Secure password updates with validation
- **Token-Based Security** - All protected endpoints require valid JWT tokens

### 🎟️ Booking System

- **Seat Management** - Browse all available seats with booking status
- **Secure Booking** - Reserve seats with automatic transaction handling
- **Double-Booking Prevention** - Prevents multiple users from booking the same seat
- **Booking Cancellation** - Release seats and make them available again
- **User Tracking** - Associates bookings with authenticated users

### 🔒 Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token authentication with expiration
- Transaction-level data consistency
- Row-level locking during seat reservation
- Request validation on all endpoints

---

## 🛠️ Tech Stack

### Backend

- **Runtime:** Node.js (ES6 modules)
- **Framework:** Express.js 5.x
- **Authentication:** JWT (jsonwebtoken)
- **Password Security:** bcrypt
- **Database:** PostgreSQL / MySQL
- **Database Driver:** mysql2 / pg
- **Environment Management:** dotenv
- **CORS:** cors middleware

### Testing

- **Test Framework:** Jest 29+
- **Test Environment:** Node.js
- **Coverage:** 25+ comprehensive tests

### Deployment

- Production-ready error handling
- Environment-based configuration
- Connection pooling for database
- Middleware-based security

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL or MySQL database
- npm or yarn package manager

### Step 1: Clone & Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd book-my-ticket

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=booking_system

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Bcrypt Configuration
BCRYPT_ROUNDS=10
```

**Important:** Change `JWT_SECRET` to a strong random string in production.

### Step 3: Set Up Database

#### For PostgreSQL:

```sql
-- Create database
CREATE DATABASE booking_system;

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create seats table
CREATE TABLE seats (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  isbooked BOOLEAN DEFAULT FALSE,
  user_id INTEGER REFERENCES users(id),
  booked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_seats_booked ON seats(isbooked);
CREATE INDEX idx_seats_user_id ON seats(user_id);
```

#### For MySQL:

```sql
-- Create database
CREATE DATABASE booking_system;

-- Create users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create seats table
CREATE TABLE seats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  isbooked BOOLEAN DEFAULT FALSE,
  user_id INT,
  booked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_booked (isbooked),
  INDEX idx_user_id (user_id)
);

-- Create index for email lookups
CREATE INDEX idx_email ON users(email);
```

### Step 4: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will be listening on `http://localhost:8080`

---

## 📡 API Endpoints

### Authentication Endpoints

#### Register User

```
POST /api/auth/register
```

**Public endpoint** - No authentication required

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response:** `200 OK`

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

#### Login User

```
POST /api/auth/login
```

**Public endpoint** - No authentication required

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response:** `200 OK`

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

#### Get User Profile

```
GET /api/auth/profile
```

**Protected endpoint** - Requires valid JWT token

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Success Response:** `200 OK`

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

#### Change Password

```
POST /api/auth/change-password
```

**Protected endpoint** - Requires valid JWT token

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Request Body:**

```json
{
  "oldPassword": "SecurePassword123!",
  "newPassword": "NewPassword456!",
  "confirmPassword": "NewPassword456!"
}
```

**Success Response:** `200 OK`

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### Booking Endpoints

#### Get All Seats

```
GET /api/booking/seats
```

**Public endpoint** - No authentication required

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "A1",
      "isbooked": false,
      "user_id": null,
      "booked_at": null
    },
    {
      "id": 2,
      "name": "A2",
      "isbooked": true,
      "user_id": 1,
      "booked_at": "2024-04-15T10:30:00Z"
    }
  ]
}
```

---

#### Get Seat Details

```
GET /api/booking/seats/:id
```

**Public endpoint** - No authentication required

**URL Parameters:**

- `id` - Seat ID (integer)

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "A1",
    "isbooked": false,
    "user_id": null,
    "booked_at": null
  }
}
```

---

#### Book Seat (Authenticated)

```
PUT /api/booking/book/:seatId
```

**Protected endpoint** - Requires valid JWT token

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**URL Parameters:**

- `seatId` - Seat ID (integer)

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "seatId": 1,
    "userId": 5,
    "bookedAt": "2024-04-15T10:30:00Z"
  }
}
```

**Error Response - Already Booked:** `409 Conflict`

```json
{
  "success": false,
  "message": "Seat already booked"
}
```

---

#### Release/Cancel Booking

```
DELETE /api/booking/:id
```

**Protected endpoint** - Requires valid JWT token

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**URL Parameters:**

- `id` - Seat ID (integer)

**Success Response:** `200 OK`

```json
{
  "success": true,
  "message": "Seat released successfully"
}
```

---

## 📚 Example Usage

### Complete Workflow: Register → Login → Book → View Bookings

#### 1. Register a New User

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "password": "SecurePassword123!"
  }'
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWxpY2VAZXhhbXBsZS5jb20iLCJpYXQiOjE2OTI0MDU0MDB9.x...",
  "user": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com"
  }
}
```

---

#### 2. Check Available Seats

```bash
curl -X GET http://localhost:8080/api/booking/seats \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "A1", "isbooked": false, "user_id": null },
    { "id": 2, "name": "A2", "isbooked": false, "user_id": null },
    {
      "id": 3,
      "name": "A3",
      "isbooked": true,
      "user_id": 2,
      "booked_at": "2024-04-15T09:00:00Z"
    }
  ]
}
```

---

#### 3. Book a Seat (Using JWT Token from Registration)

```bash
curl -X PUT http://localhost:8080/api/booking/book/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
```

**Response:**

```json
{
  "success": true,
  "data": {
    "seatId": 1,
    "userId": 1,
    "bookedAt": "2024-04-15T10:30:00Z"
  }
}
```

---

#### 4. View User Profile

```bash
curl -X GET http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com"
  }
}
```

---

#### 5. Release a Booking

```bash
curl -X DELETE http://localhost:8080/api/booking/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "Seat released successfully"
}
```

---

## 🔒 Transaction Safety & Concurrency

### How Double-Booking is Prevented

This system uses **database transactions with row-level locking** to ensure data integrity when multiple users attempt to book the same seat simultaneously.

#### Transaction Flow:

```
1. User 1: START TRANSACTION
   ├─ SELECT seat WHERE id=1 AND isbooked=0 FOR UPDATE (locks row)
   ├─ Row is locked, User 1 has exclusive access

2. User 2: Attempts same seat → BLOCKED (waits for lock)

3. User 1: UPDATE seat SET isbooked=1, user_id=1
   ├─ COMMIT transaction
   └─ Lock released

4. User 2: Lock acquired, but seat is already booked
   ├─ SELECT returns no rows (isbooked=0 condition fails)
   └─ ROLLBACK and return 409 Conflict
```

#### Key Safety Features:

**Row-Level Locking:**

```javascript
// The FOR UPDATE clause locks the row until transaction ends
const result = await conn.query(
  "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE",
  [seatId],
);
```

**Atomic Operations:**

- All seat availability checks and updates happen in a single transaction
- If any step fails, the entire transaction is rolled back
- No partial updates that could leave the system in an inconsistent state

**Isolation Level:**

- Uses PostgreSQL/MySQL default isolation levels
- Prevents dirty reads, non-repeatable reads, and phantom reads

### Testing Transaction Safety

Run the test suite to verify transaction safety:

```bash
# Run all tests (25 tests including concurrency tests)
npm test

# Run only booking tests
npm run test:booking

# Run with verbose output
npm run test:verbose

# Check test coverage
npm run test:coverage
```

The booking test suite includes:

- ✅ Concurrent booking attempts (prevents race conditions)
- ✅ Double-booking prevention
- ✅ Database state verification
- ✅ Transaction rollback validation

---

## 🧪 Testing

This project includes comprehensive Jest tests for all critical flows.

### Running Tests

```bash
# Install dependencies (first time only)
npm install --save-dev jest

# Run all tests
npm test

# Run authentication tests only
npm run test:auth

# Run booking & database tests only
npm run test:booking

# Watch mode (auto-rerun on changes)
npm run test:watch

# Verbose output with detailed logs
npm run test:verbose

# Check coverage report
npm run test:coverage

# Run in sequential mode (no parallel execution)
npm run test:all
```

### Test Coverage

The test suite covers:

- **Authentication (13 tests):** Registration, login, JWT validation, profile retrieval
- **Booking (12 tests):** Authenticated booking, database verification, concurrency handling
- **Total: 25 comprehensive tests**

Expected output:

```
PASS  tests/auth.test.js
PASS  tests/booking.test.js

Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
Time:        ~6 seconds
```

---

## 📁 Project Structure

```
book-my-ticket/
├── src/
│   ├── auth/                    # Authentication logic
│   ├── booking/                 # Booking controller
│   ├── controllers/             # Route controllers
│   ├── middleware/              # Express middleware (auth, etc)
│   ├── routes/                  # API route definitions
│   ├── config/                  # Configuration files
│   └── utils/                   # Utility functions
├── tests/
│   ├── auth.test.js             # Authentication tests
│   ├── booking.test.js          # Booking & database tests
│   └── setup.js                 # Test helpers & utilities
├── index.mjs                    # Main server file
├── jest.config.js               # Jest configuration
├── package.json                 # Dependencies & scripts
├── .env                         # Environment variables
└── README.md                    # This file
```

---

## 🔧 Configuration Reference

### Environment Variables

| Variable        | Default        | Description                |
| --------------- | -------------- | -------------------------- |
| `PORT`          | 8080           | Server port                |
| `NODE_ENV`      | development    | Execution environment      |
| `DB_HOST`       | localhost      | Database server address    |
| `DB_PORT`       | 5432           | Database port              |
| `DB_USER`       | postgres       | Database username          |
| `DB_PASSWORD`   | -              | Database password          |
| `DB_NAME`       | booking_system | Database name              |
| `JWT_SECRET`    | -              | Secret key for JWT signing |
| `JWT_EXPIRE`    | 7d             | JWT token expiration time  |
| `BCRYPT_ROUNDS` | 10             | Password hashing strength  |

### Important Notes on Production

⚠️ **Security Checklist:**

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Change default database password
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Use environment variable in production (not .env file)
- [ ] Implement rate limiting for login attempts
- [ ] Add request size limits
- [ ] Enable request validation

---

## 🆘 Common Issues & Troubleshooting

### Issue: "Cannot connect to database"

**Solution:** Check your database credentials in `.env` file and ensure PostgreSQL/MySQL is running.

```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Or for MySQL
mysql -h localhost -u root -p
```

### Issue: "JWT token is invalid or expired"

**Solution:** Tokens expire after the time specified in JWT_EXPIRE (default: 7 days). Users need to login again to get a new token.

### Issue: "Seat already booked" error on valid seat

**Solution:** Another user may have booked it simultaneously. Refresh the seat list to see current availability.

### Issue: Tests fail with "ECONNREFUSED"

**Solution:** Make sure your server is running on port 8080:

```bash
npm run dev
```

---

## 📝 License

ISC License

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests to ensure nothing breaks
4. Submit a pull request

---

## 📧 Support

For issues, questions, or suggestions, please open an issue in the repository.

---

**Happy booking! 🎬🎟️**
