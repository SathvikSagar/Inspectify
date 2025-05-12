# Setting Up MongoDB Atlas for Inspectify

This guide will walk you through setting up a MongoDB Atlas database for your Inspectify application.

## Step 1: Create a MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free" to create a new account or sign in if you already have one

## Step 2: Create a New Cluster

1. After signing in, click "Build a Database"
2. Choose the "FREE" tier
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure) and region (choose one closest to your users)
4. Click "Create Cluster" (this may take a few minutes to provision)

## Step 3: Set Up Database Access

1. In the left sidebar, click "Database Access" under "Security"
2. Click "Add New Database User"
3. Choose "Password" as the authentication method
4. Enter a username and password (make sure to remember these)
5. Set "Database User Privileges" to "Atlas admin" for simplicity
6. Click "Add User"

## Step 4: Set Up Network Access

1. In the left sidebar, click "Network Access" under "Security"
2. Click "Add IP Address"
3. For development, you can click "Allow Access from Anywhere" (not recommended for production)
4. Alternatively, add your specific IP address
5. Click "Confirm"

## Step 5: Get Your Connection String

1. In the left sidebar, click "Database" under "Deployments"
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user's password
6. Replace `<dbname>` with "Inspectify"

## Step 6: Update Your .env File

Update your `.env` file with the MongoDB Atlas connection string:

```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/Inspectify?retryWrites=true&w=majority
```

Replace `<username>`, `<password>`, and `<cluster>` with your actual values.

## Step 7: Test Your Connection

You can test your connection by running:

```javascript
// test-mongodb-connection.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ MongoDB Atlas connected successfully');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ MongoDB Atlas connection error:', err);
  });
```

Run this script with:

```
node test-mongodb-connection.js
```

## Important Notes

1. Keep your MongoDB Atlas username and password secure
2. For production, restrict IP access to only your application servers
3. Consider setting up MongoDB Atlas backups for your production database
4. Monitor your database usage to avoid exceeding the free tier limits