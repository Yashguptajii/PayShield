import numpy as np
import pandas as pd

from pathlib import Path


RANDOM_STATE = 42
NUM_TRANSACTIONS = 200_000

np.random.seed(RANDOM_STATE)


def generate_data(n):

    data = {}

    # -----------------------------
    # Transaction features
    # -----------------------------

    data["amount"] = np.round(
        np.random.lognormal(
            mean=7.0,
            sigma=1.0,
            size=n
        ),
        2
    )

    data["payment_method"] = np.random.choice(
        ["ACCOUNT", "UPI"],
        size=n,
        p=[0.4, 0.6]
    )

    data["hour"] = np.random.randint(
        0,
        24,
        size=n
    )

    data["day_of_week"] = np.random.randint(
        0,
        7,
        size=n
    )

    # -----------------------------
    # User-history features
    # -----------------------------

    data["account_age_days"] = np.random.randint(
        1,
        1500,
        size=n
    )

    data["total_transactions"] = np.random.poisson(
        lam=40,
        size=n
    )

    data["avg_transaction_amount"] = np.round(
        np.random.lognormal(
            mean=6.5,
            sigma=0.8,
            size=n
        ),
        2
    )

    data["failed_transactions"] = np.random.poisson(
        lam=2,
        size=n
    )

    data["previous_fraud_count"] = np.random.poisson(
        lam=0.05,
        size=n
    )

    # -----------------------------
    # Velocity features
    # -----------------------------

    data["transactions_last_5min"] = np.random.poisson(
        lam=0.5,
        size=n
    )

    data["transactions_last_1hour"] = np.random.poisson(
        lam=2,
        size=n
    )

    data["transactions_last_24hours"] = np.random.poisson(
        lam=8,
        size=n
    )

    data["amount_last_1hour"] = np.round(
        np.random.lognormal(
            mean=7.0,
            sigma=1.0,
            size=n
        ),
        2
    )

    data["time_since_last_transaction"] = np.random.exponential(
        scale=3600,
        size=n
    )

    # -----------------------------
    # Receiver feature
    # -----------------------------

    data["new_receiver"] = np.random.binomial(
        1,
        0.25,
        size=n
    )

    df = pd.DataFrame(data)

    # -----------------------------
    # Synthetic fraud mechanism
    # -----------------------------

    fraud_score = np.zeros(n)

    # High transaction amount
    fraud_score += np.where(
        df["amount"] > 50000,
        2.5,
        0
    )

    fraud_score += np.where(
        df["amount"] > 100000,
        2.0,
        0
    )

    # New receiver
    fraud_score += (
        df["new_receiver"] * 1.5
    )

    # High transaction velocity
    fraud_score += np.where(
        df["transactions_last_5min"] >= 4,
        2.0,
        0
    )

    fraud_score += np.where(
        df["transactions_last_1hour"] >= 8,
        1.5,
        0
    )

    # Large recent spending
    fraud_score += np.where(
        df["amount_last_1hour"] > 50000,
        1.5,
        0
    )

    # Very new account
    fraud_score += np.where(
        df["account_age_days"] < 30,
        1.5,
        0
    )

    # Failed transaction history
    fraud_score += np.where(
        df["failed_transactions"] >= 5,
        1.0,
        0
    )

    # Previous fraud
    fraud_score += (
        df["previous_fraud_count"] * 2.0
    )

    # Unusual hours
    fraud_score += np.where(
        (df["hour"] <= 4),
        0.8,
        0
    )

    # High amount compared with user's average
    amount_ratio = (
        df["amount"] /
        (df["avg_transaction_amount"] + 1)
    )

    fraud_score += np.where(
        amount_ratio > 10,
        1.5,
        0
    )

    # Add randomness so the model
    # cannot perfectly memorize the rules
    fraud_score += np.random.normal(
        0,
        1.0,
        size=n
    )

    # Convert score into probability
    fraud_probability = 1 / (
        1 + np.exp(-(
            fraud_score - 5.0
        ))
    )

    df["fraud"] = np.random.binomial(
        1,
        fraud_probability
    )

    return df


def main():

    print(
        f"Generating {NUM_TRANSACTIONS:,} transactions..."
    )

    df = generate_data(
        NUM_TRANSACTIONS
    )

    output_path = Path(
        "data/payshield_transactions.csv"
    )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    df.to_csv(
        output_path,
        index=False
    )

    print("\nDataset generated.")

    print(
        f"Shape: {df.shape}"
    )

    print("\nFraud distribution:")

    print(
        df["fraud"].value_counts()
    )

    print("\nFraud percentage:")

    print(
        df["fraud"]
        .value_counts(
            normalize=True
        )
        * 100
    )

    print("\nSample:")

    print(
        df.head()
    )

    print(
        f"\nSaved to: {output_path}"
    )


if __name__ == "__main__":
    main()