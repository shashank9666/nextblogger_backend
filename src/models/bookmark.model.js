import { Schema, model } from "mongoose";

const BookmarkSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  tags: [String], // User can organize bookmarks with tags
  notes: String
}, { timestamps: true });
BookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });
export default model("Bookmark", BookmarkSchema);