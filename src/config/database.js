import mysql from "mysql2/promise";

/**
 * Create MySQL connection pool
 * Pool maintains multiple connections for better performance
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "ticket_lelo",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

/**
 * Get connection from pool
 * @returns {Promise<Connection>} MySQL connection
 */
export const getConnection = async () => {
    try {
        const connection = await pool.getConnection();
        return connection;
    } catch (error) {
        console.error("Database connection error:", error);
        throw new Error("Failed to connect to database");
    }
};

export default pool;
