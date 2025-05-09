// Script to check MongoDB connection
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/Safestreet";

async function checkMongoDBConnection() {
  try {
    console.log(`Attempting to connect to MongoDB at: ${MONGO_URI}`);
    
    await mongoose.connect(MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    
    console.log('✅ MongoDB connection successful!');
    
    // Check if the Safestreet database exists
    const db = mongoose.connection.useDb("Safestreet");
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Collections in Safestreet database:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Check if login collection exists
    const loginCollection = collections.find(c => c.name === 'login');
    if (loginCollection) {
      console.log('✅ Login collection exists');
      
      // Count documents in login collection
      const count = await db.collection('login').countDocuments();
      console.log(`Total users in login collection: ${count}`);
      
      // Check for admin users
      const adminCount = await db.collection('login').countDocuments({ isAdmin: true });
      console.log(`Admin users in login collection: ${adminCount}`);
      
      // List all users
      const users = await db.collection('login').find({}).toArray();
      console.log('Users in login collection:');
      users.forEach(user => {
        console.log(`- ${user.name || 'Unnamed'} (${user.email}), Admin: ${user.isAdmin === true}`);
      });
    } else {
      console.log('❌ Login collection does not exist');
    }
    
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }
}

checkMongoDBConnection();