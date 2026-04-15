# Authenticated Seat Booking Endpoint Guide

## New Feature: Authenticated User Booking

A new endpoint has been added to support authenticated user bookings. This endpoint tracks which user booked each seat using their JWT-authenticated user ID.

---

## Endpoint Details

### PUT `/api/booking/book/:seatId`

**Method:** PUT  
**Status:** Protected (requires authentication)  
**Database:** PostgreSQL with transactions

#### Authentication

Requires a valid JWT token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

#### Parameters

- **seatId** (path parameter): The ID of the seat to book

#### Response Format

**Success (200):**

```json
{
  "success": true,
  "message": "Seat booked successfully",
  "data": {
    "seatId": 1,
    "userId": 42,
    "bookedAt": "2024-04-15T10:30:45.000Z"
  }
}
```

**Errors:**

- **400 Bad Request** - Missing seat ID:

```json
{
  "success": false,
  "message": "Seat ID is required"
}
```

- **401 Unauthorized** - Missing or invalid token:

```json
{
  "success": false,
  "message": "Access denied: No token provided"
}
```

- **409 Conflict** - Seat already booked:

```json
{
  "success": false,
  "message": "Seat already booked or does not exist",
  "seatId": 1
}
```

- **500 Internal Server Error** - Database or other errors

---

## How It Works

### 1. User Authentication

The request is validated through the `authenticate` middleware which:

- Extracts JWT token from authorization header
- Verifies token signature
- Extracts user ID from token payload
- Attaches user data to `req.user`

### 2. Transaction Safety

Uses PostgreSQL transactions with row-level locking:

- **BEGIN**: Start transaction
- **SELECT FOR UPDATE**: Lock the seat row, preventing concurrent access
- **Check Availability**: Verify seat is available (isbooked = 0)
- **Update**: Mark seat as booked and store user_id
- **COMMIT**: Finalize the transaction

### 3. Double-Booking Prevention

The FOR UPDATE lock ensures:

- Only one transaction can book a seat at a time
- If another request tries to book the same seat, it waits for the lock
- If the lock holder commits first, the waiting request gets 409 Conflict
- Prevents race conditions where two users could book the same seat

### 4. User Tracking

The seat record stores:

- `user_id`: The ID of the authenticated user who booked it
- `isbooked`: Flag indicating the seat is reserved (set to 1)
- `booked_at`: Timestamp of when the booking was made

---

## Database Schema

The implementation expects the `seats` table to have the following columns:

```sql
-- Existing columns:
id          INT PRIMARY KEY
name        VARCHAR (customer name for legacy booking)
isbooked    INT (0 = available, 1 = booked)

-- New columns (optional but recommended):
user_id     INT (user who booked the seat)
booked_at   TIMESTAMP (when the seat was booked)
```

**Note:** The endpoint gracefully handles cases where the `user_id` column doesn't exist. If the column is not present, it will still book the seat successfully, just without storing the user ID.

**To add the user_id column:**

```sql
ALTER TABLE seats ADD COLUMN user_id INT;
ALTER TABLE seats ADD COLUMN booked_at TIMESTAMP;

-- Optional: Add foreign key to users table (if you have one)
ALTER TABLE seats ADD CONSTRAINT fk_user_id
  FOREIGN KEY (user_id) REFERENCES users(id);
```

---

## Usage Examples

### cURL

```bash
# First, get a JWT token by logging in
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'

# Save the token from the response, then book a seat
curl -X PUT http://localhost:8080/api/booking/book/5 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JavaScript / Fetch

```javascript
// Assuming you have a JWT token from login
const token = localStorage.getItem("authToken");
const seatId = 5;

