import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import authPool from "./config/auth.db.js";
import cors from "cors";
dotenv.config();

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"]
}))
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    service: "auth-service",
    status: "healthy"
  });
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await authPool.query(
      "SELECT current_database(), NOW()"
    );

    res.status(200).json({
      message: "Database connected successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database connection failed",
      error: error.message
    });
  }
});

app.use("/", authRoutes);

export default app;