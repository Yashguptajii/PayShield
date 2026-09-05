

export const calculateRisk = (payment) => {

    let riskScore = 0;

    const amount = Number(payment.amount);

    if (amount >= 100000) {
        riskScore += 0.5;
    } else if (amount >= 50000) {
        riskScore += 0.3;
    } else if (amount >= 10000) {
        riskScore += 0.1;
    }

    if (payment.paymentMethod === "UPI") {
        riskScore += 0.05;
    }

    if (payment.receiverIdentifier?.includes("@")) {
        riskScore += 0.05;
    }

    riskScore = Math.min(riskScore, 1);

    let riskLevel;
    let decision;

    if (riskScore < 0.3) {
        riskLevel = "LOW";
        decision = "ALLOW";
    } else if (riskScore < 0.7) {
        riskLevel = "MEDIUM";
        decision = "REVIEW";
    } else {
        riskLevel = "HIGH";
        decision = "BLOCK";
    }

    return {
        riskScore,
        riskLevel,
        decision
    };
};