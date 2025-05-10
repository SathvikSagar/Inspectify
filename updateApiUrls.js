// Script to update all hardcoded localhost URLs in the project
// Run this with Node.js: node updateApiUrls.js

const fs = require('fs');
const path = require('path');

// Configuration
const rootDir = path.resolve(__dirname); // Project root directory
const backendUrl = 'https://inspectify-backend.onrender.com';
const localUrl = 'http://localhost:5000';

// File extensions to process
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// Directories to skip
const skipDirs = ['node_modules', '.git', 'dist', 'build'];

// Count of replacements
let totalReplacements = 0;
let filesModified = 0;

// Function to process a file
function processFile(filePath) {
  try {
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
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}

// Function to walk through directories
function walkDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Skip specified directories
          if (!skipDirs.includes(file)) {
            walkDir(filePath);
          }
        } else if (extensions.includes(path.extname(file))) {
          processFile(filePath);
        }
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
}

// Start processing
console.log(`Updating all instances of ${localUrl} to ${backendUrl}...`);
walkDir(rootDir);
console.log(`Done! Modified ${filesModified} files with ${totalReplacements} replacements.`);