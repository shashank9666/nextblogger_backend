require("dotenv").config();

const app = require("./app");
const { connectDB } = require("./config/db");

(async () => {
  try {
    await connectDB();
    app.listen(5173, () => {
      console.log("Server running on port 5173");
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
