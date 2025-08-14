import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { connect } from "./src/config/db.js";
import postRoutes from "./src/routes/post.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import analyticsRoutes from "./src/routes/analytics.routes.js";
import { errorHandler, notFound } from "./src/middleware/error.js";
import { generalLimiter } from "./src/middleware/rateLimiting.js";
import { requestLogger, consoleLogger } from "./src/middleware/logging.js";

dotenv.config();

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
  credentials: true
}));

// Rate limiting
app.use(generalLimiter);

// Logging
app.use(requestLogger);
app.use(consoleLogger);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get("/health", (_req, res) => res.json({ 
  ok: true, 
  timestamp: new Date().toISOString(),
  uptime: process.uptime()
}));

// API Routes
console.log("✅ Mounting routes: /api/auth, /api/posts, /api/users, /api/analytics");
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);

// 404 and error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 4000);

console.log("🔗 Connecting to:", process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***@'));

connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 NextBlogger API running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
