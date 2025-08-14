import { Router } from "express";
import * as ctrl from "../controllers/post.controller.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";
import { createPostLimiter } from "../middleware/rateLimiting.js";

const router = Router();

// Public routes (no authentication required)
router.get("/", optionalAuth, ctrl.list);
router.get("/:slug", optionalAuth, ctrl.getBySlug);

// Protected routes (authentication required)
router.post("/", authenticate, createPostLimiter, ctrl.create);
router.put("/:slug/like", authenticate, ctrl.toggleLike);
router.put("/:slug/bookmark", authenticate, ctrl.toggleBookmark);
router.post("/:slug/comments", authenticate, ctrl.addComment);

// TODO: Add these routes when you create the functions
// router.put("/:slug", authenticate, ctrl.update);     // Create update function later
// router.delete("/:slug", authenticate, ctrl.remove);  // Create remove function later

export default router;
