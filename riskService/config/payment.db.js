import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const paymentPool = new Pool({
    host: process.env.PAYMENT_DB_HOST,
    port: process.env.PAYMENT_DB_PORT,
    database: process.env.PAYMENT_DB_NAME,
    user: process.env.PAYMENT_DB_USER,
    password: process.env.PAYMENT_DB_PASSWORD,
});

paymentPool.on("error", (error) => {
    console.error("Payment DB error:", error);
});

export default paymentPool;