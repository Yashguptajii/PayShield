from pathlib import Path

import pandas as pd
import xgboost as xgb


MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "models"
    / "payshield_xgboost_v4.json"
)


model = xgb.XGBClassifier()

model.load_model(
    str(MODEL_PATH)
)


def predict_risk(features: dict):

    data = pd.DataFrame([features])

    data["payment_method"] = (
        data["payment_method"]
        .map({
            "ACCOUNT": 0,
            "UPI": 1
        })
    )

    risk_score = float(
        model.predict_proba(data)[0][1]
    )

    return risk_score