import paymentPool from "../config/payment.db.js";

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
                previousStatus: "RISK_CHECK",
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