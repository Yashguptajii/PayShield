import joblib
import xgboost as xgb

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

    print("\nTraining data:")
    print(X_train.shape)

    print("\nFraud count:")
    print(y_train.sum())

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

    print("\nTraining XGBoost...")

    model.fit(
        X_train,
        y_train,
        eval_set=[
            (X_validation, y_validation)
        ],
        verbose=True
    )

    model.save_model(MODEL_PATH)

    print("\nXGBoost model saved:")
    print(MODEL_PATH)


if __name__ == "__main__":
    main()