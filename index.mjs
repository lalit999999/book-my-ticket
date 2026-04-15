import express from "express";
import pg from "pg";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./src/routes/auth.js";

// Load environment variables
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const port = process.env.PORT || 8080;

// PostgreSQL connection pool (for existing booking system)
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

const app = new express();

// ==================== Middleware ====================
app.use(cors());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse form data

// ==================== Routes ====================

// Authentication routes (public and protected)
app.use("/api/auth", authRoutes);

// Static files
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Booking system endpoints (PostgreSQL)
// Get all seats
app.get("/seats", async (req, res) => {
  try {
    const result = await pool.query("select * from seats");
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching seats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch seats",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Book a seat (with transaction)
app.put("/:id/:name", async (req, res) => {
  const conn = await pool.connect();

  try {
    const id = req.params.id;
    const name = req.params.name;

    // Validate input
    if (!id || !name) {
      return res.status(400).json({
        success: false,
        message: "Seat ID and name are required",
      });
    }

    // Begin transaction
    await conn.query("BEGIN");

    // Check seat availability with row-level lock
    const sql = "SELECT * FROM seats WHERE id = $1 AND isbooked = 0 FOR UPDATE";
    const result = await conn.query(sql, [id]);

    if (result.rowCount === 0) {
      await conn.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Seat already booked or does not exist",
      });
    }

    // Update seat
    const sqlU = "UPDATE seats SET isbooked = 1, name = $2 WHERE id = $1";
    const updateResult = await conn.query(sqlU, [id, name]);

    // Commit transaction
    await conn.query("COMMIT");

    res.json({
      success: true,
      message: "Seat booked successfully",
      data: updateResult,
    });
  } catch (error) {
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
    conn.release();
  }
});

// ==================== Error Handling ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : undefined,
  });
});

// ==================== Server Startup ====================
app.listen(port, () => {
  console.log("========================================");
  console.log(`🚀 Server starting on port: ${port}`);
  console.log("========================================");
  console.log("\n📚 Available Routes:");
  console.log("  POST   /api/auth/login");
  console.log("  POST   /api/auth/register");
  console.log("  GET    /api/auth/profile (protected)");
  console.log("  POST   /api/auth/change-password (protected)");
  console.log("  GET    /seats");
  console.log("  PUT    /:id/:name (book seat)");
  console.log("\n📖 API Documentation:");
  console.log("  http://localhost:" + port);
  console.log("========================================\n");
});
