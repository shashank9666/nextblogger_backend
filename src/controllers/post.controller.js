import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Bookmark from "../models/bookmark.model.js";
import Analytics from "../models/analytics.model.js";
import { makeSlug } from "../utils/slugify.js";
import { calculateReadingTime } from "../utils/readingTime.js";
import mongoose from "mongoose";

// ================== LIST POSTS WITH ADVANCED FILTERING ==================
export const list = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      tags, 
      author, 
      search, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status = 'published'
    } = req.query;

    const query = {};
    
    // Build query based on filters
    if (status === 'published') {
      query.published = true;
      query.status = 'published';
    } else if (req.user && (req.user.role === 'admin' || req.user.role === 'moderator')) {
      // Allow admins/moderators to see all posts
      if (status !== 'all') query.status = status;
    } else if (req.user) {
      // Users can see their own drafts
      query.$or = [
        { published: true, status: 'published' },
        { authorId: req.user._id }
      ];
    } else {
      query.published = true;
      query.status = 'published';
    }

    if (category) query.category = category;
    if (tags) query.tags = { $in: tags.split(',') };
    if (author) {
      const authorUser = await User.findOne({ name: new RegExp(author, 'i') });
      if (authorUser) query.authorId = authorUser._id;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const posts = await Post.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("authorId", "name email avatarUrl")
      .select("-content -markdown -viewHistory") // Exclude heavy fields
      .lean();

    const total = await Post.countDocuments(query);

    const postsWithAuthor = posts.map(p => ({
      ...p,
      author: p.authorId,
      authorId: p.authorId?._id,
      isLiked: req.user ? p.likes.includes(req.user._id) : false,
      isBookmarked: req.user ? p.bookmarks.includes(req.user._id) : false,
      likesCount: p.likes.length,
      commentsCount: p.comments.length,
      bookmarksCount: p.bookmarks.length
    }));

    res.json({
      posts: postsWithAuthor,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total,
        limit: parseInt(limit)
      },
      filters: { category, tags, author, search, status }
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ================== GET SINGLE POST WITH VIEW TRACKING ==================
export const getBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug })
      .populate("authorId", "name email avatarUrl bio socialLinks")
      .populate("comments.authorId", "name avatarUrl")
      .lean();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Track view if not the author
    if (!req.user || !post.authorId._id.equals(req.user._id)) {
      const viewData = {
        userId: req.user?._id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      await Post.findByIdAndUpdate(post._id, {
        $inc: { views: 1 },
        $push: { viewHistory: viewData }
      });

      // Update daily analytics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await Analytics.findOneAndUpdate(
        { postId: post._id, date: today },
        { 
          $inc: { views: 1 },
          $setOnInsert: { authorId: post.authorId._id }
        },
        { upsert: true }
      );
    }

    const postWithAuthor = {
      ...post,
      author: post.authorId,
      authorId: post.authorId?._id,
      isLiked: req.user ? post.likes.includes(req.user._id) : false,
      isBookmarked: req.user ? post.bookmarks.includes(req.user._id) : false,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      bookmarksCount: post.bookmarks.length,
      views: post.views + 1 // Include the current view
    };

    res.json(postWithAuthor);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ================== CREATE POST WITH ENHANCED FEATURES ==================
