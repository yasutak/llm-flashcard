#!/usr/bin/env node

/**
 * Setup script for the LLM Flashcard Chat Application
 * 
 * This script helps with setting up both the frontend and backend of the application.
 * It installs dependencies, initializes the database, and provides instructions for next steps.
 * 
 * Usage:
 *   node setup.js [--backend-only] [--frontend-only]
 * 
 * Options:
 *   --backend-only   Set up only the backend
 *   --frontend-only  Set up only the frontend
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse command line arguments
const backendOnly = process.argv.includes('--backend-only');
const frontendOnly = process.argv.includes('--frontend-only');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to execute commands
function executeCommand(command, cwd = process.cwd()) {
  try {
    console.log(`\nExecuting: ${command}`);
    execSync(command, { stdio: 'inherit', cwd });
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Helper function to ask a question
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Setup the frontend
async function setupFrontend() {
  console.log('\n=== Setting up Frontend ===');
  
  // Install dependencies
  console.log('\nInstalling frontend dependencies...');
  executeCommand('npm install');
  
  console.log('\nFrontend setup complete!');
  console.log('\nYou can now start the frontend development server with:');
  console.log('  npm run dev');
  console.log('\nThen open http://localhost:3000 in your browser.');
}

// Setup the backend
async function setupBackend() {
  console.log('\n=== Setting up Backend ===');
  
  // Change to backend directory
  const backendDir = path.join(process.cwd(), 'backend');
  
  // Install dependencies
  console.log('\nInstalling backend dependencies...');
  executeCommand('npm install', backendDir);
  
  // Ask if the user wants to set up Cloudflare
  const setupCloudflare = await askQuestion('\nDo you want to set up Cloudflare Workers and D1? (y/n): ');
  
  if (setupCloudflare.toLowerCase() === 'y') {
    // Login to Cloudflare
    console.log('\nLogging in to Cloudflare...');
    executeCommand('npx wrangler login', backendDir);
    
    // Create D1 database
    console.log('\nCreating D1 database...');
    executeCommand('npx wrangler d1 create llm_flashcard_db', backendDir);
    
    // Get the database ID
    const databaseId = await askQuestion('\nPlease enter the database ID from the output above: ');
    
    // Update wrangler.toml with the database ID
    const wranglerPath = path.join(backendDir, 'wrangler.toml');
    let wranglerConfig = fs.readFileSync(wranglerPath, 'utf8');
    wranglerConfig = wranglerConfig.replace(/database_id\s*=\s*"placeholder-database-id"/, `database_id = "${databaseId}"`);
    fs.writeFileSync(wranglerPath, wranglerConfig);
    
    // Initialize the database schema
    console.log('\nInitializing the database schema...');
    executeCommand('npm run setup-db:local', backendDir);
  }
  
  console.log('\nBackend setup complete!');
  console.log('\nYou can now start the backend development server with:');
  console.log('  cd backend');
  console.log('  npm run dev');
}

// Main function
async function main() {
  console.log('=== LLM Flashcard Chat Application Setup ===');
  
  try {
    if (!backendOnly) {
      await setupFrontend();
    }
    
    if (!frontendOnly) {
      await setupBackend();
    }
    
    console.log('\n=== Setup Complete ===');
    console.log('\nNext steps:');
    console.log('1. Start the backend server: cd backend && npm run dev');
    console.log('2. Start the frontend server: npm run dev');
    console.log('3. Open http://localhost:3000 in your browser');
    console.log('\nHappy coding!');
  } catch (error) {
    console.error('\nSetup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run the main function
main();
