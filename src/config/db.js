import mongoose from "mongoose";

export const connect = async (uri) => {
  if (!uri) throw new Error("MONGODB_URI is missing!");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");
};
