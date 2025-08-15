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

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
  try {
    const { MONGODB_URI } = process.env;
    await connect(MONGODB_URI);

    console.log("🧹 Clearing old data...");
    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Bookmark.deleteMany({}),
      Analytics.deleteMany({}),
    ]);

    console.log("👤 Seeding users...");
    const users = await User.insertMany([
      {
        name: "Alice Writer",
        email: "alice@example.com",
        avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        bio: "Passionate full-stack developer and technical writer.",
        role: "user",
        isVerified: true,
        preferences: { theme: "dark", emailNotifications: true },
        lastLogin: new Date(),
      },
      {
        name: "Bob Editor",
        email: "bob@example.com",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        bio: "Senior developer and tech lead with 8+ years experience.",
        role: "admin",
        isVerified: true,
        preferences: { theme: "light", emailNotifications: false },
        lastLogin: new Date(),
      },
      {
        name: "Carol Designer",
        email: "carol@example.com",
        avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        bio: "UI/UX designer turned developer.",
        role: "user",
        isVerified: true,
        preferences: { theme: "system", emailNotifications: true },
        lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ]);

    // Create email to ID mapping
    const emailToId = new Map(users.map(user => [user.email, user._id]));
    console.log(`✅ ${users.length} users seeded`);

    console.log("📝 Seeding posts...");
    const postsData = [
      {
        title: "Welcome to NextBlogger",
        content: "Welcome to NextBlogger. This is the first post of NextBlogger, a modern blogging platform built with cutting-edge technologies...",
        excerpt: "Welcome to NextBlogger - a modern blogging platform for developers and writers.",
        category: "Introduction",
        tags: ["intro", "nextjs", "blogging", "welcome"],
        authorId: emailToId.get("alice@example.com"),
        published: true,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: "published",
        slug: makeSlug("Welcome to NextBlogger"),
        readingTime: calculateReadingTime("Welcome to NextBlogger. This is the first post..."),
        featuredImage: {
          url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
          alt: "Welcome banner with laptop and coffee",
        },
      },
      {
        title: "How We Built NextBlogger: Architecture Deep Dive",
        content: "Building NextBlogger involved a modern, scalable stack...",
        excerpt: "Deep dive into NextBlogger's architecture, tech stack, and challenges.",
        category: "Technology",
        tags: ["architecture", "nextjs", "mongodb", "javascript", "fullstack"],
        authorId: emailToId.get("bob@example.com"),
        published: true,
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: "published",
        slug: makeSlug("How We Built NextBlogger: Architecture Deep Dive"),
        readingTime: calculateReadingTime("Building NextBlogger involved a modern, scalable stack..."),
        featuredImage: {
          url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop",
          alt: "Code architecture diagram",
        },
      },
      {
        title: "Getting Started with Next.js: A Complete Guide",
        content: "Getting started with Next.js opens the door to modern React development...",
        excerpt: "A practical introduction to building with Next.js—SSR, SSG, API routes, and modern patterns.",
        category: "Tutorial",
        tags: ["nextjs", "guide", "react", "ssr", "ssg"],
        authorId: emailToId.get("carol@example.com"),
        published: true,
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: "published",
        slug: makeSlug("Getting Started with Next.js: A Complete Guide"),
        readingTime: calculateReadingTime("Getting started with Next.js opens the door..."),
        featuredImage: {
          url: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=800&h=400&fit=crop",
          alt: "Developer starting a Next.js project",
        },
      },
    ];

    const insertedPosts = await Post.insertMany(postsData);
    console.log(`✅ ${insertedPosts.length} posts seeded`);

    // Create bookmarks
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

    // Create analytics dynamically for each post
    console.log("📊 Seeding analytics...");
    const now = new Date();
    const analyticsData = insertedPosts.map(post => ({
      postId: post._id,
      authorId: post.authorId,
      date: now,
      views: randomInt(30, 200),
      likes: randomInt(5, 50),
      shares: randomInt(1, 20),
      readDuration: parseFloat((Math.random() * (10 - 3) + 3).toFixed(1)), // 3.0 to 10.0 mins
      createdAt: now,
      updatedAt: now,
    }));

    await Analytics.insertMany(analyticsData);

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

run().catch(console.error);
