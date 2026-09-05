import crypto from "crypto";
import kafka from "../config/kafka.config.js";
const producer = kafka.producer();
let connected = false;
export const connectRiskDLQProducer = async () => {
    if (connected) {
        return;
    }
    await producer.connect();
    connected = true;
    console.log(
        "Risk Service DLQ Producer connected"
    );
};
export const publishToRiskDLQ = async ({
    paymentEvent,
    error
}) => {
    if (!connected) {
        await connectRiskDLQProducer();
    }
    await producer.send({
        topic: "payment.risk.dlq",
        messages: [
            {
                key: paymentEvent.payment.id,

                value: JSON.stringify({

                    eventId: crypto.randomUUID(),

                    eventType:
                        "PAYMENT_RISK_DLQ",

                    originalEventId:
                        paymentEvent.eventId,

                    originalEventType:
                        paymentEvent.eventType,

                    occurredAt:
                        new Date().toISOString(),

                    payment:
                        paymentEvent.payment,

                    error:
                        error.message,

                    reason:
                        "ML_SERVICE_FAILURE",

                    retryAttempts: 3
                })
            }

        ]
    });
    console.log(
        `Payment ${paymentEvent.payment.id} sent to Risk DLQ`
    );
};