const response = await fetch(`/api/booking/book/${seatId}`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "message": "Seat booked successfully",
//   "data": {
//     "seatId": 5,
//     "userId": 42,
//     "bookedAt": "2024-04-15T10:30:45.000Z"
//   }
// }
```

### Postman

1. **Set up authentication:**
   - Create a login request to `/api/auth/login`
   - Extract token from response
   - Copy token to clipboard

2. **Create booking request:**
   - Method: PUT
   - URL: `http://localhost:8080/api/booking/book/5`
   - Headers tab:
     - Key: `Authorization`
     - Value: `Bearer <paste_token_here>`
   - Click Send

3. **Check response**
   - Should get 200 with booking confirmation
   - Data will include your userId

---

## Comparison: Old vs New

### Old Public Endpoint (Still Available)

```
PUT /api/booking/:id/:name

Parameters
- id: seat ID
- name: customer name (from request params)
```

**Use Case:** Public booking without authentication  
**Limitation:** Doesn't track which user made the booking

### New Authenticated Endpoint

```
PUT /api/booking/book/:seatId

Parameters
- seatId: seat ID
- userId: extracted from JWT token
```

**Use Case:** Authenticated user booking with tracking  
**Benefit:** Knows which user booked which seat

---

## Migration Guide

### For Frontend Developers

**Old way (still works):**

```javascript
// Public booking without authentication
fetch("/api/booking/1/John%20Doe", { method: "PUT" });
```

**New way (recommended):**

```javascript
// Authenticated booking
const token = localStorage.getItem("authToken");
fetch("/api/booking/book/1", {
  method: "PUT",
  headers: { Authorization: `Bearer ${token}` },
});
```

### For Database Administrators

To enable full user tracking, add these columns to the seats table:

```sql
-- Step 1: Add user_id column
ALTER TABLE seats ADD COLUMN user_id INT;

-- Step 2: Add booking timestamp
ALTER TABLE seats ADD COLUMN booked_at TIMESTAMP;

-- Step 3 (Optional): Add foreign key constraint
ALTER TABLE seats ADD CONSTRAINT fk_user_id
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE SET NULL;

-- Step 4 (Optional): Create index for queries by user
CREATE INDEX idx_seats_user_id ON seats(user_id);
```

---

## Transaction Details

The booking process uses PostgreSQL transactions for data integrity:

```sql
BEGIN;

-- Lock the row (prevents other transactions from accessing it)
SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE;

-- If row found, proceed; otherwise ROLLBACK
UPDATE seats
SET
  isbooked = 1,
  user_id = $2,
  booked_at = NOW()
WHERE id = $1;

COMMIT;
```

**Why FOR UPDATE?**

- Prevents dirty reads
- Prevents other transactions from modifying the row
- Ensures atomicity (all or nothing)
- Eliminates race condition window

**What if seat is already booked?**

- The SELECT returns 0 rows
- The controller rolls back the transaction
- Returns 409 Conflict to the client
- No partial updates occur

---

## Error Handling

| Scenario            | Response                           | Status |
| ------------------- | ---------------------------------- | ------ |
| Valid booking       | `success: true` with seat data     | 200    |
| Missing seat ID     | `Seat ID is required`              | 400    |
| Missing token       | `Access denied: No token provided` | 401    |
| Invalid token       | `Invalid token`                    | 401    |
| Seat already booked | `Seat already booked`              | 409    |
| Database error      | `Failed to book seat`              | 500    |

---

## Testing Checklist

- [ ] User can register and get JWT token
- [ ] User can login and get JWT token
- [ ] Authenticated booking works with valid token
- [ ] Booking fails with invalid token (401)
- [ ] Booking fails with missing token (401)
- [ ] Booking fails when seat already booked (409)
- [ ] Booking returns user ID in response
- [ ] Multiple users can book different seats
- [ ] Two users cannot book same seat (one gets 409)
- [ ] Old public booking endpoint still works
- [ ] Database shows user_id for booked seats (if column exists)

---

## Code Structure

### Controller Function

**File:** `src/booking/bookingController.js`
**Function:** `bookSeatAuthenticated`

Key features:

- Extracts seatId from params
- Extracts userId from req.user.id
- Validates both parameters
- Uses transaction with FOR UPDATE
- Handles missing user_id column gracefully
- Returns success/error responses

### Route Definition

**File:** `src/routes/booking.js`
**Route:** `router.put("/book/:seatId", authenticate, bookSeatAuthenticated)`

Why authenticate middleware is applied first:

- Validates JWT token before reaching controller
- Attaches user data to req.user
- Returns 401 if token is invalid/missing

---

## Future Enhancements

Potential improvements:

1. **Booking Owner Verification** - Only the user who made the booking can cancel it
2. **Booking History** - Track who booked what when
3. **Cancellation Fee** - Implement rules for canceling bookings
4. **Email Notification** - Send confirmation email when booking succeeds
5. **Seat Categories** - Different prices/rules for different seat types
6. **Reservation Expiry** - Automatically cancel unpaid bookings after X hours

---

## Backward Compatibility

✅ **Existing endpoints unchanged:**

- `PUT /api/booking/:id/:name` - Still works for public bookings
- `GET /api/booking/seats` - Still works
- `GET /api/booking/seats/:id` - Still works
- `DELETE /api/booking/:id` - Still works for releasing seats

✅ **New endpoint added:**

- `PUT /api/booking/book/:seatId` - New authenticated endpoint

✅ **No breaking changes** - Existing code continues to work

---

## Summary

The new authenticated booking endpoint provides:

- ✅ User tracking (knows who booked each seat)
- ✅ Transaction safety (prevents double-booking)
- ✅ Authentication protection (requires valid JWT)
- ✅ Clear audit trail (booking timestamps)
- ✅ Graceful fallback (works even without user_id column)

Use this endpoint for any user-authenticated booking workflow!
