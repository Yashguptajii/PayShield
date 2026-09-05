import express from "express";

import {
    createPaymentController,
    getPaymentController,
    getPaymentsController,
    updatePaymentStatusController,
    getPaymentEventsController
} from "../controllers/payment.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/", createPaymentController);
router.get("/", getPaymentsController);
router.get("/:id/events", getPaymentEventsController);
router.patch("/:id/status", updatePaymentStatusController);
router.get("/:id", getPaymentController);

export default router;