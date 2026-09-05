import kafka from "../config/kafka.config.js";

import {
    publishToRiskDLQ
} from "./risk.dlq.producer.js";

import {
    markPaymentForRiskCheck
} from "../services/payment.service.js";

import {
    buildPaymentFeatures
} from "../services/feature.service.js";

import {
    isEventProcessed,
    markEventProcessed
} from "../services/event.service.js";

import {
    publishRiskResult
} from "./risk.producer.js";

import {
    predictRisk
} from "../services/ml.service.js";


const consumer = kafka.consumer({
    groupId: "risk-service-group"
});


export const startRiskConsumer = async () => {

    await consumer.connect();

    console.log(
        "Risk Service Kafka Consumer connected"
    );


    await consumer.subscribe({
        topic: "payment.created",
        fromBeginning: false
    });


    await consumer.run({

        eachMessage: async ({ message }) => {

            let paymentEvent = null;

            try {

                paymentEvent =
                    JSON.parse(
                        message.value.toString()
                    );


                /*
                 * Kafka Idempotency
                 */

                const alreadyProcessed =
                    await isEventProcessed(
                        paymentEvent.eventId,
                        "risk-service"
                    );


                if (alreadyProcessed) {

                    console.log(
                        `Event ${paymentEvent.eventId} already processed. Skipping.`
                    );

                    return;
                }


                console.log(
                    "Payment event received:",
                    paymentEvent
                );


                const payment =
                    paymentEvent.payment;


                /*
                 * Move payment:
                 *
                 * PENDING → RISK_CHECK
                 */

                await markPaymentForRiskCheck(
                    payment.id
                );


                console.log(
                    `Payment ${payment.id} moved to RISK_CHECK`
                );


                /*
                 * Build ML features
                 */

                const features =
                    await buildPaymentFeatures(
                        payment,
                        paymentEvent.occurredAt
                    );


                console.log(
                    "ML Features:",
                    features
                );


                /*
                 * Call ML Service
                 */

                const risk =
                    await predictRisk(
                        features
                    );


                console.log(
                    "ML Risk Result:",
                    risk
                );


                /*
                 * Publish risk result
                 */

                await publishRiskResult({

                    paymentId:
                        payment.id,

                    transactionReference:
                        payment.transactionReference,

                    riskScore:
                        risk.riskScore,

                    riskLevel:
                        risk.riskLevel,

                    decision:
                        risk.decision
                });
                /*
                 * Mark Kafka event as processed
                 *
                 * Only after:
                 *
                 * 1. ML succeeds
                 * 2. Risk result is published
                 */
                await markEventProcessed({
                    eventId:
                        paymentEvent.eventId,
                    eventType:
                        paymentEvent.eventType,
                    consumerName:
                        "risk-service"
                });
            } catch (error) {
                console.error(
                    "Risk consumer error:",
                    error
                );
                /*
                 * Send failed event to DLQ
                 */
                try {
                    if (paymentEvent) {
                        await publishToRiskDLQ({
                            paymentEvent,
                            error

                        });
                        console.log(
                            `Payment ${paymentEvent.payment?.id} moved to DLQ`
                        );
                    } else {
                        console.error(
                            "Cannot publish to DLQ: payment event could not be parsed."
                        );
                    }
                } catch (dlqError) {
                    console.error(
                        "Failed to publish payment to DLQ:",
                        dlqError
                    );

                    throw dlqError;
                }
            }
        }
    });
};