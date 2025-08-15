// src/routes/auth.routes.js
import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { authLimiter } from "../middleware/rateLimiting.js";

const router = Router();

// POST /api/auth/register
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password, avatarUrl } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const user = await User.create({ name, email, password, avatarUrl, isVerified: true });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE_TIME || "15m" });
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email /*, password*/ } = req.body;
    if (!email) return res.status(400).json({ message: "email is required" });
    // For demo purposes: find existing user by email; in real app verify password hash
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE_TIME || "15m" });
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const header = req.header("Authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Access token required" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password -refreshToken");
    if (!user) return res.status(401).json({ message: "Invalid token" });
    res.json(user);
  } catch (e) {
    res.status(401).json({ message: "Invalid token" });
  }
});

export default router;
