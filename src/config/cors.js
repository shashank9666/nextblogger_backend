const cors = require("cors");

corsOptions = {
    origin: process.env.BASE_URL,
    credentials: true
}

module.exports = cors(corsOptions);