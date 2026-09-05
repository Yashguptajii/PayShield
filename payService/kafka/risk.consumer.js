import kafka from "../config/kafka.js";

import {
    isEventProcessed,
    markEventProcessed
} from "../services/event.service.js";

import {
    applyRiskDecision
} from "../services/payment.service.js";


const consumer = kafka.consumer({
    groupId: "payment-risk-result-group"
});


export const startRiskResultConsumer = async () => {

    await consumer.connect();

    console.log(
        "Payment Service Risk Consumer connected"
    );


    await consumer.subscribe({
        topic: "payment.risk.result",
        fromBeginning: true
    });
    await consumer.run({
        eachMessage: async ({ message }) => {
            try {
                const riskEvent =
                    JSON.parse(
                        message.value.toString()
                    );
                /*
                 * Kafka Idempotency
                 */
                const alreadyProcessed =
                    await isEventProcessed(
                        riskEvent.eventId,
                        "payment-risk-service"
                    );
                if (alreadyProcessed) {
                    console.log(
                        `Risk result ${riskEvent.eventId} already processed. Skipping.`
                    );
                    return;
                }
                console.log(
                    "Risk result received:",
                    riskEvent
                );
                /*
                 * Apply risk decision
                 *
                 * This performs:
                 *
                 * 1. Save risk assessment
                 * 2. Update payment status
                 * 3. Create payment event
                 *
                 * inside ONE PostgreSQL transaction.
                 */
                const result =
                    await applyRiskDecision({
                        paymentId:
                            riskEvent.paymentId,
                        riskScore:
                            riskEvent.riskScore,
                        riskLevel:
                            riskEvent.riskLevel,
                        decision:
                            riskEvent.decision,
                        eventId: riskEvent.eventId
                    });
                console.log(
                    "Payment risk decision applied:",
                    result
                );
                /*
                 * Mark Kafka risk-result event
                 * as processed ONLY after the
                 * database transaction succeeds.
                 */
                await markEventProcessed({
                    eventId:
                        riskEvent.eventId,
                    eventType:
                        riskEvent.eventType,
                    consumerName:
                        "payment-risk-service"
                });
                console.log(
                    `Risk result ${riskEvent.eventId} marked as processed`
                );
            } catch (error) {

                console.error(
                    "Risk result consumer error:",
                    error
                );
            }
        }
    });
};