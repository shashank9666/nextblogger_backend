const express = require("express");
const router = express.Router();

const blogController = require("../controllers/blog.controller");

// GET all blogs
router.get("/", blogController.getAllBlogs);

// SEARCH blogs
router.get("/search", blogController.searchBlogs);

// GET one blog
router.get("/:id", blogController.getOneBlog);

// CREATE blog
router.post("/", blogController.createBlog);

// UPDATE blog
router.put("/:id", blogController.updateBlog);

// DELETE blog
router.delete("/:id", blogController.deleteBlog);

module.exports = router;
