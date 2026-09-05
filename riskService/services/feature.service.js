import paymentPool from "../config/payment.db.js";
import authPool from "../config/auth.db.js";

export const buildPaymentFeatures = async (payment,occurredAt) => {

    const userId = payment.userId;
    const paymentId = payment.id;

    const paymentTime = occurredAt?new Date(occurredAt):new Date();

    // --------------------------------------------------
    // 1. USER INFORMATION
    // --------------------------------------------------

    const userResult = await authPool.query(
        `
        SELECT created_at
        FROM users
        WHERE id = $1
        `,
        [userId]
    );

    if (userResult.rows.length === 0) {
        throw new Error(`User not found: ${userId}`);
    }

    const user = userResult.rows[0];

    const accountAgeDays = Math.max(
        0,
        Math.floor(
            (paymentTime - new Date(user.created_at)) /
            (1000 * 60 * 60 * 24)
        )
    );

    // --------------------------------------------------
    // 2. PREVIOUS TRANSACTIONS
    // --------------------------------------------------

    const transactionStatsResult = await paymentPool.query(
        `
        SELECT
            COUNT(*) AS total_transactions,
            COALESCE(AVG(amount), 0) AS avg_transaction_amount,
            COUNT(*) FILTER (
                WHERE status = 'FAILED'
            ) AS failed_transactions
        FROM payments
        WHERE user_id = $1
          AND id != $2
        `,
        [userId, paymentId]
    );

    const stats = transactionStatsResult.rows[0];

    const totalTransactions =
        Number(stats.total_transactions);

    const avgTransactionAmount =
        Number(stats.avg_transaction_amount);

    const failedTransactions =
        Number(stats.failed_transactions);

    // --------------------------------------------------
    // 3. PREVIOUS FRAUD COUNT
    // --------------------------------------------------

    const fraudResult = await paymentPool.query(
        `
        SELECT COUNT(*) AS fraud_count
        FROM payment_events pe
        JOIN payments p
            ON p.id = pe.payment_id
        WHERE p.user_id = $1
          AND p.id != $2
          AND pe.event_type = 'PAYMENT_RISK_DECISION'
          AND pe.new_status = 'BLOCKED'
        `,
        [userId, paymentId]
    );

    const previousFraudCount =
        Number(fraudResult.rows[0].fraud_count);

    // --------------------------------------------------
    // 4. VELOCITY
    // --------------------------------------------------

    const velocityResult = await paymentPool.query(
        `
        SELECT
            COUNT(*) FILTER (
                WHERE created_at >= $1::timestamp - INTERVAL '5 minutes'
            ) AS transactions_last_5min,

            COUNT(*) FILTER (
                WHERE created_at >= $1::timestamp - INTERVAL '1 hour'
            ) AS transactions_last_1hour,

            COUNT(*) FILTER (
                WHERE created_at >= $1::timestamp - INTERVAL '24 hours'
            ) AS transactions_last_24hours,

            COALESCE(
                SUM(amount) FILTER (
                    WHERE created_at >= $1::timestamp - INTERVAL '1 hour'
                ),
                0
            ) AS amount_last_1hour

        FROM payments

        WHERE user_id = $2
          AND id != $3
        `,
        [paymentTime, userId, paymentId]
    );

    const velocity = velocityResult.rows[0];

    const transactionsLast5Min =
        Number(velocity.transactions_last_5min);

    const transactionsLast1Hour =
        Number(velocity.transactions_last_1hour);

    const transactionsLast24Hours =
        Number(velocity.transactions_last_24hours);

    const amountLast1Hour =
        Number(velocity.amount_last_1hour);

    // --------------------------------------------------
    // 5. LAST TRANSACTION
    // --------------------------------------------------

    const lastTransactionResult = await paymentPool.query(
        `
        SELECT created_at
        FROM payments
        WHERE user_id = $1
          AND id != $2
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [userId, paymentId]
    );

    let timeSinceLastTransaction = 86400;

    if (lastTransactionResult.rows.length > 0) {

        const lastTransaction =
            new Date(lastTransactionResult.rows[0].created_at);

        timeSinceLastTransaction = Math.max(
            0,
            Math.floor(
                (paymentTime - lastTransaction) / 1000
            )
        );
    }

    // --------------------------------------------------
    // 6. NEW RECEIVER
    // --------------------------------------------------

    const receiverResult = await paymentPool.query(
        `
        SELECT 1
        FROM payments
        WHERE user_id = $1
          AND receiver_identifier = $2
          AND id != $3
        LIMIT 1
        `,
        [
            userId,
            payment.receiverIdentifier,
            paymentId
        ]
    );

    const newReceiver =
        receiverResult.rows.length === 0 ? 1 : 0;

    // --------------------------------------------------
    // 7. DERIVED FEATURES
    // --------------------------------------------------

    const amountRatio =
        avgTransactionAmount > 0
            ? Number(payment.amount) / avgTransactionAmount
            : 0;

    const velocity5MinRatio =
        totalTransactions > 0
            ? transactionsLast5Min / totalTransactions
            : 0;

    // --------------------------------------------------
    // 8. TIME FEATURES
    // --------------------------------------------------

    const hour = paymentTime.getHours();

    const dayOfWeek = paymentTime.getDay();

    // --------------------------------------------------
    // 9. FINAL FEATURE OBJECT
    // --------------------------------------------------

    const features = {

        amount: Number(payment.amount),

        payment_method:
            payment.paymentMethod,

        hour,

        day_of_week:
            dayOfWeek,

        account_age_days:
            accountAgeDays,

        total_transactions:
            totalTransactions,

        avg_transaction_amount:
            avgTransactionAmount,

        failed_transactions:
            failedTransactions,

        previous_fraud_count:
            previousFraudCount,

        transactions_last_5min:
            transactionsLast5Min,

        transactions_last_1hour:
            transactionsLast1Hour,

        transactions_last_24hours:
            transactionsLast24Hours,

        amount_last_1hour:
            amountLast1Hour,

        time_since_last_transaction:
            timeSinceLastTransaction,

        new_receiver:
            newReceiver,

        amount_ratio:
            amountRatio,

        velocity_5min_ratio:
            velocity5MinRatio
    };

    return features;
};