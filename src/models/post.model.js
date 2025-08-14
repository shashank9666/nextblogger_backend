import { Schema, model } from "mongoose";

const CommentSchema = new Schema({
  content: { type: String, required: true, maxlength: 1000 },
  authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  parentId: { type: Schema.Types.ObjectId, ref: "Comment" }, // For threaded replies
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const PostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    excerpt: { type: String, trim: true },
    content: { type: String, required: true },
    markdown: { type: String }, // Store markdown version
    category: {
      type: String,
      required: true,
      enum: ['Introduction', 'Technology', 'Tutorial', 'News', 'Web Development', 'Mobile', 'AI/ML', 'DevOps'],
      default: 'Technology'
    },
    tags: [{ type: String, trim: true }],
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    published: { type: Boolean, default: false },
    publishedAt: Date,
    scheduledAt: Date, // For scheduled publishing
    status: { type: String, enum: ['draft', 'published', 'scheduled', 'archived'], default: 'draft' },
    
    // Media
    featuredImage: {
      url: String,
      alt: String,
      cloudinaryId: String
    },
    media: [{
      type: { type: String, enum: ['image', 'video'] },
      url: String,
      caption: String,
      cloudinaryId: String
    }],
    
    // Engagement
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    bookmarks: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [CommentSchema],
    
    // Analytics
    views: { type: Number, default: 0 },
    viewHistory: [{
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      viewedAt: { type: Date, default: Date.now },
      ip: String,
      userAgent: String
    }],
    
    // SEO
    metaTitle: String,
    metaDescription: String,
    
    // Reading time estimation
    readingTime: { type: Number, default: 0 } // in minutes
  },
  { timestamps: true }
);

// Indexes for better performance
PostSchema.index({ published: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ category: 1 });
PostSchema.index({ authorId: 1 });

export const Comment = model("Comment", CommentSchema);
export default model("Post", PostSchema);
