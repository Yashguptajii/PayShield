import paymentPool from "../config/payment.db.js";
export const isEventProcessed = async (
    eventId,
    consumerName
) => {
    const result = await paymentPool.query(
        `SELECT 1
         FROM processed_events
         WHERE event_id = $1
           AND consumer_name = $2`,
        [
            eventId,
            consumerName
        ]
    );
    return result.rows.length > 0;
};
export const markEventProcessed = async ({
    eventId,
    eventType,
    consumerName
}) => {
    await paymentPool.query(
        `INSERT INTO processed_events (
            event_id,
            event_type,
            consumer_name
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (
            event_id,
            consumer_name
        )
        DO NOTHING`,
        [
            eventId,
            eventType,
            consumerName
        ]
    );
};