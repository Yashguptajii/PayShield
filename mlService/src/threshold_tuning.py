import xgboost as xgb

from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

from preprocessing import (
    load_data,
    split_data
)


DATA_PATH = "data/creditcard.csv"
MODEL_PATH = "models/xgboost_model.json"


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

    print("Loading XGBoost model...")

    model = xgb.XGBClassifier()

    model.load_model(MODEL_PATH)

    probabilities = model.predict_proba(
        X_validation
    )[:, 1]

    thresholds = [
        0.10,
        0.20,
        0.30,
        0.40,
        0.50,
        0.60,
        0.70,
        0.80,
        0.90
    ]

    print("\nThreshold Analysis")
    print("-" * 80)

    print(
        f"{'Threshold':<12}"
        f"{'Precision':<12}"
        f"{'Recall':<12}"
        f"{'F1':<12}"
        f"{'FP':<10}"
        f"{'FN':<10}"
    )

    print("-" * 80)

    for threshold in thresholds:

        predictions = (
            probabilities >= threshold
        ).astype(int)

        precision = precision_score(
            y_validation,
            predictions,
            zero_division=0
        )

        recall = recall_score(
            y_validation,
            predictions,
            zero_division=0
        )

        f1 = f1_score(
            y_validation,
            predictions,
            zero_division=0
        )

        tn, fp, fn, tp = confusion_matrix(
            y_validation,
            predictions
        ).ravel()

        print(
            f"{threshold:<12.2f}"
            f"{precision:<12.4f}"
            f"{recall:<12.4f}"
            f"{f1:<12.4f}"
            f"{fp:<10}"
            f"{fn:<10}"
        )


if __name__ == "__main__":
    main()