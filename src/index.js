const app = require("./app");
const { connectDB } = require("./config/db");

async function startServer() {
  try {
    await connectDB();
  } catch (error) {
    console.log(error);
  }
}
// Starting the server
app.listen(3000, () => {
  startServer();
  console.log("Server is running...");
});

// handle uncaught exception
process.on("uncaughtException", (e) => {
  console.log("uncaught exception", e);
  process.exit(1);
});

// unhandled promise rejection
process.on("unhandledRejection", (e) => {
  console.log("uncaught exception", e);
  process.exit(1);
});
