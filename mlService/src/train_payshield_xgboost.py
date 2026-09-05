import xgboost as xgb
import joblib

from payshield_preprocessing import (
    load_data,
    prepare_data,
    split_data,
    scale_features
)


MODEL_PATH = "models/payshield_xgboost.json"
SCALER_PATH = "models/payshield_scaler.joblib"


def main():

    print("Loading PayShield dataset...")

    df = load_data()

    print(
        f"Dataset shape: {df.shape}"
    )

    X, y = prepare_data(df)

    (
        X_train,
        X_validation,
        X_test,
        y_train,
        y_validation,
        y_test
    ) = split_data(X, y)

    print("\nSplit sizes:")

    print("Train:", X_train.shape)
    print("Validation:", X_validation.shape)
    print("Test:", X_test.shape)

    print("\nFraud counts:")

    print("Train:", y_train.sum())
    print("Validation:", y_validation.sum())
    print("Test:", y_test.sum())

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

    negative_count = (y_train == 0).sum()
    positive_count = (y_train == 1).sum()

    scale_pos_weight = (
        negative_count / positive_count
    )

    print("\nScale positive weight:")
    print(scale_pos_weight)

    model = xgb.XGBClassifier(

        n_estimators=300,

        max_depth=5,

        learning_rate=0.05,

        subsample=0.8,

        colsample_bytree=0.8,

        objective="binary:logistic",

        eval_metric="aucpr",

        scale_pos_weight=scale_pos_weight,

        random_state=42,

        n_jobs=-1
    )

    print("\nTraining PayShield XGBoost...")

    model.fit(
        X_train,
        y_train,

        eval_set=[
            (X_validation, y_validation)
        ],

        verbose=True
    )

    model.save_model(
        MODEL_PATH
    )

    joblib.dump(
        scaler,
        SCALER_PATH
    )

    print("\nPayShield XGBoost model saved:")
    print(MODEL_PATH)

    print("\nPayShield scaler saved:")
    print(SCALER_PATH)


if __name__ == "__main__":
    main()