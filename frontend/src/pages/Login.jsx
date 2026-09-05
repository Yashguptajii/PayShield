import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
        const response = await fetch("http://localhost:8000/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        window.location.href = "/";
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        setError(error.message);
    }
};

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 flex flex-col items-center justify-start overflow-hidden">

      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300/30 rounded-full blur-3xl"></div>

      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/40 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>

      <form
        onSubmit={handleLogin}
        className="relative z-10 w-[90%] max-w-[400px] mt-20 backdrop-blur-lg bg-white/30 border border-white/40 shadow-2xl rounded-xl flex flex-col justify-center gap-6 p-8"
      >

        <h1 className="text-blue-700 text-3xl font-bold text-center mb-4">
          Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full h-[50px] border border-blue-300 text-gray-800 text-lg px-4 rounded-md bg-white/60 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-gray-700 mt-4">
          Want to create new account?{" "}

          <span
            onClick={() => navigate("/signup")}
            className="text-blue-600 font-semibold cursor-pointer hover:underline"
          >
            Sign Up
          </span>
        </p>

      </form>
    </div>
  );
}