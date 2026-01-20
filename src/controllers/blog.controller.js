const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

// helper: validate ObjectId
const isValidId = (id) => ObjectId.isValid(id);

/* =========================
   GET ALL BLOGS
========================= */
exports.getAllBlogs = async (req, res) => {
  try {
    const db = getDB();
    const blogs = db.collection("blogs");

    const allBlogs = await blogs.find().toArray();
    res.status(200).json(allBlogs);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
};

/* =========================
   GET ONE BLOG
========================= */
exports.getOneBlog = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    const db = getDB();
    const blogs = db.collection("blogs");

    const blog = await blogs.findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json(blog);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch blog" });
  }
};

/* =========================
   CREATE BLOG
========================= */
exports.createBlog = async (req, res) => {
  try {
    const { title, content, author } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const db = getDB();
    const blogs = db.collection("blogs");

    const newBlog = {
      title,
      content,
      author: author || "Anonymous",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await blogs.insertOne(newBlog);

    res.status(201).json({
      message: "Blog created successfully",
      blogId: result.insertedId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create blog" });
  }
};

/* =========================
   UPDATE BLOG
========================= */
exports.updateBlog = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    const db = getDB();
    const blogs = db.collection("blogs");

    // only update provided fields
    const updatedData = {
      ...(req.body.title && { title: req.body.title }),
      ...(req.body.content && { content: req.body.content }),
      ...(req.body.author && { author: req.body.author }),
      updatedAt: new Date()
    };

    const result = await blogs.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({ message: "Blog updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update blog" });
  }
};

/* =========================
   DELETE BLOG
========================= */
exports.deleteBlog = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    const db = getDB();
    const blogs = db.collection("blogs");

    const result = await blogs.deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({ message: "Blog deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete blog" });
  }
};

/* =========================
   SEARCH BLOGS
========================= */
exports.searchBlogs = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const db = getDB();
    const blogs = db.collection("blogs");

    const results = await blogs.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } }
      ]
    }).toArray();

    res.status(200).json(results);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Search failed" });
  }
};
