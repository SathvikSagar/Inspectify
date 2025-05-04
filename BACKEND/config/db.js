// BACKEND/config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/Safestreet");
    console.log("✅ MongoDB connected");

    // Use specific database (optional if already specified in URI)
    return mongoose.connection.useDb("Safestreet");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

export default connectDB;
