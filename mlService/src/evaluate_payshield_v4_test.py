import xgboost as xgb

from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    average_precision_score
)

from payshield_preprocessing_v3 import (
    load_data,
    prepare_data,
    split_data
)


MODEL_PATH = "models/payshield_xgboost_v4.json"

THRESHOLD = 0.15


def main():

    print("Loading PayShield V3 dataset...")

    df = load_data()

    X, y = prepare_data(df)

    (
        X_train,
        X_validation,
        X_test,
        y_train,
        y_validation,
        y_test
    ) = split_data(X, y)

    print("Loading XGBoost V4 model...")

    model = xgb.XGBClassifier()

    model.load_model(
        MODEL_PATH
    )

    print("\nEvaluating on TEST set...")

    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    predictions = (
        probabilities >= THRESHOLD
    ).astype(int)

    print(
        f"\nDecision threshold: {THRESHOLD}"
    )

    print("\nClassification Report:")

    print(
        classification_report(
            y_test,
            predictions,
            digits=4,
            zero_division=0
        )
    )

    print("\nConfusion Matrix:")

    print(
        confusion_matrix(
            y_test,
            predictions
        )
    )

    roc_auc = roc_auc_score(
        y_test,
        probabilities
    )

    pr_auc = average_precision_score(
        y_test,
        probabilities
    )

    print("\nROC-AUC:")

    print(
        round(
            roc_auc,
            4
        )
    )

    print("\nPR-AUC:")

    print(
        round(
            pr_auc,
            4
        )
    )

    print("\nRisk Score Statistics:")

    print(
        f"Minimum: {probabilities.min():.4f}"
    )

    print(
        f"Maximum: {probabilities.max():.4f}"
    )

    print(
        f"Mean:    {probabilities.mean():.4f}"
    )

    print(
        f"Median:  {__import__('numpy').median(probabilities):.4f}"
    )


if __name__ == "__main__":
    main()