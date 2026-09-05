import xgboost as xgb

from payshield_preprocessing_v3 import (
    load_data,
    prepare_data,
    split_data
)


DATA_PATH = "data/payshield_transactions_v3.csv"
MODEL_PATH = "models/payshield_xgboost_v4.json"


def main():

    print("Loading PayShield V3 dataset...")

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

    print("\nDataset sizes:")

    print("Train:", X_train.shape)
    print("Validation:", X_validation.shape)
    print("Test:", X_test.shape)

    print("\nFraud counts:")

    print("Train:", y_train.sum())
    print("Validation:", y_validation.sum())
    print("Test:", y_test.sum())

    model = xgb.XGBClassifier(

        n_estimators=500,

        max_depth=4,

        learning_rate=0.03,

        subsample=0.8,

        colsample_bytree=0.8,

        min_child_weight=3,

        gamma=0.05,

        objective="binary:logistic",

        eval_metric="aucpr",

        random_state=42,

        n_jobs=-1,

        early_stopping_rounds=30
    )

    print(
        "\nTraining PayShield XGBoost V4..."
    )

    model.fit(

        X_train,

        y_train,

        eval_set=[
            (
                X_validation,
                y_validation
            )
        ],

        verbose=True
    )

    model.save_model(
        MODEL_PATH
    )

    print("\nBest iteration:")
    print(model.best_iteration)

    print("\nBest validation PR-AUC:")
    print(model.best_score)

    print("\nModel saved:")
    print(MODEL_PATH)


if __name__ == "__main__":
    main()