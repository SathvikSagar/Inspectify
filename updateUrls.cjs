// Script to update all hardcoded localhost URLs in the project
// Run this with Node.js: node updateUrls.cjs

const fs = require('fs');
const path = require('path');

// Configuration
const rootDir = path.resolve(__dirname, 'src'); // src directory
const backendUrl = 'https://inspectify-backend.onrender.com';
const localUrl = 'http://localhost:5000';

// File extensions to process
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// Count of replacements
let totalReplacements = 0;
let filesModified = 0;

// Function to process a file
function processFile(filePath) {
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if file doesn't contain the localhost URL
  if (!content.includes(localUrl)) {
    return;
  }
  
  // Replace all occurrences of localhost URL with backend URL
  const newContent = content.replace(new RegExp(localUrl, 'g'), backendUrl);
  
  // Count replacements
  const replacements = (content.match(new RegExp(localUrl, 'g')) || []).length;
  
  // If replacements were made, write the file
  if (replacements > 0) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath} (${replacements} replacements)`);
    totalReplacements += replacements;
    filesModified++;
  }
}

// Function to walk through directories
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git directories
      if (file !== 'node_modules' && file !== '.git') {
        walkDir(filePath);
      }
    } else if (extensions.includes(path.extname(file))) {
      processFile(filePath);
    }
  });
}

// Start processing
console.log(`Updating all instances of ${localUrl} to ${backendUrl}...`);
walkDir(rootDir);
console.log(`Done! Modified ${filesModified} files with ${totalReplacements} replacements.`);