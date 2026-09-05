from fastapi import FastAPI, HTTPException

from .schemas import PaymentFeatures
from .model import predict_risk


app = FastAPI(
    title="PayShield ML Service",
    version="1.0.0"
)


THRESHOLD = 0.15


@app.get("/health")
def health():

    return {
        "status": "healthy",
        "service": "ml-service",
        "model": "payshield_xgboost_v4"
    }


@app.post("/predict")
def predict(features: PaymentFeatures):

    try:

        risk_score = predict_risk(
            features.model_dump()
        )

        if risk_score >= THRESHOLD:

            risk_level = "HIGH"
            decision = "BLOCK"

        else:

            risk_level = "LOW"
            decision = "ALLOW"

        return {

            "riskScore": round(
                risk_score,
                4
            ),

            "riskLevel": risk_level,

            "decision": decision

        }

    except Exception as error:

        print(
            "Prediction error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Risk prediction failed"
        )