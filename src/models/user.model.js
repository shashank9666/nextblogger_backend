import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String }, // For email/password auth
    googleId: { type: String }, // For Google OAuth
    avatarUrl: String,
    bio: { type: String, maxlength: 500 },
    role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    socialLinks: {
      twitter: String,
      linkedin: String,
      github: String,
      website: String
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      emailNotifications: { type: Boolean, default: true }
    },
    refreshToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date
  },
  { timestamps: true }
);

export default model("User", UserSchema);