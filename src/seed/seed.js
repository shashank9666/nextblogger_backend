import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connect } from "../config/db.js";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Bookmark from "../models/bookmark.model.js";
import Analytics from "../models/analytics.model.js";
import { makeSlug } from "../utils/slugify.js";
import { calculateReadingTime } from "../utils/readingTime.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Validate required environment variables
const requiredEnvVars = ["MONGODB_URI", "MONGODB_DB_NAME"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`❌ Missing required environment variable: ${envVar}`);
  }
}

async function run() {
  const { MONGODB_URI, MONGODB_DB_NAME } = process.env;

  console.log(`🔗 Connecting to MongoDB...`);
  console.log(`📁 Database: ${MONGODB_DB_NAME}`);

  // Mask credentials in log output
  const safeUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
  console.log(`🌐 URI: ${safeUri}`);

  try {
    await connect(MONGODB_URI, MONGODB_DB_NAME);

    console.log("🧹 Clearing old data...");
    await Promise.all([
      Post.deleteMany({}),
      User.deleteMany({}),
      Bookmark.deleteMany({}),
      Analytics.deleteMany({}),
    ]);
    console.log("✅ Database cleared");

    console.log("👤 Seeding users...");
    const users = await User.insertMany([
      {
        name: "Alice Writer",
        email: "alice@example.com",
        avatarUrl:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        bio: "Passionate full-stack developer and technical writer. Love sharing knowledge through code and words.",
        role: "user",
        isVerified: true,
        socialLinks: {
          twitter: "https://twitter.com/alicewriter",
          github: "https://github.com/alicewriter",
          website: "https://alicewriter.dev",
        },
        preferences: { theme: "dark", emailNotifications: true },
        lastLogin: new Date(),
      },
      {
        name: "Bob Editor",
        email: "bob@example.com",
        avatarUrl:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        bio: "Senior developer and tech lead with 8+ years experience. MongoDB and Node.js enthusiast.",
        role: "admin",
        isVerified: true,
        socialLinks: {
          linkedin: "https://linkedin.com/in/bobeditor",
          github: "https://github.com/bobeditor",
        },
        preferences: { theme: "light", emailNotifications: false },
        lastLogin: new Date(),
      },
      {
        name: "Carol Designer",
        email: "carol@example.com",
        avatarUrl:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        bio: "UI/UX designer turned developer. Focused on creating beautiful, accessible web experiences.",
        role: "user",
        isVerified: true,
        socialLinks: {
          twitter: "https://twitter.com/caroldesigns",
          website: "https://caroldesigns.com",
        },
        preferences: { theme: "system", emailNotifications: true },
        lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    ]);
    console.log(`✅ ${users.length} users seeded`);

    const emailToId = new Map(users.map((u) => [u.email, u._id]));

    console.log("📝 Seeding posts...");
    const postsData = [
      {
        title: "Welcome to NextBlogger",
        content:
          "Welcome to NextBlogger. This is the first post of NextBlogger, a modern blogging platform built with cutting-edge technologies. What makes NextBlogger special: a modern stack built with Next.js, TypeScript, and MongoDB; a rich editor with support for both Markdown and WYSIWYG; authentication with Google Sign-In and JWT; interactive features such as comments, likes, and bookmarks; analytics to track performance; and a responsive design that looks great on all devices. Whether sharing knowledge as a developer or expressing ideas as a writer, NextBlogger provides the essential tools for a modern publishing experience. Let's build something amazing together.",
        excerpt:
          "Welcome to NextBlogger - a modern blogging platform for developers and writers.",
        category: "Introduction",
        tags: ["intro", "nextjs", "blogging", "welcome"],
        authorId: emailToId.get("alice@example.com"),
        published: true,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: "published",
        featuredImage: {
          url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
          alt: "Welcome banner with laptop and coffee",
        },
        metaTitle: "Welcome to NextBlogger - Modern Blogging Platform",
        metaDescription:
          "Discover NextBlogger, a cutting-edge blogging platform built with Next.js, TypeScript, and MongoDB. Start your blogging journey today!",
      },
      {
        title: "How We Built NextBlogger: Architecture Deep Dive",
        content:
          "Building NextBlogger involved a modern, scalable stack. On the frontend, we use Next.js with the App Router for performance, TypeScript for type safety, Tailwind CSS for rapid styling, and GSAP for animations. On the backend, we use Express.js for the REST API, MongoDB Atlas for document storage, JWT for authentication, and Cloudinary for media. Key features include authentication (email/password and Google OAuth), real-time interactions such as comments, likes, and bookmarks, and robust analytics. We optimized performance with database indexing, image optimization, lazy loading, and efficient pagination. Challenges included CORS configuration, secure token refresh flow, database design trade-offs, and handling large file uploads. The result is a fast, secure, feature-rich platform that scales well.",
        excerpt:
          "Deep dive into NextBlogger's architecture, tech stack, and the challenges we overcame while building it.",
        category: "Technology",
        tags: ["architecture", "nextjs", "mongodb", "javascript", "fullstack"],
        authorId: emailToId.get("bob@example.com"),
        published: true,
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: "published",
        featuredImage: {
          url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop",
          alt: "Code architecture diagram",
        },
        metaTitle:
          "NextBlogger Architecture: How We Built a Modern Blogging Platform",
        metaDescription:
          "Explore the technical architecture behind NextBlogger. Learn about our stack choices, implementation challenges, and solutions.",
      },
      {
        title: "Getting Started with Next.js: A Complete Guide",
        content:
          "Getting started with Next.js opens the door to modern React development. Next.js is a React framework that provides server-side rendering for improved SEO and performance, static site generation for speed, API routes for full-stack applications, automatic code splitting for optimal loading, and built-in CSS support. To create a new app, run create-next-app with TypeScript, Tailwind, and ESLint templates. Key concepts include the App Router for improved routing and layouts, the distinction between server and client components, and multiple data fetching approaches. With these fundamentals, developers can quickly build blogs, e-commerce sites, documentation portals, and portfolio websites with excellent performance and developer experience.",
        excerpt:
          "A practical introduction to building with Next.js—SSR, SSG, API routes, and modern patterns.",
        category: "Tutorial",
        tags: ["nextjs", "guide", "react", "ssr", "ssg"],
        authorId: emailToId.get("carol@example.com"),
        published: true,
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: "published",
        featuredImage: {
          url: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=800&h=400&fit=crop",
          alt: "Developer starting a Next.js project",
        },
        metaTitle: "Getting Started with Next.js: A Complete Guide",
        metaDescription:
          "Learn the essentials of Next.js, from SSR and SSG to API routes and modern React development workflows.",
      },
    ];

    // Prepare posts with derived fields
    const postsToInsert = postsData.map((post) => ({
      ...post,
      slug: makeSlug(post.title),
      readingTime: calculateReadingTime(post.content),
    }));

    const insertedPosts = await Post.insertMany(postsToInsert);
    console.log(`✅ ${insertedPosts.length} posts seeded`);

    console.log("🔖 Creating sample bookmarks...");
    await Bookmark.insertMany([
      {
        userId: emailToId.get("alice@example.com"),
        postId: insertedPosts[1]._id,
        createdAt: new Date(),
      },
      {
        userId: emailToId.get("bob@example.com"),
        postId: insertedPosts[2]._id,
        createdAt: new Date(),
      },
    ]);
    console.log("✅ Bookmarks created");
    console.log("📊 Creating sample analytics...");
    const now = new Date();
    await Analytics.insertMany([
      {
        postId: insertedPosts[0]._id,
        authorId: insertedPosts[0].authorId, // Add authorId from the post
        date: now, // Add current date
        views: 42,
        likes: 12,
        shares: 5,
        readDuration: 8.5,
        createdAt: now,
        updatedAt: now,
      },
      {
        postId: insertedPosts[1]._id,
        authorId: insertedPosts[1].authorId, // Add authorId from the post
        date: now, // Add current date
        views: 128,
        likes: 34,
        shares: 18,
        readDuration: 6.2,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    console.log("✅ Analytics created");

    console.log("🎉 Database seeding completed successfully!");
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

run().catch(async (err) => {
  console.error("❌ Seeding failed:", err.message);
  try {
    await mongoose.connection.close();
  } catch (e) {
    console.error("Failed to close connection:", e.message);
  }
  process.exit(1);
});
