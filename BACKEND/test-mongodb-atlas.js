import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
console.log('Attempting to connect to MongoDB Atlas...');
console.log('Connection string (redacted):', MONGO_URI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://****:****@'));

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ MongoDB Atlas connected successfully');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ MongoDB Atlas connection error:', err);
  });