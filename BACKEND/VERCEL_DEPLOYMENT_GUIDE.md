# Deploying Inspectify Backend to Vercel

This guide will walk you through deploying your Inspectify backend to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A MongoDB Atlas account (sign up at https://www.mongodb.com/cloud/atlas)
3. Git installed on your computer

## Step 1: Set up MongoDB Atlas

1. Create a MongoDB Atlas account if you don't have one
2. Create a new cluster (the free tier is sufficient for development)
3. Create a database user with read/write permissions
4. Add your IP address to the IP Access List (or allow access from anywhere for development)
5. Get your MongoDB connection string by clicking "Connect" > "Connect your application"
6. Replace `<username>`, `<password>`, and `<cluster>` in the connection string with your actual values

## Step 2: Prepare Your Backend for Deployment

1. Make sure your backend code is in a Git repository
2. Update your `.env` file with the MongoDB Atlas connection string
3. Ensure you have a `vercel.json` file in your project root (already created)

## Step 3: Deploy to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Navigate to your backend directory:
   ```
   cd c:/Users/USER/tailwindsample/BACKEND
   ```

3. Login to Vercel:
   ```
   vercel login
   ```

4. Deploy your project:
   ```
   vercel
   ```

5. Follow the prompts to configure your project
   - Set up environment variables when prompted:
     - `MONGO_URI`: Your MongoDB Atlas connection string
     - `EMAIL_PASSWORD`: Your email password (VENKAT1551971)
     - Any other environment variables your app needs

### Option 2: Deploy via Vercel Dashboard

1. Push your backend code to a GitHub repository
2. Go to https://vercel.com/new
3. Import your repository
4. Configure the project:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: npm install
   - Output Directory: ./
   - Install Command: npm install
5. Add environment variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `EMAIL_PASSWORD`: Your email password (VENKAT1551971)
   - Any other environment variables your app needs
6. Click "Deploy"

## Step 4: Update Frontend Configuration

After deployment, Vercel will provide you with a URL for your backend (e.g., https://inspectify-backend.vercel.app).

Update your frontend configuration to use this URL:

1. In your frontend project, update the `VITE_BACKEND_URL` environment variable to point to your new backend URL
2. Redeploy your frontend if necessary

## Troubleshooting

If you encounter any issues:

1. Check the Vercel deployment logs for errors
2. Verify that all environment variables are set correctly
3. Make sure your MongoDB Atlas connection string is correct and the database user has the right permissions
4. Check that your email credentials are correct

For file upload functionality, note that Vercel's serverless functions have a limited filesystem. For production, consider using a cloud storage service like AWS S3 or Firebase Storage for file uploads.