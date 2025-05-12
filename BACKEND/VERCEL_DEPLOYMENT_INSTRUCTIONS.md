# Vercel Deployment Instructions

This backend has been optimized for deployment on Vercel's serverless platform. Follow these instructions to deploy:

## Prerequisites

1. A Vercel account
2. MongoDB Atlas account with connection string
3. Git repository with your code

## Deployment Steps

### 1. Push your code to a Git repository

Make sure all your changes are committed and pushed to your Git repository.

### 2. Deploy to Vercel

#### Option A: Using the Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New" > "Project"
3. Import your Git repository
4. Configure the project:
   - Framework Preset: Node.js
   - Root Directory: ./BACKEND
   - Build Command: npm run vercel-build
   - Output Directory: ./
   - Install Command: npm install

5. Add the following environment variables:
   - `MONGO_URI`: mongodb+srv://safe:DAD1551971MOM@cluster0.hdrgzta.mongodb.net/Safestreet?retryWrites=true&w=majority
   - `EMAIL_PASSWORD`: fwun yqbb kytu isxn
   - `MAILGUN_API_KEY`: 8e7a565fdc7cdfd39d4316a3f0182046-f6202374-78ddcc84
   - `MAILGUN_DOMAIN`: sandbox6eb28641579d48e9a52355c8740b15fd.mailgun.org
   - `NODE_ENV`: production

6. Click "Deploy"

#### Option B: Using the Vercel CLI

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Navigate to your backend directory:
   ```
   cd BACKEND
   ```

3. Login to Vercel:
   ```
   vercel login
   ```

4. Deploy your project:
   ```
   vercel
   ```

5. Follow the prompts to configure your project and set environment variables.

### 3. Update Frontend Configuration

After deployment, Vercel will provide you with a URL for your backend. Update your frontend configuration to use this URL:

1. In your frontend project, update the `VITE_BACKEND_URL` environment variable to point to your new backend URL
2. Redeploy your frontend if necessary

## Important Notes

### File System Limitations

Vercel's serverless functions have a read-only filesystem except for the `/tmp` directory, which is temporary. This backend has been modified to use the `/tmp` directory for file operations.

### Python Dependencies

This backend uses Python for ML models. The deployment has been configured to install the necessary Python dependencies during the build process.

### MongoDB Connection

Make sure your MongoDB Atlas connection is working properly with your Vercel deployment. You can check the Vercel logs to verify the connection.

### Environment Variables

Ensure all necessary environment variables are set in your Vercel project settings.

## Troubleshooting

If you encounter any issues:

1. Check the Vercel deployment logs for errors
2. Verify that all environment variables are set correctly
3. Make sure your MongoDB Atlas connection string is correct and the database user has the right permissions
4. Check that your email credentials are correct

For file upload functionality, note that Vercel's serverless functions have a limited filesystem. For production, consider using a cloud storage service like AWS S3 or Firebase Storage for file uploads.