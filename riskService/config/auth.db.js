import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const authPool = new Pool({
    host: process.env.AUTH_DB_HOST,
    port: process.env.AUTH_DB_PORT,
    database: process.env.AUTH_DB_NAME,
    user: process.env.AUTH_DB_USER,
    password: process.env.AUTH_DB_PASSWORD,
});

authPool.on("error", (error) => {
    console.error("Auth DB error:", error);
});

export default authPool;