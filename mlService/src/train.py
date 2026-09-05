import joblib
from sklearn.linear_model import LogisticRegression
from preprocessing import (load_data,split_data,scale_amount)

DATA_PATH="data/creditcard.csv"
MODEL_PATH="models/logistic_model.joblib"
SCLAER_PATH="models/amount_scaler.joblib"

def main():
    print("Loading dataset...")
    df=load_data(DATA_PATH)
    print(f"Dataset shape: {df.shape}")
    (
        X_train,
        X_validation,
        X_test,
        y_train,
        y_validation,
        y_test
    ) = split_data(df)

    print("\nSplit size: ")
    print("Train:",X_train.shape)
    print("Validation",X_validation.shape)
    print("Test:",X_test.shape)
    print("\nFraud counts:")
    print("Train:",y_train.sum())
    print("Validation",y_validation.sum())
    print("Test:",y_test.sum())

    (
        X_train,
        X_validation,
        X_test,
        scaler
    )=scale_amount(
        X_train,
        X_validation,
        X_test
    )
    print("\nTraining Logistic Regression...")
    model=LogisticRegression(
        class_weight="balanced",
        max_iter=1000,
        random_state=42
    )
    model.fit(
        X_train,
        y_train
    )
    joblib.dump(
        model,
        MODEL_PATH
    )
    joblib.dump(
        scaler,
        SCLAER_PATH
    )
    print("\nModel saved:")
    print(MODEL_PATH)
    print("Scaler saved:")
    print(SCLAER_PATH)

if __name__ == "__main__":
    main()