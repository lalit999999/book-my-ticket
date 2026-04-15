import express from "express";
import {
  getAllSeats,
  bookSeat,
  getSeatById,
  releaseSeat,
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
 * DELETE /api/booking/:id
 * Release/cancel a booking for a seat
 * Requires: Valid JWT token
 * 
 * Response: { success: true, message: "Seat released" }
 */
router.delete("/:id", authenticate, releaseSeat);

export default router;
