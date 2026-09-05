import xgboost as xgb

from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    average_precision_score
)

from payshield_preprocessing import (
    load_data,
    prepare_data,
    split_data
)


MODEL_PATH = "models/payshield_xgboost_v2.json"


def main():

    print("Loading PayShield dataset...")

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

    print("Loading XGBoost V2 model...")

    model = xgb.XGBClassifier()

    model.load_model(
        MODEL_PATH
    )

    print("\nEvaluating on validation set...")

    probabilities = model.predict_proba(
        X_validation
    )[:, 1]

    predictions = (
        probabilities >= 0.5
    ).astype(int)

    print("\nClassification Report:")

    print(
        classification_report(
            y_validation,
            predictions,
            digits=4
        )
    )

    print("\nConfusion Matrix:")

    print(
        confusion_matrix(
            y_validation,
            predictions
        )
    )

    print("\nROC-AUC:")

    print(
        round(
            roc_auc_score(
                y_validation,
                probabilities
            ),
            4
        )
    )

    print("\nPR-AUC:")

    print(
        round(
            average_precision_score(
                y_validation,
                probabilities
            ),
            4
        )
    )


if __name__ == "__main__":
    main()