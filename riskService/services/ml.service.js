const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

const sleep = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));

export const predictRisk = async (features) => {

    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {

        try {

            const response = await fetch(
                `${ML_SERVICE_URL}/predict`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(features)
                }
            );

            if (!response.ok) {

                throw new Error(
                    `ML_SERVICE_HTTP_${response.status}`
                );
            }
            return await response.json();
        } catch (error) {
            console.error(
                `ML Service attempt ${attempt}/${maxRetries} failed:`,
                error.message
            );

            if (attempt === maxRetries) {
                throw error;
            }
            await sleep(1000 * attempt);
        }
    }
};