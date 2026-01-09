const { getDB } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.getAllBlogs = async (req, res) => {
  try {
    const db = getDB();
    const blogs = db.collection("blogs");

    const allBlogs = await blogs.find().toArray();
    res.json(allBlogs);
  } catch (error) {
    console.log(error);
  }
};

exports.getOneBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const blogs = db.collection("blogs");
    const Blog = await blogs.findOne({ _id: id });

    res.json(Blog);
  } catch (error) {
    console.log(error);
  }
};

exports.createBlog = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const db = getDB();
    const blogs = db.collection("blogs");

    const result = await blogs.insertOne({
      _id: uuidv4(),
      title,
      description,
    });

    res.status(200).json({
      message: "Blog Created",
      blogId: result.insertedId,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Id is Required" });
    }

    const db = getDB();
    const blogs = db.collection("blogs");

    let result = await blogs.deleteOne({ _id: id });

    res.status(200).json({
      message: "Blog Deleted",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};
exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Id is Required" });
    }

    const db = getDB();
    const blogs = db.collection("blogs");

    const result = await blogs.updateOne(
      { _id: id },
      {
        $set: {
          title,
          description,
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({ message: "Blog Updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};