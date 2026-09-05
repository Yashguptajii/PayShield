import kafka from "../config/kafka.js";
import crypto from 'crypto'
const producer = kafka.producer();

let isConnected = false;

export const connectProducer = async () => {
    if (isConnected) return;

    await producer.connect();

    isConnected = true;

    console.log("Kafka Payment Producer connected");
};

export const publishPaymentCreated = async (payment) => {
    if (!isConnected) {
        await connectProducer();
    }

    await producer.send({
        topic: "payment.created",
        messages: [
            {
                key: payment.id,
                value: JSON.stringify({
                    eventId: crypto.randomUUID(),
                    eventType: "PAYMENT_CREATED",
                    occurredAt: new Date().toISOString(),

                    payment: {
                        id: payment.id,
                        transactionReference: payment.transaction_reference,
                        userId: payment.user_id,
                        receiverIdentifier: payment.receiver_identifier,
                        paymentMethod: payment.payment_method,
                        amount: payment.amount,
                        currency: payment.currency,
                        status: payment.status
                    }
                })
            }
        ]
    });
    console.log(
        `Payment event published to Kafka: ${payment.transaction_reference}`
    );
};