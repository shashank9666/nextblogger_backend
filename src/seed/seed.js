import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { connect } from "../config/db.js";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Bookmark from "../models/bookmark.model.js";
import Analytics from "../models/analytics.model.js";
import { makeSlug } from "../utils/slugify.js";
import { calculateReadingTime } from "../utils/readingTime.js";

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("❌ MONGODB_URI is not set in .env");

  console.log(`🔗 Connecting to database: ${mongoUri}`);
  await connect(mongoUri);

  console.log("🗑 Clearing old data...");
  await Promise.all([
    Post.deleteMany({}), 
    User.deleteMany({}),
    Bookmark.deleteMany({}),
    Analytics.deleteMany({})
  ]);

  console.log("👤 Inserting users...");
  const users = await User.insertMany([
    {
      name: "Alice Writer",
      email: "alice@example.com",
      avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      bio: "Passionate full-stack developer and technical writer. Love sharing knowledge through code and words.",
      role: "user",
      isVerified: true,
      socialLinks: {
        twitter: "https://twitter.com/alicewriter",
        github: "https://github.com/alicewriter",
        website: "https://alicewriter.dev"
      },
      preferences: {
        theme: "dark",
        emailNotifications: true
      },
      lastLogin: new Date()
    },
    {
      name: "Bob Editor", 
      email: "bob@example.com",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      bio: "Senior developer and tech lead with 8+ years experience. MongoDB and Node.js enthusiast.",
      role: "admin",
      isVerified: true,
      socialLinks: {
        linkedin: "https://linkedin.com/in/bobeditor",
        github: "https://github.com/bobeditor"
      },
      preferences: {
        theme: "light",
        emailNotifications: false
      },
      lastLogin: new Date()
    },
    {
      name: "Carol Designer",
      email: "carol@example.com",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      bio: "UI/UX designer turned developer. Focused on creating beautiful, accessible web experiences.",
      role: "user",
      isVerified: true,
      socialLinks: {
        twitter: "https://twitter.com/caroldesigns",
        website: "https://caroldesigns.com"
      },
      preferences: {
        theme: "system",
        emailNotifications: true
      },
      lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    }
  ]);

  console.log(`✅ ${users.length} users inserted`);
  const emailToId = new Map(users.map(u => [u.email, u._id]));

  console.log("📝 Inserting posts...");
  const postsData = [
    {
      title: "Welcome to NextBlogger",
      content: `# Welcome to NextBlogger 🚀

This is the first post of NextBlogger, a modern blogging platform built with cutting-edge technologies.

## What makes NextBlogger special?

- **Modern Stack**: Built with Next.js, TypeScript, and MongoDB
- **Rich Editor**: Support for Markdown and WYSIWYG editing
- **Authentication**: Secure Google Sign-In and JWT authentication
- **Interactive Features**: Comments, likes, bookmarks, and more
- **Analytics**: Track your content performance
- **Responsive Design**: Beautiful on all devices

Whether you're a developer sharing your knowledge or a writer expressing your thoughts, NextBlogger provides all the tools you need for a modern blogging experience.

Let's build something amazing together! 💻✨`,
      excerpt: "Welcome to NextBlogger - a modern blogging platform for developers and writers.",
      category: "Introduction",
      tags: ["intro", "nextjs", "blogging", "welcome"],
      authorId: emailToId.get("alice@example.com"),
      published: true,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      status: "published",
      featuredImage: {
        url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
        alt: "Welcome banner with laptop and coffee"
      },
      metaTitle: "Welcome to NextBlogger - Modern Blogging Platform",
      metaDescription: "Discover NextBlogger, a cutting-edge blogging platform built with Next.js, TypeScript, and MongoDB. Start your blogging journey today!"
    },
    {
      title: "How We Built NextBlogger: Architecture Deep Dive",
      content: `# Building NextBlogger: A Technical Journey

## The Stack

We chose a modern, scalable stack for NextBlogger:

### Frontend
- **Next.js 14** with App Router for optimal performance
- **TypeScript** for type safety and better developer experience
- **Tailwind CSS** for rapid, consistent styling
- **GSAP** for smooth animations and transitions

### Backend
- **Express.js** for our REST API
- **MongoDB Atlas** for flexible, document-based storage
- **JWT** for secure authentication
- **Cloudinary** for media management

## Key Features Implemented

### Authentication System
We implemented a robust authentication system supporting both traditional email/password and Google OAuth:

\`\`\`javascript
// JWT token generation
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};
\`\`\`

### Real-time Features
- Live comment system with threaded replies
- Real-time like and bookmark counters
- View tracking and analytics

### Performance Optimizations
- Database indexing for faster queries
- Image optimization with Cloudinary
- Lazy loading for better UX
- Efficient pagination

## Challenges We Overcame

1. **CORS Issues**: Properly configuring cross-origin requests
2. **Authentication Flow**: Implementing secure token refresh
3. **Database Design**: Balancing normalization and performance
4. **File Uploads**: Handling large media files efficiently

The result is a fast, secure, and feature-rich blogging platform that scales beautifully.`,
      excerpt: "Deep dive into NextBlogger's architecture, tech stack, and the challenges we overcame while building it.",
      category: "Technology",
      tags: ["architecture", "nextjs", "mongodb", "javascript", "fullstack"],
      authorId: emailToId.get("bob@example.com"),
      published: true,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      status: "published",
      featuredImage: {
        url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop",
        alt: "Code architecture diagram"
      },
      metaTitle: "NextBlogger Architecture: How We Built a Modern Blogging Platform",
      metaDescription: "Explore the technical architecture behind NextBlogger. Learn about our stack choices, implementation challenges, and solutions."
    },
    {
      title: "Getting Started with Next.js: A Complete Guide",
      content: `# Getting Started with Next.js: Your Gateway to Modern React Development

Next.js has revolutionized how we build React applications. Let's explore why it's become the go-to framework for modern web development.

## What is Next.js?

Next.js is a React framework that provides:
- **Server-Side Rendering (SSR)** for better SEO and performance
- **Static Site Generation (SSG)** for lightning-fast sites
- **API Routes** for full-stack applications
- **Automatic Code Splitting** for optimal loading
- **Built-in CSS Support** including CSS Modules and Sass

## Setting Up Your First Next.js Project

\`\`\`bash
# Create a new Next.js app
npx create-next-app@latest my-blog-app --typescript --tailwind --eslint

# Navigate to your project
cd my-blog-app

# Start the development server
npm run dev
\`\`\`

## Key Concepts to Master

### 1. App Router (Next.js 13+)
The new App Router brings improved performance and developer experience:

\`\`\`javascript
// app/blog/[slug]/page.tsx
export default function BlogPost({ params }: { params: { slug: string } }) {
  return <h1>Blog post: {params.slug}</h1>;
}
\`\`\`

### 2. Server Components vs Client Components
- **Server Components**: Render on the server, great for data fetching
- **Client Components**: Run in the browser, needed for interactivity

### 3. Data Fetching Patterns
Next.js offers multiple ways to fetch data:

\`\`\`javascript
// Server Component data fetching
async function getBlogPosts() {
  const res = await fetch('https://api.example.com/posts');
  return res.json();
}

export default async function BlogPage() {
  const posts = await getBlogPosts();
  return <PostList posts={posts} />;
}
\`\`\`

## Best Practices

1. **Use TypeScript** for better developer experience
2. **Optimize Images** with next/image component
3. **Implement Proper SEO** with metadata API
4. **Follow the App Router conventions**
5. **Leverage Server Components** when possible

## What's Next?

Now that you understand the basics, try building:
- A personal blog (like this one!)
- An e-commerce site
- A documentation site
- A portfolio website

Next.js makes all of these possible with excellent performance and developer experience.

Happy coding! 🚀`,
      excerpt: "A comprehensive beginner's guide to Next.js development, covering setup, key concepts, and best practices.",
      category: "Tutorial",
      tags: ["nextjs", "react", "tutorial", "beginners", "javascript"],
      authorId: emailToId.get("alice@example.com"),
      published: true,
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      status: "published",
      featuredImage: {
        url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop",
        alt: "Next.js development setup"
      },
      metaTitle: "Complete Next.js Guide for Beginners - Learn Modern React Development",
      metaDescription: "Master Next.js with our comprehensive guide. Learn SSR, SSG, App Router, and best practices for modern React development."
    },
    {
      title: "Advanced MongoDB Techniques for Modern Applications",
      content: `# Advanced MongoDB Techniques: Unlocking Database Performance

MongoDB's flexibility makes it perfect for modern applications, but mastering its advanced features can dramatically improve your app's performance and scalability.

## Aggregation Pipeline Mastery

The aggregation pipeline is MongoDB's most powerful feature for data processing:

\`\`\`javascript
// Complex blog analytics query
db.posts.aggregate([
  {
    $match: {
      publishedAt: { $gte: new Date("2024-01-01") },
      published: true
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "authorId",
      foreignField: "_id",
      as: "author"
    }
  },
  {
    $unwind: "$author"
  },
  {
    $group: {
      _id: "$author.name",
      totalPosts: { $sum: 1 },
      totalViews: { $sum: "$views" },
      avgLikes: { $avg: { $size: "$likes" } }
    }
  },
  {
    $sort: { totalViews: -1 }
  }
]);
\`\`\`

## Indexing Strategies

Proper indexing is crucial for performance:

### Compound Indexes
\`\`\`javascript
// Optimize blog post queries
db.posts.createIndex({ 
  published: 1, 
  category: 1, 
  createdAt: -1 
});

// Text search index
db.posts.createIndex({ 
  title: "text", 
  content: "text", 
  tags: "text" 
});
\`\`\`

### Partial Indexes
\`\`\`javascript
// Index only published posts
db.posts.createIndex(
  { createdAt: -1 },
  { partialFilterExpression: { published: true } }
);
\`\`\`

## Schema Design Patterns

### Embedding vs Referencing
Choose based on data access patterns:

\`\`\`javascript
// Embedded comments (small, frequently accessed together)
{
  _id: ObjectId("..."),
  title: "My Blog Post",
  comments: [
    {
      _id: ObjectId("..."),
      content: "Great post!",
      authorId: ObjectId("..."),
      createdAt: ISODate("...")
    }
  ]
}

// Referenced users (large, accessed separately)
{
  _id: ObjectId("..."),
  title: "My Blog Post",
  authorId: ObjectId("...") // Reference to users collection
}
\`\`\`

## Performance Optimization Techniques

### 1. Use Projection
Only fetch fields you need:
\`\`\`javascript
// Don't fetch heavy content field for post listings
db.posts.find(
  { published: true },
  { title: 1, excerpt: 1, authorId: 1, createdAt: 1 }
);
\`\`\`

### 2. Implement Pagination Efficiently
\`\`\`javascript
// Cursor-based pagination (better than skip/limit)
db.posts.find({ _id: { $gt: lastSeenId } })
  .sort({ _id: 1 })
  .limit(10);
\`\`\`

### 3. Use Connection Pooling
\`\`\`javascript
// Configure connection pool
const client = new MongoClient(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
\`\`\`

## Change Streams for Real-time Features

Monitor data changes in real-time:
\`\`\`javascript
const changeStream = db.posts.watch([
  { $match: { 'fullDocument.published': true } }
]);

changeStream.on('change', (change) => {
  // Notify clients of new published posts
  io.emit('newPost', change.fullDocument);
});
\`\`\`

## Production Best Practices

1. **Always use indexes** for query fields
2. **Monitor slow queries** with database profiler
3. **Implement proper error handling** and retries
4. **Use read preferences** for scaling reads
5. **Regular backups** and disaster recovery planning

These techniques will help you build scalable, high-performance applications with MongoDB. Remember: measure, optimize, and iterate!`,
      excerpt: "Master advanced MongoDB techniques including aggregation pipelines, indexing strategies, and performance optimization for modern apps.",
      category: "Technology",
      tags: ["mongodb", "database", "performance", "aggregation", "indexing"],
      authorId: emailToId.get("bob@example.com"),
      published: true,
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: "published",
      featuredImage: {
        url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop",
        alt: "Database optimization visualization"
      },
      metaTitle: "Advanced MongoDB Techniques - Performance & Scalability Guide",
      metaDescription: "Learn advanced MongoDB techniques for modern applications. Master aggregation pipelines, indexing strategies, and performance optimization."
    },
    {
      title: "The Future of Web Development: Trends to Watch",
      content: `# The Future of Web Development: What's Coming Next?

Web development is evolving rapidly. Here are the key trends shaping our industry's future.

## 1. Server Components Revolution

React Server Components are changing how we think about client-server boundaries...

## 2. Edge Computing Goes Mainstream

With platforms like Vercel Edge Functions and Cloudflare Workers...

## 3. AI-Powered Development Tools

GitHub Copilot is just the beginning. We're seeing AI assistants that can...

*This post is still being written. Check back soon for the full article!*`,
      excerpt: "Exploring the cutting-edge trends that will shape the future of web development in 2024 and beyond.",
      category: "Technology",
      tags: ["future", "trends", "web-development", "ai", "edge-computing"],
      authorId: emailToId.get("carol@example.com"),
      published: false,
      status: "draft",
      featuredImage: {
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop",
        alt: "Futuristic technology concept"
      }
    }
  ];

  // Calculate reading time and create posts
  const posts = await Post.insertMany(
    postsData.map(post => ({
      ...post,
      slug: makeSlug(post.title),
      readingTime: calculateReadingTime(post.content),
      views: Math.floor(Math.random() * 1000) + 50, // Random view count
      likes: [], // Will be populated separately
      bookmarks: [],
      comments: []
    }))
  );

  console.log(`✅ ${posts.length} posts inserted`);

  // Add some likes and comments to make data more realistic
  console.log("💝 Adding likes and comments...");
  
  const publishedPosts = posts.filter(p => p.published);
  
  for (const post of publishedPosts) {
    // Add random likes
    const likeCount = Math.floor(Math.random() * 3) + 1;
    const randomUsers = users.sort(() => 0.5 - Math.random()).slice(0, likeCount);
    
    await Post.findByIdAndUpdate(post._id, {
      $push: { likes: { $each: randomUsers.map(u => u._id) } }
    });

    // Add sample comments
    const comments = [
      {
        content: "Great article! Thanks for sharing your insights.",
        authorId: users[Math.floor(Math.random() * users.length)]._id
      },
      {
        content: "This is exactly what I was looking for. Bookmarked!",
        authorId: users[Math.floor(Math.random() * users.length)]._id
      }
    ];

    const randomCommentCount = Math.floor(Math.random() * 2) + 1;
    await Post.findByIdAndUpdate(post._id, {
      $push: { comments: { $each: comments.slice(0, randomCommentCount) } }
    });
  }

  // Create some bookmarks
  console.log("🔖 Creating bookmarks...");
  const bookmarks = [];
  for (const post of publishedPosts.slice(0, 2)) {
    bookmarks.push({
      userId: users[0]._id,
      postId: post._id,
      tags: ["read-later", "favorites"]
    });
  }
  
  if (bookmarks.length > 0) {
    await Bookmark.insertMany(bookmarks);
    
    // Update post bookmark arrays
    for (const bookmark of bookmarks) {
      await Post.findByIdAndUpdate(bookmark.postId, {
        $push: { bookmarks: bookmark.userId }
      });
    }
  }

  // Create analytics data
  console.log("📊 Generating analytics data...");
  const analyticsData = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    for (const post of publishedPosts) {
      analyticsData.push({
        postId: post._id,
        authorId: post.authorId,
        date,
        views: Math.floor(Math.random() * 50) + 10,
        likes: Math.floor(Math.random() * 10),
        comments: Math.floor(Math.random() * 5),
        bookmarks: Math.floor(Math.random() * 3),
        shares: Math.floor(Math.random() * 2)
      });
    }
  }
  
  await Analytics.insertMany(analyticsData);
  console.log(`✅ ${analyticsData.length} analytics records inserted`);

  await mongoose.disconnect();
  console.log("🌱 Enhanced seeding completed successfully!");
}

run().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  try { 
    await mongoose.disconnect(); 
  } catch {}
  process.exit(1);
});