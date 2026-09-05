import numpy as np
import pandas as pd
from pathlib import Path


RANDOM_STATE = 42
NUM_TRANSACTIONS = 200_000

rng = np.random.default_rng(RANDOM_STATE)


def generate_data(n):

    # --------------------------------
    # Base user behavior
    # --------------------------------

    account_age_days = rng.integers(30, 1500, n)

    total_transactions = rng.poisson(
        60,
        n
    )

    avg_transaction_amount = rng.lognormal(
        mean=6.5,
        sigma=0.65,
        size=n
    )

    avg_transaction_amount = np.clip(
        avg_transaction_amount,
        100,
        10000
    )

    failed_transactions = rng.poisson(
        1,
        n
    )

    previous_fraud_count = rng.choice(
        [0, 1, 2],
        size=n,
        p=[0.96, 0.035, 0.005]
    )

    # --------------------------------
    # Normal transaction
    # --------------------------------

    amount = (
        avg_transaction_amount
        * rng.lognormal(
            0,
            0.35,
            n
        )
    )

    amount = np.clip(
        amount,
        10,
        100000
    )

    payment_method = rng.choice(
        ["ACCOUNT", "UPI"],
        size=n,
        p=[0.40, 0.60]
    )

    hour = rng.integers(
        0,
        24,
        n
    )

    day_of_week = rng.integers(
        0,
        7,
        n
    )

    new_receiver = rng.binomial(
        1,
        0.15,
        n
    )

    # --------------------------------
    # Transaction velocity
    # --------------------------------

    transactions_last_24hours = rng.poisson(
        5,
        n
    )

    transactions_last_1hour = np.array([
        rng.binomial(
            x,
            0.25
        )
        for x in transactions_last_24hours
    ])

    transactions_last_5min = np.array([
        rng.binomial(
            x,
            0.25
        )
        for x in transactions_last_1hour
    ])

    amount_last_1hour = (
        transactions_last_1hour
        * avg_transaction_amount
        * rng.uniform(
            0.6,
            1.4,
            n
        )
    )

    time_since_last_transaction = (
        rng.exponential(
            3600,
            n
        )
    )

    # --------------------------------
    # Behavioral features
    # --------------------------------

    amount_ratio = (
        amount /
        (avg_transaction_amount + 1)
    )

    velocity_5min_ratio = (
        transactions_last_5min /
        (transactions_last_24hours + 1)
    )

    # --------------------------------
    # Fraud scenario selection
    # --------------------------------

    scenario = rng.choice(
        [
            "normal",
            "large_amount",
            "new_receiver",
            "velocity",
            "new_account",
            "previous_fraud",
            "combined"
        ],
        size=n,
        p=[
            0.88,
            0.025,
            0.02,
            0.025,
            0.015,
            0.015,
            0.02
        ]
    )

    fraud = np.zeros(n, dtype=int)

    # --------------------------------
    # Scenario 1:
    # Large unusual transaction
    # --------------------------------

    mask = (
        scenario == "large_amount"
    )

    amount[mask] = (
        avg_transaction_amount[mask]
        * rng.uniform(
            5,
            15,
            mask.sum()
        )
    )

    fraud[mask] = (
        rng.random(mask.sum())
        < 0.70
    )

    # --------------------------------
    # Scenario 2:
    # New receiver
    # --------------------------------

    mask = (
        scenario == "new_receiver"
    )

    new_receiver[mask] = 1

    amount[mask] = (
        avg_transaction_amount[mask]
        * rng.uniform(
            2,
            6,
            mask.sum()
        )
    )

    fraud[mask] = (
        rng.random(mask.sum())
        < 0.60
    )

    # --------------------------------
    # Scenario 3:
    # Velocity attack
    # --------------------------------

    mask = (
        scenario == "velocity"
    )

    transactions_last_24hours[mask] = rng.integers(
        10,
        30,
        mask.sum()
    )

    transactions_last_1hour[mask] = rng.integers(
        5,
        15,
        mask.sum()
    )

    transactions_last_5min[mask] = rng.integers(
        3,
        8,
        mask.sum()
    )

    amount_last_1hour[mask] = (
        transactions_last_1hour[mask]
        * avg_transaction_amount[mask]
    )

    fraud[mask] = (
        rng.random(mask.sum())
        < 0.75
    )

    # --------------------------------
    # Scenario 4:
    # New account
    # --------------------------------

    mask = (
        scenario == "new_account"
    )

    account_age_days[mask] = rng.integers(
        1,
        30,
        mask.sum()
    )

    amount[mask] = (
        avg_transaction_amount[mask]
        * rng.uniform(
            2,
            8,
            mask.sum()
        )
    )

    new_receiver[mask] = rng.binomial(
        1,
        0.70,
        mask.sum()
    )

    fraud[mask] = (
        rng.random(mask.sum())
        < 0.65
    )

    # --------------------------------
    # Scenario 5:
    # Previous fraud
    # --------------------------------

    mask = (
        scenario == "previous_fraud"
    )

    previous_fraud_count[mask] = rng.integers(
        1,
        3,
        mask.sum()
    )

    amount[mask] = (
        avg_transaction_amount[mask]
        * rng.uniform(
            2,
            7,
            mask.sum()
        )
    )

    fraud[mask] = (
        rng.random(mask.sum())
        < 0.70
    )

    # --------------------------------
    # Scenario 6:
    # Combined attack
    # --------------------------------

    mask = (
        scenario == "combined"
    )

    account_age_days[mask] = rng.integers(
        1,
        45,
        mask.sum()
    )

    new_receiver[mask] = 1

    transactions_last_24hours[mask] = rng.integers(
        8,
        25,
        mask.sum()
    )

    transactions_last_1hour[mask] = rng.integers(
        4,
        12,
        mask.sum()
    )

    transactions_last_5min[mask] = rng.integers(
        2,
        7,
        mask.sum()
    )

    amount[mask] = (
        avg_transaction_amount[mask]
        * rng.uniform(
            5,
            15,
            mask.sum()
        )
    )

    previous_fraud_count[mask] = rng.integers(
        0,
        3,
        mask.sum()
    )

    fraud[mask] = (
        rng.random(mask.sum())
        < 0.90
    )

    # --------------------------------
    # Recalculate engineered features
    # --------------------------------

    amount_ratio = (
        amount /
        (avg_transaction_amount + 1)
    )

    velocity_5min_ratio = (
        transactions_last_5min /
        (transactions_last_24hours + 1)
    )

    # --------------------------------
    # Add small amount of label noise
    # --------------------------------

    noise_mask = (
        rng.random(n) < 0.015
    )

    fraud[noise_mask] = (
        1 -
        fraud[noise_mask]
    )

    # --------------------------------
    # Build dataframe
    # --------------------------------

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
        "PayShield V3 transactions..."
    )

    df = generate_data(
        NUM_TRANSACTIONS
    )

    output = Path(
        "data/payshield_transactions_v3.csv"
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

    print("\nSaved to:")
    print(output)


if __name__ == "__main__":
    main()