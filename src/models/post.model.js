import { Schema, model } from "mongoose";

const PostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    excerpt: { type: String, trim: true },
    content: { type: String, required: true },
    category: { 
      type: String, 
      required: true,
      enum: ['Introduction', 'Technology', 'Tutorial', 'News'],
      default: 'Technology' 
    },
    tags: [{ type: String, trim: true }],
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    published: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default model("Post", PostSchema);