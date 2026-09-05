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
    split_data,
    scale_features
)


MODEL_PATH = "models/payshield_xgboost.json"


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

    (
        X_train,
        X_validation,
        X_test,
        scaler
    ) = scale_features(
        X_train,
        X_validation,
        X_test
    )

    print("Loading XGBoost model...")

    model = xgb.XGBClassifier()

    model.load_model(MODEL_PATH)

    print("\nEvaluating on validation set...")

    predictions = model.predict(
        X_validation
    )

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

    print(
        confusion_matrix(
            y_validation,
            predictions
        )
    )

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