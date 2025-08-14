import express from "express";
import Analytics from "../models/analytics.model.js";
import Post from "../models/post.model.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get analytics for user's posts
router.get("/dashboard", authenticate, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get user's posts
    const userPosts = await Post.find({ authorId: req.user._id }).select('_id title');
    const postIds = userPosts.map(p => p._id);

    // Get analytics data
    const analytics = await Analytics.find({
      postId: { $in: postIds },
      date: { $gte: startDate }
    }).populate('postId', 'title slug');

    // Aggregate data
    const summary = await Analytics.aggregate([
      {
        $match: {
          postId: { $in: postIds },
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' },
          totalComments: { $sum: '$comments' },
          totalBookmarks: { $sum: '$bookmarks' }
        }
      }
    ]);

    res.json({
      summary: summary[0] || { totalViews: 0, totalLikes: 0, totalComments: 0, totalBookmarks: 0 },
      analytics,
      posts: userPosts
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
});

// Get analytics for specific post
router.get("/post/:postId", authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user owns the post or is admin
    if (!post.authorId.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    const analytics = await Analytics.find({ postId: req.params.postId })
      .sort({ date: -1 })
      .limit(30);

    res.json({ analytics });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
});

export default router;
