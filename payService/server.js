import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import { connectProducer } from "./kafka/payment.producer.js";
import {
    startRiskResultConsumer
} from "./kafka/risk.consumer.js";
const PORT = process.env.PORT || 3002;

const startServer = async () => {
    try {
        await connectProducer();
        await startRiskResultConsumer();

        app.listen(PORT, () => {
            console.log(`Payment Service running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start Payment Service:", error);
        process.exit(1);
    }
};

startServer();