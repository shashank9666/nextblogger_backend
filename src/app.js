const express = require("express");
const cors = require("./config/cors");

const blogsRoute = require("./routes/blogs");

const app = express();

app.use(cors);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "OK",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "Backend Sever Is Working fine!",
  });
});

app.use("/blogs", blogsRoute);

module.exports = app;
