import express from "express";
import dotenv from "dotenv";
import paymentRoutes from "./routes/payment.routes.js";
import cors from "cors";
dotenv.config();
const app = express();
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Idempotency-Key"
    ]
}));
app.use(express.json());

app.get("/health", (req, res) => {
    return res.status(200).json({
        service: "payment-service",
        status: "healthy"
    });
});

app.use("/payments", paymentRoutes);

export default app;