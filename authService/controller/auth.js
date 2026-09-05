import bcrypt from "bcrypt";
import authPool from "../config/auth.db.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken
} from "../services/token.service.js";


const getRefreshTokenExpiry = () => {
  const expiresIn =
    process.env.JWT_REFRESH_EXPIRES_IN || "7d";

  const match = expiresIn.match(/^(\d+)([dhm])$/);

  if (!match) {
    return new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );
  }

  const value = Number(match[1]);
  const unit = match[2];

  let milliseconds;

  if (unit === "m") {
    milliseconds = value * 60 * 1000;
  } else if (unit === "h") {
    milliseconds = value * 60 * 60 * 1000;
  } else {
    milliseconds = value * 24 * 60 * 60 * 1000;
  }

  return new Date(Date.now() + milliseconds);
};


const saveRefreshToken = async (userId, token) => {
  const tokenHash = hashToken(token);
  const expiresAt = getRefreshTokenExpiry();

  await authPool.query(
    `INSERT INTO refresh_tokens
    (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
};


const createTokenPair = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await saveRefreshToken(user.id, refreshToken);

  return {
    accessToken,
    refreshToken
  };
};


export const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      aadhaar,
      account_number
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !aadhaar ||
      !account_number
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters"
      });
    }

    const existingUser = await authPool.query(
      `SELECT id
       FROM users
       WHERE email = $1
          OR phone = $2
          OR aadhaar = $3
          OR account_number = $4`,
      [
        email,
        phone,
        aadhaar,
        account_number
      ]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message:
          "A user already exists with this information"
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const result = await authPool.query(
      `INSERT INTO users
      (
        name,
        email,
        phone,
        password_hash,
        aadhaar,
        account_number
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        name,
        email,
        phone,
        created_at`,
      [
        name,
        email,
        phone,
        passwordHash,
        aadhaar,
        account_number
      ]
    );

    const user = result.rows[0];

    const {
      accessToken,
      refreshToken
    } = await createTokenPair(user);

    return res.status(201).json({
      message: "Signup successful",
      accessToken,
      refreshToken,
      user
    });

  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      message: "Signup failed"
    });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required"
      });
    }

    const result = await authPool.query(
      `SELECT *
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message:
          "Invalid email or password"
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message:
          "Invalid email or password"
      });
    }

    const {
      accessToken,
      refreshToken
    } = await createTokenPair(user);

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed"
    });
  }
};


export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token is required"
      });
    }

    let decoded;

    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({
        message:
          "Invalid or expired refresh token"
      });
    }

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        message: "Invalid token type"
      });
    }

    const tokenHash = hashToken(refreshToken);

    const tokenResult = await authPool.query(
      `SELECT *
       FROM refresh_tokens
       WHERE token_hash = $1
         AND revoked_at IS NULL
         AND expires_at > CURRENT_TIMESTAMP`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        message:
          "Refresh token has been revoked or expired"
      });
    }

    const userId = decoded.sub;

    const userResult = await authPool.query(
      `SELECT id, name, email, phone
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    const user = userResult.rows[0];

    await authPool.query(
      `UPDATE refresh_tokens
       SET revoked_at = CURRENT_TIMESTAMP
       WHERE token_hash = $1`,
      [tokenHash]
    );

    const {
      accessToken,
      refreshToken: newRefreshToken
    } = await createTokenPair(user);

    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error("Refresh error:", error);

    return res.status(500).json({
      message: "Token refresh failed"
    });
  }
};


export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);

      await authPool.query(
        `UPDATE refresh_tokens
         SET revoked_at = CURRENT_TIMESTAMP
         WHERE token_hash = $1
           AND revoked_at IS NULL`,
        [tokenHash]
      );
    }

    return res.status(200).json({
      message: "Logout successful"
    });

  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      message: "Logout failed"
    });
  }
};