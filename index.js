import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import { connect } from "./src/config/db.js";
import postRoutes from "./src/routes/post.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import { errorHandler, notFound } from "./src/middleware/error.js";

dotenv.config();
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*"
}));
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Routes
console.log("✅ Mounting routes: /api/posts, /api/users");
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);

// 404 and error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 4000);

console.log("🔗 Connecting to:", process.env.MONGODB_URI);
connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
