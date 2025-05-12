// Simple test endpoint for Vercel
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
  try {
    // Get MongoDB connection string from environment variables
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/Inspectify";
    
    // Test MongoDB connection
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'Backend is running and MongoDB connection is working',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
    
    // Close MongoDB connection
    await mongoose.disconnect();
  } catch (error) {
    // Return error response
    res.status(500).json({
      status: 'error',
      message: 'Backend is running but MongoDB connection failed',
      error: error.message,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  }
}