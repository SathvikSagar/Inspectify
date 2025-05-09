// Script to check if admin user exists in the database
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = "mongodb://localhost:27017/Safestreet";
const adminEmail = "admin123@gmail.com";
const adminPassword = "admin1234567890";

async function checkAdminUser() {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    console.log('✅ MongoDB connection successful!');
    
    const db = mongoose.connection.useDb("Safestreet");
    const loginCollection = db.collection("login");
    
    // Check if admin user exists
    console.log(`Looking for admin user with email: ${adminEmail}`);
    const adminUser = await loginCollection.findOne({ email: adminEmail });
    
    if (adminUser) {
      console.log('✅ Admin user found in database!');
      console.log('Admin user details:', {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        isAdmin: adminUser.isAdmin
      });
      
      // Test password
      if (adminUser.password) {
        try {
          const passwordMatch = await bcrypt.compare(adminPassword, adminUser.password);
          console.log(`Password match: ${passwordMatch}`);
          
          if (!passwordMatch) {
            // Update password
            console.log('Updating admin password...');
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await loginCollection.updateOne(
              { email: adminEmail },
              { $set: { password: hashedPassword } }
            );
            console.log('✅ Admin password updated!');
          }
        } catch (error) {
          console.error('Error comparing passwords:', error);
        }
      } else {
        console.log('❌ Admin user has no password!');
      }
      
      // Make sure isAdmin is set to true
      if (adminUser.isAdmin !== true) {
        console.log('Setting isAdmin flag to true...');
        await loginCollection.updateOne(
          { email: adminEmail },
          { $set: { isAdmin: true } }
        );
        console.log('✅ isAdmin flag set to true!');
      }
    } else {
      console.log('❌ Admin user not found in database!');
      
      // Create admin user
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const result = await loginCollection.insertOne({
        name: "Administrator",
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
        createdAt: new Date()
      });
      
      console.log('✅ Admin user created!', result);
    }
    
    // Verify admin user exists
    const verifyUser = await loginCollection.findOne({ email: adminEmail });
    if (verifyUser) {
      console.log('✅ Admin user verified in database!');
    } else {
      console.log('❌ Failed to create admin user!');
    }
    
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAdminUser();