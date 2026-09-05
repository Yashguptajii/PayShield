import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import {
    startRiskConsumer
} from "./kafka/risk.consumer.js";
import {
    connectRiskProducer
} from "./kafka/risk.producer.js";
const PORT = process.env.PORT || 3003;
const startServer = async () => {
    try {
        await connectRiskProducer();
        await startRiskConsumer();
        app.listen(PORT, () => {

            console.log(
                `Risk Service running on port ${PORT}`
            );

        });
    } catch (error) {
        console.error(
            "Failed to start Risk Service:",
            error
        );
        process.exit(1);
    }
};
startServer();