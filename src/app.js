const express = require("express");
const cors = require("./config/cors");

const blogsRoute = require("./routes/blogs");

const app = express();

app.use(cors);
app.use(express.json());


app.get("/", async (req, res) => {
  res.json({
    status: "Backend is working...",
  });
});

app.use("/blogs", blogsRoute);

module.exports = app;
