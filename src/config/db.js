import mongoose from "mongoose";

/**
 * Connect to MongoDB with strict database name enforcement
 * @param {string} uri - MongoDB connection URI
 * @param {string} dbName - Required database name (default: 'nextblogger')
 * @throws {Error} If URI is missing
 */
export const connect = async (uri, dbName = 'nextblogger') => {
  if (!uri) throw new Error("MONGODB_URI is required!");
  
  mongoose.set("strictQuery", true);

  // Parse URI to ensure proper formatting
  let parsedUri;
  try {
    parsedUri = new URL(uri);
    // For MongoDB SRV connections, pathname might not be applicable
    if (parsedUri.protocol === 'mongodb+srv:' && parsedUri.pathname === '/') {
      parsedUri.pathname = ''; // Clear pathname for SRV connections
    }
  } catch (err) {
    throw new Error("Invalid MongoDB URI format");
  }

  const options = {
    dbName,
    retryWrites: true,
    w: "majority",
    appName: "nextblogger-app",
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  };

  try {
    await mongoose.connect(uri, options);
    console.log(`✅ MongoDB connected to database: ${dbName}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw new Error(`Failed to connect to MongoDB: ${error.message}`);
  }
};