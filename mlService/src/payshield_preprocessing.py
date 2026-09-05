import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


DATA_PATH = "data/payshield_transactions.csv"


def load_data():

    df = pd.read_csv(DATA_PATH)

    if df.isnull().sum().sum() > 0:
        raise ValueError("Dataset contains missing values")

    return df


def prepare_data(df):

    X = df.drop(columns=["fraud"])
    y = df["fraud"]

    X["payment_method"] = (
        X["payment_method"]
        .map({
            "ACCOUNT": 0,
            "UPI": 1
        })
    )

    return X, y


def split_data(X, y):

    X_train, X_temp, y_train, y_temp = train_test_split(
        X,
        y,
        test_size=0.30,
        stratify=y,
        random_state=42
    )

    X_validation, X_test, y_validation, y_test = train_test_split(
        X_temp,
        y_temp,
        test_size=0.50,
        stratify=y_temp,
        random_state=42
    )

    return (
        X_train,
        X_validation,
        X_test,
        y_train,
        y_validation,
        y_test
    )


def scale_features(
    X_train,
    X_validation,
    X_test
):

    scaler = StandardScaler()

    numeric_columns = [
        "amount",
        "account_age_days",
        "total_transactions",
        "avg_transaction_amount",
        "failed_transactions",
        "previous_fraud_count",
        "transactions_last_5min",
        "transactions_last_1hour",
        "transactions_last_24hours",
        "amount_last_1hour",
        "time_since_last_transaction"
    ]

    X_train = X_train.copy()
    X_validation = X_validation.copy()
    X_test = X_test.copy()

    X_train[numeric_columns] = scaler.fit_transform(
        X_train[numeric_columns]
    )

    X_validation[numeric_columns] = scaler.transform(
        X_validation[numeric_columns]
    )

    X_test[numeric_columns] = scaler.transform(
        X_test[numeric_columns]
    )

    return (
        X_train,
        X_validation,
        X_test,
        scaler
    )