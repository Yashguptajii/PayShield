CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_reference VARCHAR(50) UNIQUE NOT NULL,
    idempotency_key UUID UNIQUE,
    user_id UUID NOT NULL,
    receiver_identifier VARCHAR(100) NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'ACCOUNT'
        CHECK (
            payment_method IN ('ACCOUNT', 'UPI')
        ),
    amount NUMERIC(15, 2) NOT NULL
        CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    description VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'PROCESSING',
                'RISK_CHECK',
                'COMPLETED',
                'FAILED',
                'BLOCKED'
            )
        ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    payment_id UUID NOT NULL
        REFERENCES payments(id)
        ON DELETE CASCADE,

    event_type VARCHAR(50) NOT NULL,

    previous_status VARCHAR(20),

    new_status VARCHAR(20),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_events_payment_id
ON payment_events(payment_id);

CREATE TABLE payment_risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    payment_id UUID NOT NULL
        REFERENCES payments(id)
        ON DELETE CASCADE,

    risk_score NUMERIC(6, 5) NOT NULL
        CHECK (risk_score >= 0 AND risk_score <= 1),

    risk_level VARCHAR(20) NOT NULL
        CHECK (
            risk_level IN ('LOW', 'MEDIUM', 'HIGH')
        ),

    decision VARCHAR(20) NOT NULL
        CHECK (
            decision IN ('ALLOW', 'REVIEW', 'BLOCK')
        ),

    model_version VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(payment_id)
);

CREATE INDEX idx_payment_risk_payment_id
ON payment_risk_assessments(payment_id);

CREATE TABLE processed_events (
    event_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    consumer_name VARCHAR(100) NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (event_id, consumer_name)
);