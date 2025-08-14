import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    avatarUrl: String
  },
  { timestamps: true }
);

export default model("User", UserSchema);
