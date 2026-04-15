# Movie Seat Booking System - Login API

A production-ready authentication system for the ticket booking application with JWT-based user authentication, secure password hashing, and protected API routes.

## ✨ Key Features

✅ **User Registration** - Create accounts with email & secure password  
✅ **User Login** - JWT token-based authentication  
✅ **Protected Routes** - Access control with token verification  
✅ **Password Management** - Change password with old password verification  
✅ **Secure Hashing** - Bcrypt password encryption  
✅ **Input Validation** - Email format & password strength checks  
✅ **Error Handling** - Comprehensive error responses  
✅ **MySQL Support** - Connection pooling for scalability

## 🚀 Quick Start

### Requirements

- Node.js 14+
- MySQL 5.7+ or MariaDB
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
# Copy and edit .env with your settings
cp config/.env.example .env

# 3. Create database tables
# See LOGIN_API_GUIDE.md for SQL scripts

# 4. Start development server
npm run dev
```

Server starts on http://localhost:8080

## 📚 Documentation

| Document                      | Purpose                          |
| ----------------------------- | -------------------------------- |
| **LOGIN_API_GUIDE.md**        | Complete API reference & setup   |
| **API_TESTING_GUIDE.md**      | Testing examples & cURL commands |
| **ARCHITECTURE.md**           | System design & data flow        |
| **IMPLEMENTATION_SUMMARY.md** | Overview of all features         |

## 🔐 API Endpoints

### Public Routes

```
POST   /api/auth/register          (Create account)
POST   /api/auth/login             (Get JWT token)
```

### Protected Routes

```
GET    /api/auth/profile           (Get user details)
POST   /api/auth/change-password   (Update password)
```

## 📋 Example Usage

### Register User

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Login User

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

Response includes `token` - use in protected requests.

### Access Protected Route

```bash
curl -X GET http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🛠️ Project Structure

```
book-my-ticket/
├── config/
│   ├── .env                 # Environment configuration
│   └── database.js          # MySQL connection pool
├── controllers/
│   └── authController.js    # Authentication logic
├── middleware/
│   └── auth.js             # JWT verification
├── routes/
│   └── auth.js             # API routes
├── utils/
│   ├── jwt.js              # Token utilities
│   └── validators.js       # Input validation
├── index.mjs               # Express server
├── package.json            # Dependencies
└── README.md               # This file
```

## 🔒 Security Features

- **Bcrypt Hashing** - 10 salt rounds for passwords
- **JWT Tokens** - HMAC SHA256 signed with 7-day expiration
- **SQL Injection Prevention** - Parameterized queries
- **Input Validation** - Email format & password strength
- **Protected Routes** - Middleware enforces authentication
- **Environment Variables** - Sensitive data in .env

## 📊 Password Requirements

- Minimum 6 characters
- At least 1 uppercase letter (A-Z)
- At least 1 number (0-9)

**Example:** `MyPassword123` ✅

## 🗄️ Database Schema

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🧪 Testing

Use **Postman**, **Thunder Client**, or **cURL** to test endpoints.

See **API_TESTING_GUIDE.md** for:

- Detailed test cases
- Expected responses
- Postman collection
- Debugging tips

## 📦 Dependencies

- **express** - Web framework
- **mysql2** - MySQL driver with promise support
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT token creation/verification
- **cors** - Cross-origin request handling
- **dotenv** - Environment variable management

## 🔧 Configuration (.env)

```env
# Server
PORT=8080
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=ticket_lelo

# Security
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10
```

⚠️ **Important:** Change `JWT_SECRET` to a strong random key in production!

## 🚦 Response Format

All responses follow this format:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {
    "token": "...",
    "user": { ... }
  }
}
```

Errors:

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": "Validation message"
  }
}
```

## 🐛 Common Issues

| Issue                     | Solution                                    |
| ------------------------- | ------------------------------------------- |
| Database connection error | Check .env credentials                      |
| Token expired             | Login again to get new token                |
| Password validation fails | Check password requirements                 |
| Email already registered  | Use different email                         |
| 401 Unauthorized          | Provide valid token in Authorization header |

## 📖 Learning Resources

- [bcrypt.js Documentation](https://github.com/dcodeIO/bcrypt.js)
- [jsonwebtoken Guide](https://github.com/auth0/node-jsonwebtoken)
- [Express.js Handbook](https://expressjs.com/)
- [MySQL2 Reference](https://github.com/sidorares/node-mysql2)

## 🎯 Next Steps

1. **Read LOGIN_API_GUIDE.md** - Full documentation
2. **Check API_TESTING_GUIDE.md** - Test with examples
3. **Run npm install && npm run dev** - Start server
4. **Test endpoints** using cURL or Postman
5. **Integrate with frontend** - Use tokens for authenticated requests

## 📝 License

ISC

## 💡 Tips

- Always verify database has required tables
- Use HTTPS in production
- Implement rate limiting for login attempts
- Monitor logs for suspicious activity
- Keep dependencies updated for security patches
- Change JWT_SECRET regularly in production

---

**Ready to authenticate!** Start the server and test the API. 🚀

For detailed information, see the documentation files in the project.
