import paymentPool from "../config/payment.db.js";

export const findPaymentByIdempotencyKey = async (idempotencyKey) => {
    const result = await paymentPool.query(
        `SELECT * FROM payments
         WHERE idempotency_key = $1`,
        [idempotencyKey]
    );

    return result.rows[0];
};

export const createPayment = async ({
    transactionReference,
    userId,
    receiverIdentifier,
    paymentMethod,
    amount,
    currency,
    description,
    idempotencyKey
}) => {
    const client = await paymentPool.connect();

    try {
        await client.query("BEGIN");

        const paymentResult = await client.query(
            `INSERT INTO payments (
                transaction_reference,
                user_id,
                receiver_identifier,
                payment_method,
                amount,
                currency,
                description,
                status,
                idempotency_key
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8)
            RETURNING *`,
            [
                transactionReference,
                userId,
                receiverIdentifier,
                paymentMethod,
                amount,
                currency,
                description,
                idempotencyKey
            ]
        );

        const payment = paymentResult.rows[0];

        await client.query(
            `INSERT INTO payment_events (
                payment_id,
                event_type,
                previous_status,
                new_status
            )
            VALUES ($1, $2, $3, $4)`,
            [
                payment.id,
                "PAYMENT_CREATED",
                null,
                "PENDING"
            ]
        );

        await client.query("COMMIT");

        return payment;

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
};

export const getPaymentById = async (paymentId,userId) => {
    const result = await paymentPool.query(
        `SELECT * FROM payments WHERE id = $1 AND user_id= $2`,
        [paymentId,userId]
    );

    return result.rows[0];
};

export const getPaymentsByUserId = async (userId) => {
    const result = await paymentPool.query(
        `SELECT *
         FROM payments
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
    );

    return result.rows;
};

export const updatePaymentStatus = async (paymentId, newStatus) => {
    const client = await paymentPool.connect();

    try {
        await client.query("BEGIN");

        const currentResult = await client.query(
            `SELECT * FROM payments
             WHERE id = $1
             FOR UPDATE`,
            [paymentId]
        );

        const payment = currentResult.rows[0];

        if (!payment) {
            throw new Error("PAYMENT_NOT_FOUND");
        }

        const previousStatus = payment.status;

        const updateResult = await client.query(
            `UPDATE payments
             SET status = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [newStatus, paymentId]
        );

        const updatedPayment = updateResult.rows[0];

        await client.query(
            `INSERT INTO payment_events (
                payment_id,
                event_type,
                previous_status,
                new_status
            )
            VALUES ($1, $2, $3, $4)`,
            [
                paymentId,
                "PAYMENT_STATUS_CHANGED",
                previousStatus,
                newStatus
            ]
        );

        await client.query("COMMIT");

        return updatedPayment;

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
};
export const markPaymentForRiskCheck = async (paymentId) => {
    const client = await paymentPool.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(
            `SELECT status
             FROM payments
             WHERE id = $1
             FOR UPDATE`,
            [paymentId]
        );

        const payment = result.rows[0];

        if (!payment) {
            throw new Error("PAYMENT_NOT_FOUND");
        }

        if (payment.status === "RISK_CHECK") {
            await client.query("COMMIT");

            return {
                paymentId,
                previousStatus: payment.status,
                newStatus: "RISK_CHECK"
            };
        }

        if (payment.status !== "PENDING") {
            throw new Error(
                `INVALID_RISK_CHECK_TRANSITION: ${payment.status} -> RISK_CHECK`
            );
        }

        await client.query(
            `UPDATE payments
             SET status = 'RISK_CHECK',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [paymentId]
        );

        await client.query(
            `INSERT INTO payment_events (
                payment_id,
                event_type,
                previous_status,
                new_status
            )
            VALUES ($1, $2, $3, $4)`,
            [
                paymentId,
                "PAYMENT_RISK_CHECK_STARTED",
                "PENDING",
                "RISK_CHECK"
            ]
        );

        await client.query("COMMIT");

        return {
            paymentId,
            previousStatus: "PENDING",
            newStatus: "RISK_CHECK"
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
};

export const getPaymentEvents = async (paymentId) => {
    const result = await paymentPool.query(
        `SELECT *
         FROM payment_events
         WHERE payment_id = $1
         ORDER BY created_at ASC`,
        [paymentId]
    );

    return result.rows;
};

export const saveRiskAssessment = async ({
    paymentId,
    riskScore,
    riskLevel,
    decision,
    modelVersion = "payshield_xgboost_v4"
}) => {

    const client = await paymentPool.connect();

    try {

        await client.query("BEGIN");

        const result = await client.query(
            `INSERT INTO payment_risk_assessments (
                payment_id,
                risk_score,
                risk_level,
                decision,
                model_version
            )
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (payment_id)
            DO UPDATE SET
                risk_score = EXCLUDED.risk_score,
                risk_level = EXCLUDED.risk_level,
                decision = EXCLUDED.decision,
                model_version = EXCLUDED.model_version
            RETURNING *`,
            [
                paymentId,
                riskScore,
                riskLevel,
                decision,
                modelVersion
            ]
        );

        await client.query("COMMIT");

        return result.rows[0];

    } catch (error) {

        await client.query("ROLLBACK");
        throw error;

    } finally {

        client.release();

    }
};
export const applyRiskDecision = async ({
    paymentId,
    riskScore,
    riskLevel,
    decision,
    eventId
}) => {

    const client = await paymentPool.connect();

    try {

        await client.query("BEGIN");

        const paymentResult = await client.query(
            `SELECT *
             FROM payments
             WHERE id = $1
             FOR UPDATE`,
            [paymentId]
        );

        const payment = paymentResult.rows[0];

        if (!payment) {
            throw new Error("PAYMENT_NOT_FOUND");
        }

        let newStatus;

        if (decision === "ALLOW") {
            newStatus = "COMPLETED";
        } else if (decision === "REVIEW") {
            newStatus = "RISK_CHECK";
        } else if (decision === "BLOCK") {
            newStatus = "BLOCKED";
        } else {
            throw new Error(
                `INVALID_RISK_DECISION: ${decision}`
            );
        }

        const modelVersion =
            "payshield_xgboost_v4";

        // 1. Store risk assessment
        const assessmentResult = await client.query(
            `INSERT INTO payment_risk_assessments (
                payment_id,
                risk_score,
                risk_level,
                decision,
                model_version,
                event_id
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                paymentId,
                riskScore,
                riskLevel,
                decision,
                modelVersion,
                eventId
            ]
        );

        const assessment =
            assessmentResult.rows[0];

        const previousStatus =
            payment.status;

        // 2. Update payment status only when it actually changes
        if (previousStatus !== newStatus) {

            await client.query(
                `UPDATE payments
                 SET status = $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [
                    newStatus,
                    paymentId
                ]
            );
        }

        // 3. ALWAYS create audit event
        await client.query(
            `INSERT INTO payment_events (
                payment_id,
                event_type,
                previous_status,
                new_status,
                event_id,
                metadata
            )
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                paymentId,
                "PAYMENT_RISK_DECISION",
                previousStatus,
                newStatus,
                eventId,
                JSON.stringify({
                    riskScore,
                    riskLevel,
                    decision,
                    modelVersion,
                    assessmentId: assessment.id
                })
            ]
        );
        await client.query("COMMIT");
        return {
            paymentId,
            previousStatus,
            newStatus,
            riskScore,
            riskLevel,
            decision,
            assessmentId: assessment.id,
            eventId
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};