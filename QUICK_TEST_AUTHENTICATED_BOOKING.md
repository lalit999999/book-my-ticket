# Quick Test Guide - Authenticated Booking Endpoint

## 🚀 Quick Start

This guide helps you quickly test the new authenticated booking endpoint.

---

## Prerequisites

1. Server running: `node index.mjs`
2. PostgreSQL running on port 5433
3. MySQL/MariaDB running on port 3306
4. A test user account (or register a new one)

---

## Test Sequence

### Step 1: Register a Test User (If Needed)

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "authtest@example.com",
    "password": "TestPass123"
  }'

# Save the token from response
```

### Step 2: Login to Get JWT Token

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "authtest@example.com",
    "password": "TestPass123"
  }'

# Response:
# {
#   "success": true,
#   "message": "Login successful",
#   "data": {
#     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#     "user": {
#       "id": 1,
#       "name": "Test User",
#       "email": "authtest@example.com"
#     }
#   }
# }

# Save this token value for the next step
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 3: Get Available Seats

```bash
curl -X GET http://localhost:8080/api/booking/seats

# Response shows all seats with their booked status
```

### Step 4: Book a Seat with Authentication (NEW!)

```bash
curl -X PUT http://localhost:8080/api/booking/book/1 \
  -H "Authorization: Bearer $TOKEN"

# Expected Response (200 OK):
# {
#   "success": true,
#   "message": "Seat booked successfully",
#   "data": {
#     "seatId": 1,
#     "userId": 1,
#     "bookedAt": "2024-04-15T10:35:22.000Z"
#   }
# }
```

### Step 5: Try to Book Same Seat Again

```bash
curl -X PUT http://localhost:8080/api/booking/book/1 \
  -H "Authorization: Bearer $TOKEN"

# Expected Response (409 Conflict):
# {
#   "success": false,
#   "message": "Seat already booked or does not exist",
#   "seatId": 1
# }
```

### Step 6: Test Without Token

```bash
curl -X PUT http://localhost:8080/api/booking/book/2

# Expected Response (401 Unauthorized):
# {
#   "success": false,
#   "message": "Access denied: No token provided"
# }
```

### Step 7: Test with Invalid Token

```bash
curl -X PUT http://localhost:8080/api/booking/book/2 \
  -H "Authorization: Bearer invalid.token.here"

# Expected Response (401 Unauthorized):
# {
#   "success": false,
#   "message": "Invalid or expired token"
# }
```

### Step 8: Verify Old Endpoint Still Works

```bash
# Old public booking endpoint (no auth needed)
curl -X PUT http://localhost:8080/api/booking/3/John%20Doe

# Expected Response (200 OK):
# {
#   "success": true,
#   "message": "Seat booked successfully",
#   "data": {
#     "seatId": 3,
#     "customerName": "John Doe",
#     "bookedAt": "2024-04-15T10:40:00.000Z"
#   }
# }
```

---

## Bash Script for Quick Testing

Save this as `test_authenticated_booking.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8080"
EMAIL="authtest@example.com"
PASSWORD="TestPass123"

echo -e "${YELLOW}=== Authenticated Booking Test Suite ===${NC}\n"

