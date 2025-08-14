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
import { makeSlug } from "../utils/slugify.js";

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("❌ MONGODB_URI is not set in .env");

  console.log(`🔗 Connecting to database: ${mongoUri}`);
  await connect(mongoUri);

  console.log("🗑 Clearing old data...");
  await Promise.all([Post.deleteMany({}), User.deleteMany({})]);

  console.log("👤 Inserting users...");
  const users = await User.insertMany([
    { name: "Alice Writer", email: "alice@example.com", avatarUrl: "" },
    { name: "Bob Editor", email: "bob@example.com", avatarUrl: "" }
  ]);
  console.log(`✅ ${users.length} users inserted`);

  const emailToId = new Map(users.map(u => [u.email, u._id]));

  console.log("📝 Inserting posts...");
  const posts = await Post.insertMany([
    {
      title: "Welcome to NextBlogger",
      slug: makeSlug("Welcome to NextBlogger"),
      excerpt: "First post introducing the project.",
      content: "This is the first post of NextBlogger...",
      category: "Introduction",
      tags: ["intro", "nextjs", "express"],
      authorId: emailToId.get("alice@example.com"),
      published: true
    },
    {
      title: "How we built it",
      slug: makeSlug("How we built it"),
      excerpt: "Stack and architecture overview.",
      content: "We used Next.js, JavaScript, Tailwind, Express, and MongoDB Atlas...",
      category: "Technology",
      tags: ["architecture", "javascript"],
      authorId: emailToId.get("bob@example.com"),
      published: true
    },
    {
      title: "Getting Started with Next.js",
      slug: makeSlug("Getting Started with Next.js"),
      excerpt: "A beginner's guide to Next.js development.",
      content: "Next.js is a React framework that enables server-side rendering...",
      category: "Tutorial",
      tags: ["nextjs", "beginners"],
      authorId: emailToId.get("alice@example.com"),
      published: true
    },
    {
      title: "Advanced MongoDB Techniques",
      slug: makeSlug("Advanced MongoDB Techniques"),
      excerpt: "Learn advanced query patterns and optimizations.",
      content: "MongoDB offers powerful aggregation pipelines...",
      category: "Technology",
      tags: ["mongodb", "database"],
      authorId: emailToId.get("bob@example.com"),
      published: true
    }
  ]);

  console.log(`✅ ${posts.length} posts inserted`);

  await mongoose.disconnect();
  console.log("🌱 Seeding completed successfully.");
}

run().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});