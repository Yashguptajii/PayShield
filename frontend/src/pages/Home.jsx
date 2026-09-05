import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000";

export default function HomePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [amount, setAmount] = useState("");
  const [receiverIdentifier, setReceiverIdentifier] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const getToken = () => {
    return localStorage.getItem("accessToken");
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const pollPaymentStatus = async (paymentId) => {
  const token = getToken();

  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      const response = await fetch(
        `${API_URL}/api/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to get payment"
        );
      }

      setPayment(data.payment);

      if (
        data.payment.status === "COMPLETED" ||
        data.payment.status === "FAILED" ||
        data.payment.status === "BLOCKED"
      ) {
        setStatus(data.payment.status);
        setLoading(false);
        return;
      }

      setStatus(data.payment.status);

      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      );

    } catch (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
  }

  setLoading(false);
  setError(
    "Payment processing timed out. Check payment status later."
  );
};

  const handlePayment = async (e) => {
    e.preventDefault();

    setError("");
    setPayment(null);
    setStatus("");

    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }

    if (!receiverIdentifier) {
      setError("Enter account number or UPI ID");
      return;
    }

    const token = getToken();

    if (!token || !user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setStatus("CREATING PAYMENT");

    const idempotencyKey = crypto.randomUUID();

    try {
      const response = await fetch(
        `${API_URL}/api/payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "Idempotency-Key": idempotencyKey
          },
          body: JSON.stringify({
            userId: user.id,
            receiverIdentifier,
            amount: Number(amount),
            currency: "INR",
            description: "PayShield frontend transaction"
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Payment creation failed"
        );
      }

      const createdPayment = data.payment;

      setPayment(createdPayment);
      setStatus(createdPayment.status);

      await pollPaymentStatus(createdPayment.id);

    } catch (error) {
      console.error(error);
      setError(error.message);
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">

      {/* Navbar */}

      <header className="bg-gradient-to-r from-blue-600 to-blue-400 px-6 py-4 flex justify-between items-center shadow-lg">

        <h1 className="text-3xl font-extrabold text-white tracking-wide">
          PayShield
        </h1>

        <div className="flex items-center space-x-4">

          <span className="text-white hidden md:block">
            {user.name}
          </span>

          <button
            onClick={handleLogout}
            className="bg-white text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition"
          >
            Sign Out
          </button>

        </div>

      </header>

      {/* Main */}

      <main className="flex-grow flex items-center justify-center p-6">

        <div className="w-full max-w-lg">

          <div className="bg-white shadow-xl rounded-xl p-10 border border-blue-200">

            <h2 className="text-2xl font-bold text-blue-700 mb-2 text-center">
              💳 Perform Transaction
            </h2>

            <p className="text-gray-500 text-center mb-6">
              Secure payment powered by PayShield Risk Engine
            </p>

            <form
              onSubmit={handlePayment}
              className="space-y-6"
            >

              <div>
                <label className="block text-blue-700 font-medium mb-2">
                  Amount
                </label>

                <input
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-blue-700 font-medium mb-2">
                  Account No. / UPI ID
                </label>

                <input
                  type="text"
                  placeholder="Enter account number or UPI ID"
                  value={receiverIdentifier}
                  onChange={(e) =>
                    setReceiverIdentifier(e.target.value)
                  }
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading
                  ? "Processing Payment..."
                  : "💰 Submit Money"}
              </button>

            </form>

            {/* Status */}

            {status && (
              <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-center">

                <p className="text-sm text-gray-500">
                  Payment Status
                </p>

                <p className="text-xl font-bold text-blue-700">
                  {status}
                </p>

              </div>
            )}

            {/* Error */}

            {error && (
              <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
                {error}
              </div>
            )}

            {/* Final Result */}

            {payment &&
              ["COMPLETED", "FAILED", "BLOCKED"].includes(
                payment.status
              ) && (
                <div className="mt-6 p-6 rounded-xl bg-gray-50 border border-gray-200">

                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Payment Result
                  </h3>

                  <div className="space-y-3">

                    <div className="flex justify-between">
                      <span>Amount</span>
                      <strong>
                        ₹{payment.amount}
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span>Receiver</span>
                      <strong>
                        {payment.receiver_identifier}
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span>Status</span>
                      <strong>
                        {payment.status}
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span>Transaction</span>
                      <strong className="text-xs">
                        {payment.transaction_reference}
                      </strong>
                    </div>

                  </div>

                </div>
              )}

          </div>

        </div>

      </main>

    </div>
  );
}