export const create = async (req, res) => {
  try {
    const {
      title,
      content,
      markdown,
      excerpt,
      category,
      tags = [],
      published = false,
      scheduledAt,
      featuredImage,
      media = [],
      metaTitle,
      metaDescription
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const slug = makeSlug(title);
    const exists = await Post.findOne({ slug });
    if (exists) {
      return res.status(409).json({ message: "A post with this title already exists" });
    }

    // Calculate reading time
    const readingTime = calculateReadingTime(content);

    // Determine status
    let status = 'draft';
    let publishedAt = null;

    if (published && !scheduledAt) {
      status = 'published';
      publishedAt = new Date();
    } else if (scheduledAt) {
      status = 'scheduled';
      publishedAt = new Date(scheduledAt);
    }

    const post = await Post.create({
      title,
      slug,
      content,
      markdown,
      excerpt: excerpt || content.substring(0, 200) + '...',
      category,
      tags,
      authorId: req.user._id,
      published: status === 'published',
      publishedAt,
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      featuredImage,
      media,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt,
      readingTime
    });

    const populatedPost = await Post.findById(post._id)
      .populate("authorId", "name email avatarUrl")
      .lean();

    res.status(201).json({
      ...populatedPost,
      author: populatedPost.authorId,
      authorId: populatedPost.authorId?._id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ================== LIKE/UNLIKE POST ==================
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(req.user._id);
    const update = isLiked 
      ? { $pull: { likes: req.user._id } }
      : { $addToSet: { likes: req.user._id } };

    const updatedPost = await Post.findByIdAndUpdate(post._id, update, { new: true });

    // Update analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const increment = isLiked ? -1 : 1;
    await Analytics.findOneAndUpdate(
      { postId: post._id, date: today },
      { 
        $inc: { likes: increment },
        $setOnInsert: { authorId: post.authorId }
      },
      { upsert: true }
    );

    res.json({
      isLiked: !isLiked,
      likesCount: updatedPost.likes.length,
      message: isLiked ? "Post unliked" : "Post liked"
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ================== BOOKMARK/UNBOOKMARK POST ==================
export const toggleBookmark = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const existingBookmark = await Bookmark.findOne({
      userId: req.user._id,
      postId: post._id
    });

    if (existingBookmark) {
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      await Post.findByIdAndUpdate(post._id, { $pull: { bookmarks: req.user._id } });
      
      res.json({
        isBookmarked: false,
        message: "Bookmark removed"
      });
    } else {
      await Bookmark.create({
        userId: req.user._id,
        postId: post._id,
        tags: req.body.tags || []
      });
      await Post.findByIdAndUpdate(post._id, { $addToSet: { bookmarks: req.user._id } });

      // Update analytics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await Analytics.findOneAndUpdate(
        { postId: post._id, date: today },
        { 
          $inc: { bookmarks: 1 },
          $setOnInsert: { authorId: post.authorId }
        },
        { upsert: true }
      );

      res.json({
        isBookmarked: true,
        message: "Post bookmarked"
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ================== ADD COMMENT ==================
export const addComment = async (req, res) => {
  try {
    const { content, parentId } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const post = await Post.findOne({ slug: req.params.slug });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = {
      content: content.trim(),
      authorId: req.user._id,
      parentId: parentId || null
    };

    post.comments.push(comment);
    await post.save();

    // Update analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await Analytics.findOneAndUpdate(
      { postId: post._id, date: today },
      { 
        $inc: { comments: 1 },
        $setOnInsert: { authorId: post.authorId }
      },
      { upsert: true }
    );

    const updatedPost = await Post.findById(post._id)
      .populate("comments.authorId", "name avatarUrl")
      .lean();

    const newComment = updatedPost.comments[updatedPost.comments.length - 1];

    res.status(201).json({
      comment: newComment,
      message: "Comment added successfully"
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// Add these to your post.controller.js

// ================== UPDATE POST ==================
export const update = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug });
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user owns the post or is admin
    if (!post.authorId.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    const { title, content, category, tags, published, excerpt } = req.body;

    // Update slug if title changed
    let newSlug = post.slug;
    if (title && title !== post.title) {
      newSlug = makeSlug(title);
      const existingPost = await Post.findOne({ slug: newSlug, _id: { $ne: post._id } });
      if (existingPost) {
        return res.status(409).json({ message: "A post with this title already exists" });
      }
    }

    const updateData = {
      ...(title && { title }),
      ...(content && { content }),
      ...(category && { category }),
      ...(tags && { tags }),
      ...(excerpt && { excerpt }),
      ...(published !== undefined && { published }),
      slug: newSlug,
      readingTime: content ? calculateReadingTime(content) : post.readingTime
    };

    const updatedPost = await Post.findByIdAndUpdate(
      post._id,
      updateData,
      { new: true }
    ).populate("authorId", "name email avatarUrl");

    res.json({
      ...updatedPost.toObject(),
      author: updatedPost.authorId,
      authorId: updatedPost.authorId._id
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ================== DELETE POST ==================
export const remove = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug });
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user owns the post or is admin
    if (!post.authorId.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete related bookmarks
    await Bookmark.deleteMany({ postId: post._id });
    
    // Delete analytics data
    await Analytics.deleteMany({ postId: post._id });
    
    // Delete the post
    await Post.findByIdAndDelete(post._id);

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};
