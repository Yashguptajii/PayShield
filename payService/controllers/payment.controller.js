import crypto from "crypto";
import { publishPaymentCreated } from "../kafka/payment.producer.js";
import {
    findPaymentByIdempotencyKey,
    createPayment,
    getPaymentById,
    getPaymentsByUserId,
    updatePaymentStatus,
    getPaymentEvents
} from "../services/payment.service.js";
const allowedTransitions = {
    PENDING: ["PROCESSING", "RISK_CHECK", "FAILED", "BLOCKED"],
    PROCESSING: ["RISK_CHECK", "COMPLETED", "FAILED", "BLOCKED"],
    RISK_CHECK: ["COMPLETED", "FAILED", "BLOCKED"],
    COMPLETED: [],
    FAILED: [],
    BLOCKED: []
};

const isValidUUID = (value) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

export const createPaymentController = async (req, res) => {
    try {
        const {
            receiverIdentifier,
            amount,
            currency = "INR",
            description = null
        } = req.body;

        const userId = req.user.sub;
        const idempotencyKey = req.headers["idempotency-key"];

        if (!idempotencyKey) {
            return res.status(400).json({
                message: "Idempotency-Key header is required"
            });
        }

        if (!receiverIdentifier || amount === undefined) {
            return res.status(400).json({
                message: "receiverIdentifier and amount are required"
            });
        }

        if (!isValidUUID(userId)) {
            return res.status(400).json({
                message: "Invalid userId"
            });
        }

        const existingPayment =
            await findPaymentByIdempotencyKey(idempotencyKey);

        if (existingPayment) {
            return res.status(200).json({
                message: "Duplicate request detected. Returning existing payment.",
                payment: existingPayment
            });
        }

        const paymentAmount = Number(amount);

        if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than 0"
            });
        }

        const paymentMethod = receiverIdentifier.includes("@")
            ? "UPI"
            : "ACCOUNT";

        const transactionReference =
            `PAY-${Date.now()}-${crypto.randomUUID()
                .slice(0, 8)
                .toUpperCase()}`;

        const payment = await createPayment({
            transactionReference,
            userId,
            receiverIdentifier,
            paymentMethod,
            amount: paymentAmount,
            currency: currency.toUpperCase(),
            description,
            idempotencyKey
        });
        await publishPaymentCreated(payment);
        return res.status(201).json({
            message: "Payment created successfully",
            payment
        });

    } catch (error) {
        console.error("Create payment error:", error);

        return res.status(500).json({
            message: "Payment creation failed"
        });
    }
};

export const getPaymentController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.sub;
        if (!isValidUUID(id)) {
            return res.status(400).json({
                message: "Invalid payment ID"
            });
        }
        if (!isValidUUID(userId)) {
            return res.status(401).json({
                message: "Invalid authenticated user"
            });
        }

        const payment = await getPaymentById(id,userId);

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        return res.status(200).json({
            payment
        });

    } catch (error) {
        console.error("Get payment error:", error);

        return res.status(500).json({
            message: "Failed to get payment"
        });
    }
};

export const getPaymentsController = async (req, res) => {
    try {
        const userId = req.user.sub;

        if (!userId) {
             return res.status(400).json({
                message: "userId query parameter is required"});
}

        if (!isValidUUID(userId)) {
            return res.status(401).json({
                message: "Invalid authenticated user"
            });
        }

        const payments = await getPaymentsByUserId(userId);

        return res.status(200).json({
            count: payments.length,
            payments
        });

    } catch (error) {
        console.error("Get payments error:", error);

        return res.status(500).json({
            message: "Failed to get payments"
        });
    }
};

export const updatePaymentStatusController = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!isValidUUID(id)) {
            return res.status(400).json({
                message: "Invalid payment ID"
            });
        }

        if (!status) {
            return res.status(400).json({
                message: "status is required"
            });
        }

        const newStatus = status.toUpperCase();

        const payment = await getPaymentById(id);

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        if (!allowedTransitions[payment.status]?.includes(newStatus)) {
            return res.status(400).json({
                message: `Invalid status transition from ${payment.status} to ${newStatus}`
            });
        }

        const updatedPayment = await updatePaymentStatus(
            id,
            newStatus
        );

        return res.status(200).json({
            message: "Payment status updated successfully",
            payment: updatedPayment
        });

    } catch (error) {
        console.error("Update payment status error:", error);

        return res.status(500).json({
            message: "Payment status update failed"
        });
    }
};

export const getPaymentEventsController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.sub;
        if (!isValidUUID(id)) {
            return res.status(400).json({
                message: "Invalid payment ID"
            });
        }
        if (!isValidUUID(userId)) {
            return res.status(401).json({
                message: "Invalid authenticated user"
            });
        }

        const payment = await getPaymentById(id,userId);

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        const events = await getPaymentEvents(id);

        return res.status(200).json({
            paymentId: id,
            count: events.length,
            events
        });

    } catch (error) {
        console.error("Get payment events error:", error);

        return res.status(500).json({
            message: "Failed to get payment events"
        });
    }
};