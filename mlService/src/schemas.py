from pydantic import BaseModel, Field


class PaymentFeatures(BaseModel):

    amount: float = Field(gt=0)

    payment_method: str

    hour: int = Field(
        ge=0,
        le=23
    )

    day_of_week: int = Field(
        ge=0,
        le=6
    )

    account_age_days: int = Field(
        ge=0
    )

    total_transactions: int = Field(
        ge=0
    )

    avg_transaction_amount: float = Field(
        ge=0
    )

    failed_transactions: int = Field(
        ge=0
    )

    previous_fraud_count: int = Field(
        ge=0
    )

    transactions_last_5min: int = Field(
        ge=0
    )

    transactions_last_1hour: int = Field(
        ge=0
    )

    transactions_last_24hours: int = Field(
        ge=0
    )

    amount_last_1hour: float = Field(
        ge=0
    )

    time_since_last_transaction: float = Field(
        ge=0
    )

    new_receiver: int = Field(
        ge=0,
        le=1
    )

    amount_ratio: float = Field(
        ge=0
    )

    velocity_5min_ratio: float = Field(
        ge=0
    )