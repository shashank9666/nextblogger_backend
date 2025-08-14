import Post from "../models/post.model.js";
import User from "../models/user.model.js"; // Import User model for auto-creation
import { makeSlug } from "../utils/slugify.js";
import mongoose from "mongoose";

// ================== LIST POSTS ==================
export const list = async (_req, res) => {
  try {
    const posts = await Post.find({ published: true })
      .sort({ createdAt: -1 })
      .populate("authorId", "name email avatarUrl") // populate author details
      .lean();

    // Map populated authorId to author, and keep ID separately
    const postsWithAuthor = posts.map(p => ({
      ...p,
      author: p.authorId, // populated user object
      authorId: p.authorId?._id, // keep only ID string
    }));

    res.json(postsWithAuthor);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ================== GET SINGLE POST BY SLUG ==================
export const getBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug })
      .populate("authorId", "name email avatarUrl")
      .lean();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Move populated authorId object to author
    const postWithAuthor = {
      ...post,
      author: post.authorId,
      authorId: post.authorId?._id,
    };

    res.json(postWithAuthor);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ================== CREATE POST ==================
export const create = async (req, res) => {
  try {
    const {
      title,
      content,
      tags = [],
      authorId,
      published = false,
      excerpt,
      category
    } = req.body;

    // ✅ Auto-create user if not found
    let actualAuthorId = authorId;
    if (authorId && !mongoose.Types.ObjectId.isValid(authorId)) {
      // Try to find user by name
      let user = await User.findOne({ name: authorId });
      if (!user) {
        // Create new user if not found
        user = await User.create({
          name: authorId,
          email: `${authorId.toLowerCase().replace(/\s+/g, '')}@example.com`, // Generate email
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      actualAuthorId = user._id;
    }

    // ✅ Validation
    if (!title || !content || !actualAuthorId) {
      return res
        .status(400)
        .json({ message: "title, content, and authorId are required" });
    }

    const slug = makeSlug(title);
    const exists = await Post.findOne({ slug });
    if (exists) {
      return res
        .status(409)
        .json({ message: "A post with this title already exists" });
    }

    // Create the post with resolved authorId
    const post = await Post.create({
      title,
      slug,
      content,
      tags,
      authorId: actualAuthorId, // Use the resolved ObjectId
      published,
      excerpt,
      category
    });

    // ✅ Populate author for consistency with other endpoints
    const postWithAuthor = await Post.findById(post._id)
      .populate("authorId", "name email avatarUrl")
      .lean();

    // Return with author object for consistency
    res.status(201).json({
      ...postWithAuthor,
      author: postWithAuthor.authorId,
      authorId: postWithAuthor.authorId?._id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ================== UPDATE POST ==================
export const update = async (req, res) => {
  try {
    const { title, authorId, ...rest } = req.body;
    const updateData = { ...rest };

    // Handle authorId if it's being updated
    if (authorId) {
      if (!mongoose.Types.ObjectId.isValid(authorId)) {
        // Try to find user by name
        let user = await User.findOne({ name: authorId });
        if (!user) {
          // Create new user if not found
          user = await User.create({
            name: authorId,
            email: `${authorId.toLowerCase().replace(/\s+/g, '')}@example.com`,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        updateData.authorId = user._id;
      } else {
        updateData.authorId = authorId;
      }
    }

    if (title) {
      updateData.title = title;
      updateData.slug = makeSlug(title);
    }

    const post = await Post.findOneAndUpdate(
      { slug: req.params.slug },
      updateData,
      { new: true }
    )
    .populate("authorId", "name email avatarUrl") // populate author
    .lean();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ✅ Return with author consistency
    res.json({
      ...post,
      author: post.authorId,
      authorId: post.authorId?._id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ================== DELETE POST ==================
export const remove = async (req, res) => {
  try {
    const deleted = await Post.findOneAndDelete({ slug: req.params.slug });
    
    if (!deleted) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(204).send(); // No content
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};