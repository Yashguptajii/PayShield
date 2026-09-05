import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    aadhaar: "",
    email: "",
    password: "",
    account_number: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 flex flex-col items-center justify-start overflow-auto py-10">

      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300/30 rounded-full blur-3xl"></div>

      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

      <form
        onSubmit={handleSignup}
        className="relative z-10 w-[90%] max-w-[450px] backdrop-blur-lg bg-white/30 border border-white/40 shadow-2xl rounded-xl flex flex-col gap-5 p-8"
      >

        <h1 className="text-blue-700 text-3xl font-bold text-center mb-4">
          Sign Up
        </h1>

        <input
          name="name"
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full h-[50px] border border-blue-300 text-gray-800 text-lg px-4 rounded-md bg-white/60 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />

        <input
          name="phone"
          type="tel"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          required
          className="w-full h-[50px] border border-blue-300 text-gray-800 text-lg px-4 rounded-md bg-white/60 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />

        <input
          name="aadhaar"
          type="text"
          placeholder="Aadhaar"
          value={form.aadhaar}
          onChange={handleChange}
          required
          className="w-full h-[50px] border border-blue-300 text-gray-800 text-lg px-4 rounded-md bg-white/60 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full h-[50px] border border-blue-300 text-gray-800 text-lg px-4 rounded-md bg-white/60 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          minLength={6}
          className="w-full h-[50px] border border-blue-300 text-gray-800 text-lg px-4 rounded-md bg-white/60 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />

        <input
          name="account_number"
          type="text"
          placeholder="Account Number"
          value={form.account_number}
          onChange={handleChange}
          required
          className="w-full h-[50px] border border-blue-300 text-gray-800 text-lg px-4 rounded-md bg-white/60 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[50px] rounded-full bg-gradient-to-r from-blue-600 to-blue-400 text-white font-semibold shadow-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <p className="text-center text-gray-700 mt-4">
          Already have an account?{" "}

          <span
            onClick={() => navigate("/login")}
            className="text-blue-600 font-semibold cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>

      </form>
    </div>
  );
}