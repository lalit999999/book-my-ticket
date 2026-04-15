import pg from "pg";

/**
 * PostgreSQL connection pool for booking system
 * Handles seat booking which uses PostgreSQL with transactions
 */
const pool = new pg.Pool({
    host: "localhost",
    port: 5433,
    user: "postgres",
    password: "postgres",
    database: "sql_class_2_db",
    max: 20,
    connectionTimeoutMillis: 0,
    idleTimeoutMillis: 0,
});

/**
 * Get all available and booked seats
 * 
 * GET /api/booking/seats
 * 
 * Response: { success: true, data: [ { id, name, isbooked }, ... ] }
 */
export const getAllSeats = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM seats");
        res.json({
            success: true,
            message: "Seats retrieved successfully",
            data: result.rows,
        });
    } catch (error) {
        console.error("Error fetching seats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch seats",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/**
 * Book a specific seat
 * 
 * Uses transaction with FOR UPDATE lock to prevent double-booking
 * 
 * PUT /api/booking/:id/:name
 * Parameters:
 *   - id: Seat ID
 *   - name: Customer name
 * 
 * Response: { success: true, message: "Seat booked successfully", data: {...} }
 */
export const bookSeat = async (req, res) => {
    const conn = await pool.connect();

    try {
        const { id } = req.params;
        const { name } = req.params;

        // Validate input
        if (!id || !name) {
            return res.status(400).json({
                success: false,
                message: "Seat ID and name are required",
            });
        }

        // Begin transaction for atomicity
        // Keep transaction as small as possible
        await conn.query("BEGIN");

        // Check seat availability with row-level lock (FOR UPDATE)
        // This prevents other transactions from booking the same seat simultaneously
        const checkSql = "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE";
        const checkResult = await conn.query(checkSql, [id]);

        // If no rows returned, seat is either booked or doesn't exist
        if (checkResult.rowCount === 0) {
            await conn.query("ROLLBACK");
            return res.status(409).json({
                success: false,
                message: "Seat already booked or does not exist",
                seatId: id,
            });
        }

        // Update seat: mark as booked and store customer name
        const updateSql = "UPDATE seats SET isbooked = 1, name = $2 WHERE id = $1";
        const updateResult = await conn.query(updateSql, [id, name]);

        // Commit transaction
        await conn.query("COMMIT");

        res.status(200).json({
            success: true,
            message: "Seat booked successfully",
            data: {
                seatId: id,
                customerName: name,
                bookedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        // Rollback transaction on error
        try {
            await conn.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Rollback error:", rollbackError);
        }

        console.error("Booking error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to book seat",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    } finally {
        // Always release connection back to pool
        conn.release();
    }
};

/**
 * Get seat details by ID
 * 
 * GET /api/booking/seats/:id
 * 
 * Response: { success: true, data: { id, name, isbooked } }
 */
export const getSeatById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query("SELECT * FROM seats WHERE id = $1", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Seat not found",
            });
        }

        res.json({
            success: true,
            message: "Seat retrieved successfully",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Error fetching seat:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch seat",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/**
 * Cancel/Release a booked seat
 * 
 * DELETE /api/booking/:id
 * 
 * Response: { success: true, message: "Seat released" }
 */
export const releaseSeat = async (req, res) => {
    const conn = await pool.connect();

    try {
        const { id } = req.params;

        await conn.query("BEGIN");

        const result = await conn.query(
            "UPDATE seats SET isbooked = 0, name = NULL WHERE id = $1 AND isbooked = 1",
            [id]
        );

        if (result.rowCount === 0) {
            await conn.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Seat not found or not booked",
            });
        }

        await conn.query("COMMIT");

        res.json({
            success: true,
            message: "Seat released successfully",
            seatId: id,
        });
    } catch (error) {
        try {
            await conn.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Rollback error:", rollbackError);
        }

        console.error("Release error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to release seat",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    } finally {
        conn.release();
    }
};

export default pool;
