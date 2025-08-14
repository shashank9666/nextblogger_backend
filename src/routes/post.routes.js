import { Router } from "express";
import * as ctrl from "../controllers/post.controller.js";

const router = Router();

router.get("/", ctrl.list);
router.get("/:slug", ctrl.getBySlug);
router.post("/", ctrl.create);
router.put("/:slug", ctrl.update);
router.delete("/:slug", ctrl.remove);

export default router;
