import crypto from "crypto";
import kafka from "../config/kafka.config.js";
const producer = kafka.producer();
let connected = false;
export const connectRiskProducer = async () => {
    if (connected) {
        return;
    }
    await producer.connect();
    connected = true;
    console.log("Risk Service Kafka Producer connected");
};
export const publishRiskResult = async (result) => {
    if (!connected) {
        await connectRiskProducer();
    }
    await producer.send({
        topic: "payment.risk.result",
        messages: [
            {
                key: result.paymentId,
                value: JSON.stringify({
                    eventId: crypto.randomUUID(),
                    eventType: "PAYMENT_RISK_RESULT",
                    occurredAt: new Date().toISOString(),
                    paymentId: result.paymentId,
                    transactionReference:
                        result.transactionReference,
                    riskScore:
                        result.riskScore,
                    riskLevel:
                        result.riskLevel,
                    decision:
                        result.decision
                })
            }
        ]
    });
    console.log(
        `Risk result published for payment ${result.paymentId}`
    );
};