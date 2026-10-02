import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import pool from "../config/database.js";
import { env } from "../config/env.js";
import { authenticate } from "../middleware/auth.js";
import type { AuthRequest } from "../types/auth.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);

    const result = await pool.query(
      `SELECT id, email, password_hash, name, role, is_active
       FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [body.email]
    );

    const user = result.rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(body.password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, details)
       VALUES ($1, 'LOGIN', 'USER', $2)`,
      [user.id, JSON.stringify({ email: user.email })]
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: payload
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", authenticate, async (req: AuthRequest, res) => {
  res.json({ success: true, user: req.user });
});

export default router;