import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

def load_data(path):
    df = pd.read_csv(path)
    if df.isnull().sum().sum() > 0:
        raise ValueError("Dataset contains missing values")
    return df

def split_data(df):
    X=df.drop(columns=["Class"])
    y=df["Class"]

    X_train,X_temp,y_train,y_temp = train_test_split(
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
def scale_amount(
    X_train,
    X_validation,
    X_test
):

    scaler = StandardScaler()

    X_train = X_train.copy()
    X_validation = X_validation.copy()
    X_test = X_test.copy()

    X_train["Amount"] = scaler.fit_transform(
        X_train[["Amount"]]
    ).ravel()

    X_validation["Amount"] = scaler.transform(
        X_validation[["Amount"]]
    ).ravel()

    X_test["Amount"] = scaler.transform(
        X_test[["Amount"]]
    ).ravel()

    return (
        X_train,
        X_validation,
        X_test,
        scaler
    )