# Step 1: Login
echo -e "${YELLOW}Step 1: Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | head -1 | awk -F'"' '{print $NF}')
USER_ID=$(echo $LOGIN_RESPONSE | grep -o '"id":[0-9]*' | head -1 | awk -F':' '{print $2}')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed. Create user first with register endpoint.${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo "  Token: ${TOKEN:0:20}..."
echo "  User ID: $USER_ID\n"

# Step 2: Get available seats
echo -e "${YELLOW}Step 2: Checking available seats...${NC}"
SEATS=$(curl -s -X GET $BASE_URL/api/booking/seats | grep -o '"id":[0-9]*')
echo -e "${GREEN}✓ Seats retrieved${NC}\n"

# Step 3: Book a seat with authentication
echo -e "${YELLOW}Step 3: Booking seat 1 with authentication...${NC}"
BOOKING=$(curl -s -X PUT $BASE_URL/api/booking/book/1 \
  -H "Authorization: Bearer $TOKEN")

if echo $BOOKING | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Seat booked successfully${NC}"
  echo "  Response: $BOOKING\n"
else
  echo -e "${RED}❌ Booking failed${NC}"
  echo "  Response: $BOOKING\n"
fi

# Step 4: Try to book same seat (should fail)
echo -e "${YELLOW}Step 4: Trying to book same seat (should fail)...${NC}"
BOOKING2=$(curl -s -X PUT $BASE_URL/api/booking/book/1 \
  -H "Authorization: Bearer $TOKEN")

if echo $BOOKING2 | grep -q '"message":"Seat already booked'; then
  echo -e "${GREEN}✓ Double-booking prevented correctly${NC}\n"
else
  echo -e "${RED}❌ Double-booking prevention failed${NC}\n"
fi

# Step 5: Try without token (should fail)
echo -e "${YELLOW}Step 5: Trying without token (should fail)...${NC}"
BOOKING3=$(curl -s -X PUT $BASE_URL/api/booking/book/2)

if echo $BOOKING3 | grep -q 'No token provided'; then
  echo -e "${GREEN}✓ Authentication requirement enforced${NC}\n"
else
  echo -e "${RED}❌ Authentication check failed${NC}\n"
fi

# Step 6: Test old endpoint (should still work)
echo -e "${YELLOW}Step 6: Testing old public endpoint...${NC}"
BOOKING4=$(curl -s -X PUT "$BASE_URL/api/booking/3/TestUser")

if echo $BOOKING4 | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Old endpoint still works${NC}\n"
else
  echo -e "${RED}❌ Old endpoint broken${NC}\n"
fi

echo -e "${GREEN}=== All Tests Complete ===${NC}"
```

Run with:

```bash
chmod +x test_authenticated_booking.sh
./test_authenticated_booking.sh
```

---

## Postman Collection

Import this into Postman:

```json
{
  "info": {
    "name": "Authenticated Booking Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Login",
      "request": {
        "method": "POST",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"authtest@example.com\",\"password\":\"TestPass123\"}"
        },
        "url": {
          "raw": "http://localhost:8080/api/auth/login",
          "protocol": "http",
          "host": ["localhost"],
          "port": ["8080"],
          "path": ["api", "auth", "login"]
        }
      }
    },
    {
      "name": "2. Get Available Seats",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:8080/api/booking/seats",
          "protocol": "http",
          "host": ["localhost"],
          "port": ["8080"],
          "path": ["api", "booking", "seats"]
        }
      }
    },
    {
      "name": "3. Book Seat (Authenticated)",
      "request": {
        "method": "PUT",
        "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
        "url": {
          "raw": "http://localhost:8080/api/booking/book/1",
          "protocol": "http",
          "host": ["localhost"],
          "port": ["8080"],
          "path": ["api", "booking", "book", "1"]
        }
      }
    },
    {
      "name": "4. Try Without Token",
      "request": {
        "method": "PUT",
        "url": {
          "raw": "http://localhost:8080/api/booking/book/2",
          "protocol": "http",
          "host": ["localhost"],
          "port": ["8080"],
          "path": ["api", "booking", "book", "2"]
        }
      }
    },
    {
      "name": "5. Old Public Booking",
      "request": {
        "method": "PUT",
        "url": {
          "raw": "http://localhost:8080/api/booking/3/TestUser",
          "protocol": "http",
          "host": ["localhost"],
          "port": ["8080"],
          "path": ["api", "booking", "3", "TestUser"]
        }
      }
    }
  ]
}
```

---

## Expected Results

| Test                    | Status | Expected Response |
| ----------------------- | ------ | ----------------- |
| Login                   | 200    | token provided    |
| Get seats               | 200    | array of seats    |
| Book seat (auth)        | 200    | success: true     |
| Book same seat again    | 409    | already booked    |
| Book without token      | 401    | no token          |
| Book with invalid token | 401    | invalid token     |
| Old public booking      | 200    | still works       |

---

## Troubleshooting

### "No token provided"

- Make sure you saved TOKEN from login response
- Use format: `Authorization: Bearer $TOKEN`
- Check spacing: `Bearer ` followed by token

### "Seat already booked"

- Booking worked! This is expected for Step 5
- Use a different seat number: `/api/booking/book/2`, `/api/booking/book/4`, etc.
- Or reset seats in database first

### "User ID not found"

- Login user not found
- Register new user first
- Check email/password are correct

### "Column user_id does not exist"

- This is NOT an error!
- The endpoint gracefully falls back
- Seat still gets booked
- Run migration (optional) to add the column

### Server not responding

- Check server is running: `node index.mjs`
- Check port 8080 is open: `curl http://localhost:8080`
- Check PostgreSQL is running on port 5433

---

## Success Criteria

All of the following confirms the implementation works:

✅ Can login and get JWT token  
✅ Can book a seat with valid token (200)  
✅ Cannot book same seat twice (409)  
✅ Cannot book without token (401)  
✅ Old public booking endpoint still works  
✅ Database shows isbooked = 1 for booked seats

---

## Next Steps

Once tests pass:

1. ✅ Review `AUTHENTICATED_BOOKING_GUIDE.md` for full documentation
2. ⏳ Run database migration to add user_id column (optional)
3. ⏳ Update frontend to use new endpoint
4. ⏳ Test with concurrent booking attempts (race condition test)

---

Happy testing! 🎉
