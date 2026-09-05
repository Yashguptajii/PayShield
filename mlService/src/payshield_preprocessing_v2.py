import pandas as pd

from sklearn.model_selection import train_test_split


DATA_PATH = "data/payshield_transactions_v2.csv"


def load_data():

    df = pd.read_csv(DATA_PATH)

    if df.isnull().sum().sum() > 0:
        raise ValueError(
            "Dataset contains missing values"
        )

    return df


def prepare_data(df):

    X = df.drop(
        columns=["fraud"]
    )

    y = df["fraud"]

    X["payment_method"] = (
        X["payment_method"]
        .map({
            "ACCOUNT": 0,
            "UPI": 1
        })
    )

    if X["payment_method"].isnull().any():
        raise ValueError(
            "Unknown payment method found"
        )

    return X, y


def split_data(X, y):

    X_train, X_temp, y_train, y_temp = (
        train_test_split(
            X,
            y,
            test_size=0.30,
            stratify=y,
            random_state=42
        )
    )

    X_validation, X_test, y_validation, y_test = (
        train_test_split(
            X_temp,
            y_temp,
            test_size=0.50,
            stratify=y_temp,
            random_state=42
        )
    )

    return (
        X_train,
        X_validation,
        X_test,
        y_train,
        y_validation,
        y_test
    )