const express = require("express");

const router = express.Router();

const blogController = require('../controllers/blog.controller');

router.get("/", blogController.getAllBlogs);

router.get('/:id',blogController.getOneBlog)

router.post('/', blogController.createBlog);

router.delete('/:id', blogController.deleteBlog);

router.put('/:id',blogController.updateBlog);

module.exports = router;
