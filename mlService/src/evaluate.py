import joblib
import pandas as pd

from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    average_precision_score
)

from preprocessing import (
    load_data,
    split_data,
    scale_amount
)


DATA_PATH = "data/creditcard.csv"

MODEL_PATH = "models/logistic_model.joblib"
SCALER_PATH = "models/amount_scaler.joblib"


def main():

    print("Loading dataset...")

    df = load_data(DATA_PATH)

    (
        X_train,
        X_validation,
        X_test,
        y_train,
        y_validation,
        y_test
    ) = split_data(df)

    (
        X_train,
        X_validation,
        X_test,
        scaler
    ) = scale_amount(
        X_train,
        X_validation,
        X_test
    )

    print("Loading Logistic Regression model...")

    model = joblib.load(MODEL_PATH)

    print("\nEvaluating on validation set...")

    predictions = model.predict(X_validation)

    probabilities = model.predict_proba(
        X_validation
    )[:, 1]

    print("\nClassification Report:")
    print(
        classification_report(
            y_validation,
            predictions,
            digits=4
        )
    )

    print("\nConfusion Matrix:")

    cm = confusion_matrix(
        y_validation,
        predictions
    )

    print(cm)

    roc_auc = roc_auc_score(
        y_validation,
        probabilities
    )

    pr_auc = average_precision_score(
        y_validation,
        probabilities
    )

    print("\nROC-AUC:")
    print(round(roc_auc, 4))

    print("\nPR-AUC:")
    print(round(pr_auc, 4))


if __name__ == "__main__":
    main()