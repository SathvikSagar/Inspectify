import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the backend URL from command line arguments
const backendUrl = process.argv[2];

if (!backendUrl) {
  console.error('Please provide a backend URL as an argument');
  console.error('Example: node update-backend-url.js https://inspectify-backend.vercel.app');
  process.exit(1);
}

// Update .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(/VITE_BACKEND_URL=.*$/m, `VITE_BACKEND_URL=${backendUrl}`);
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated ${envPath}`);
}

// Update .env.production file
const envProdPath = path.join(__dirname, '.env.production');
if (fs.existsSync(envProdPath)) {
  let envProdContent = fs.readFileSync(envProdPath, 'utf8');
  envProdContent = envProdContent.replace(/VITE_BACKEND_URL=.*$/m, `VITE_BACKEND_URL=${backendUrl}`);
  fs.writeFileSync(envProdPath, envProdContent);
  console.log(`✅ Updated ${envProdPath}`);
}

// Update apiConfig.js
const apiConfigPath = path.join(__dirname, 'src', 'utils', 'apiConfig.js');
if (fs.existsSync(apiConfigPath)) {
  let apiConfigContent = fs.readFileSync(apiConfigPath, 'utf8');
  apiConfigContent = apiConfigContent.replace(
    /export const BACKEND_URL = .*$/m, 
    `export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "${backendUrl}";`
  );
  fs.writeFileSync(apiConfigPath, apiConfigContent);
  console.log(`✅ Updated ${apiConfigPath}`);
}

console.log(`\n🚀 Frontend configured to use backend at: ${backendUrl}`);
console.log('Remember to rebuild and redeploy your frontend after this change.');