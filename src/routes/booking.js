import express from "express";
import {
    getAllSeats,
    bookSeat,
    getSeatById,
    releaseSeat,
    bookSeatAuthenticated,
} from "../booking/bookingController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**
 * Public routes (no authentication required)
 */

/**
 * GET /api/booking/seats
 * Retrieve all seats with booking status
 * 
 * Response: { success: true, data: [ { id, name, isbooked }, ... ] }
 */
router.get("/seats", getAllSeats);

/**
 * GET /api/booking/seats/:id
 * Get details of a specific seat
 * 
 * Response: { success: true, data: { id, name, isbooked } }
 */
router.get("/seats/:id", getSeatById);

/**
 * PUT /api/booking/:id/:name
 * Book a specific seat (reserve for a customer)
 * 
 * Parameters:
 *   - id: Seat ID (path param)
 *   - name: Customer name (path param)
 * 
 * Response: { success: true, data: { seatId, customerName, bookedAt } }
 */
router.put("/:id/:name", bookSeat);

/**
 * Protected routes (authentication required)
 */

/**
 * PUT /api/booking/book/:seatId
 * Book a seat with user authentication
 * Requires: Valid JWT token
 * 
 * Parameters:
 *   - seatId: Seat ID (path param)
 * 
 * Gets userId from JWT token (req.user.id set by authenticate middleware)
 * 
 * Response: { success: true, data: { seatId, userId, bookedAt } }
 */
router.put("/book/:seatId", authenticate, bookSeatAuthenticated);

/**
 * DELETE /api/booking/:id
 * Release/cancel a booking for a seat
 * Requires: Valid JWT token
 * 
 * Response: { success: true, message: "Seat released" }
 */
router.delete("/:id", authenticate, releaseSeat);

export default router;
