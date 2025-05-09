// Script to create an admin user in the database
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/Safestreet";

// Admin user details - change these as needed
const adminUser = {
  name: "Administrator",
  email: "admin123@gmail.com",
  password: "admin1234567890",
  isAdmin: true
};

async function createAdminUser() {
  try {
    // Connect to MongoDB
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✅ MongoDB connected");
    
    const db = mongoose.connection.useDb("Safestreet");
    const loginCollection = db.collection("login");
    
    // Check if admin user already exists
    console.log(`Checking if admin user ${adminUser.email} exists...`);
    const existingUser = await loginCollection.findOne({ email: adminUser.email });
    
    if (existingUser) {
      console.log("Admin user already exists!");
      console.log("Current user data:", existingUser);
      
      // Update the user to be an admin if not already
      if (existingUser.isAdmin !== true) {
        console.log("Updating user to have admin privileges...");
        await loginCollection.updateOne(
          { email: adminUser.email },
          { $set: { isAdmin: true } }
        );
        console.log("✅ Updated existing user to admin status");
      } else {
        console.log("User already has admin privileges.");
      }
      
      // Update password if needed (for testing)
      console.log("Updating admin password...");
      const hashedPassword = await bcrypt.hash(adminUser.password, 10);
      await loginCollection.updateOne(
        { email: adminUser.email },
        { $set: { password: hashedPassword } }
      );
      console.log("✅ Updated admin password");
    } else {
      // Create new admin user
      console.log("Creating new admin user...");
      const hashedPassword = await bcrypt.hash(adminUser.password, 10);
      
      const result = await loginCollection.insertOne({
        name: adminUser.name,
        email: adminUser.email,
        password: hashedPassword,
        isAdmin: true,
        createdAt: new Date()
      });
      
      console.log("✅ Admin user created successfully!", result);
    }
    
    // Verify the admin user exists
    const verifyUser = await loginCollection.findOne({ email: adminUser.email });
    console.log("Verified admin user in database:", verifyUser);
    
    // Disconnect from MongoDB
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

// Run the function
createAdminUser();