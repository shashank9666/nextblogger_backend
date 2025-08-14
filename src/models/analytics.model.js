import { Schema, model } from "mongoose";

const AnalyticsSchema = new Schema({
  postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  bookmarks: { type: Number, default: 0 },
  shares: { type: Number, default: 0 }
}, { timestamps: true });
AnalyticsSchema.index({ postId: 1, date: 1 }, { unique: true });
AnalyticsSchema.index({ authorId: 1, date: 1 });
export default model("Analytics", AnalyticsSchema);