import numpy as np
import pandas as pd
from pathlib import Path


RANDOM_STATE = 42
NUM_TRANSACTIONS = 200_000

rng = np.random.default_rng(RANDOM_STATE)


def sigmoid(x):
    return 1 / (1 + np.exp(-x))


def generate_data(n):

    # -----------------------------
    # User profile
    # -----------------------------

    account_age_days = rng.integers(
        1,
        1500,
        size=n
    )

    total_transactions = rng.poisson(
        50,
        size=n
    )

    avg_transaction_amount = rng.lognormal(
        mean=6.8,
        sigma=0.7,
        size=n
    )

    failed_transactions = rng.poisson(
        1.2,
        size=n
    )

    previous_fraud_count = rng.binomial(
        2,
        0.015,
        size=n
    )

    # -----------------------------
    # Current transaction
    # -----------------------------

    amount_multiplier = rng.lognormal(
        mean=0,
        sigma=0.8,
        size=n
    )

    amount = (
        avg_transaction_amount
        * amount_multiplier
    )

    amount = np.clip(
        amount,
        1,
        500_000
    )

    payment_method = rng.choice(
        ["ACCOUNT", "UPI"],
        size=n,
        p=[0.4, 0.6]
    )

    hour = rng.integers(
        0,
        24,
        size=n
    )

    day_of_week = rng.integers(
        0,
        7,
        size=n
    )

    new_receiver = rng.binomial(
        1,
        0.20,
        size=n
    )

    # -----------------------------
    # Velocity
    # -----------------------------

    transactions_last_24hours = rng.poisson(
        5,
        size=n
    )

    transactions_last_1hour = np.array([
        rng.binomial(
            count,
            0.15
        )
        for count in transactions_last_24hours
    ])

    transactions_last_5min = np.array([
        rng.binomial(
            count,
            0.20
        )
        for count in transactions_last_1hour
    ])

    amount_last_1hour = (
        transactions_last_1hour
        * avg_transaction_amount
        * rng.uniform(
            0.5,
            1.5,
            size=n
        )
    )

    time_since_last_transaction = rng.exponential(
        scale=3600,
        size=n
    )

    # -----------------------------
    # Engineered behavioral features
    # -----------------------------

    amount_ratio = (
        amount /
        (avg_transaction_amount + 1)
    )

    velocity_5min_ratio = (
        transactions_last_5min /
        (transactions_last_24hours + 1)
    )

    # -----------------------------
    # Fraud risk
    # -----------------------------

    risk = np.full(
        n,
        -5.0
    )

    risk += (
        np.log1p(amount_ratio)
        * 0.8
    )

    risk += (
        new_receiver
        * 0.8
    )

    risk += (
        transactions_last_5min
        * 0.30
    )

    risk += (
        transactions_last_1hour
        * 0.08
    )

    risk += (
        velocity_5min_ratio
        * 1.0
    )

    risk += (
        (account_age_days < 30)
        * 0.7
    )

    risk += (
        np.minimum(
            failed_transactions,
            5
        )
        * 0.15
    )

    risk += (
        previous_fraud_count
        * 1.2
    )

    risk += (
        ((hour <= 4) | (hour >= 23))
        * 0.35
    )

    # Interaction:
    # new receiver + unusually large amount
    risk += (
        (
            (new_receiver == 1)
            & (amount_ratio > 4)
        )
        * 1.0
    )

    # Interaction:
    # burst of payments to a new receiver
    risk += (
        (
            (new_receiver == 1)
            & (transactions_last_5min >= 3)
        )
        * 1.2
    )

    # Small amount of unexplained behavior
    risk += rng.normal(
        0,
        0.35,
        size=n
    )

    fraud_probability = sigmoid(
        risk
    )

    fraud = rng.binomial(
        1,
        fraud_probability
    )

    df = pd.DataFrame({

        "amount":
            np.round(amount, 2),

        "payment_method":
            payment_method,

        "hour":
            hour,

        "day_of_week":
            day_of_week,

        "account_age_days":
            account_age_days,

        "total_transactions":
            total_transactions,

        "avg_transaction_amount":
            np.round(
                avg_transaction_amount,
                2
            ),

        "failed_transactions":
            failed_transactions,

        "previous_fraud_count":
            previous_fraud_count,

        "transactions_last_5min":
            transactions_last_5min,

        "transactions_last_1hour":
            transactions_last_1hour,

        "transactions_last_24hours":
            transactions_last_24hours,

        "amount_last_1hour":
            np.round(
                amount_last_1hour,
                2
            ),

        "time_since_last_transaction":
            np.round(
                time_since_last_transaction,
                2
            ),

        "new_receiver":
            new_receiver,

        # engineered features
        "amount_ratio":
            np.round(
                amount_ratio,
                4
            ),

        "velocity_5min_ratio":
            np.round(
                velocity_5min_ratio,
                4
            ),

        "fraud":
            fraud
    })

    return df


def main():

    print(
        f"Generating {NUM_TRANSACTIONS:,} "
        "PayShield V2 transactions..."
    )

    df = generate_data(
        NUM_TRANSACTIONS
    )

    output = Path(
        "data/payshield_transactions_v2.csv"
    )

    df.to_csv(
        output,
        index=False
    )

    print("\nDataset shape:")
    print(df.shape)

    print("\nFraud distribution:")
    print(
        df["fraud"].value_counts()
    )

    print("\nFraud percentage:")
    print(
        df["fraud"]
        .value_counts(normalize=True)
        * 100
    )

    print("\nVelocity validation:")

    invalid_5min = (
        df["transactions_last_5min"]
        >
        df["transactions_last_1hour"]
    ).sum()

    invalid_1hour = (
        df["transactions_last_1hour"]
        >
        df["transactions_last_24hours"]
    ).sum()

    print(
        "5min > 1hour:",
        invalid_5min
    )

    print(
        "1hour > 24hours:",
        invalid_1hour
    )

    print(
        "\nSaved to:",
        output
    )


if __name__ == "__main__":
    main()