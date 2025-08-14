import User from "../models/user.model.js";

export const list = async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

export const create = async (req, res) => {
  try {
    const { name, email, avatarUrl } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "name and email are required" });
    }
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }
    const user = await User.create({ name, email, avatarUrl });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};
