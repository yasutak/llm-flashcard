#!/usr/bin/env node

/**
 * Script to set up the D1 database for the LLM Flashcard application
 * 
 * Usage:
 *   node setup-db.js [--local]
 * 
 * Options:
 *   --local  Set up the database for local development
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const isLocal = process.argv.includes('--local');

// Get the database ID from wrangler.toml
const wranglerConfig = fs.readFileSync(path.join(__dirname, 'wrangler.toml'), 'utf8');
const databaseIdMatch = wranglerConfig.match(/database_id\s*=\s*"([^"]+)"/);

if (!databaseIdMatch) {
  console.error('Error: Could not find database_id in wrangler.toml');
  console.error('Please make sure you have created a D1 database and updated wrangler.toml');
  process.exit(1);
}

const databaseId = databaseIdMatch[1];
const databaseName = 'llm_flashcard_db';

console.log(`Setting up ${isLocal ? 'local' : 'production'} database...`);

try {
  // Execute the wrangler command to set up the database
  const command = `wrangler d1 execute ${databaseName} ${isLocal ? '--local' : ''} --file=schema.sql`;
  console.log(`Executing: ${command}`);
  
  execSync(command, { stdio: 'inherit' });
  
  console.log('\nDatabase setup complete!');
  
  if (isLocal) {
    console.log('\nYou can now start the development server with:');
    console.log('  npm run dev');
  } else {
    console.log('\nYour production database has been initialized.');
    console.log('Make sure to set the required environment variables in the Cloudflare dashboard:');
    console.log('  - JWT_SECRET: Secret key for JWT token generation and verification');
    console.log('  - ENCRYPTION_KEY: Key for encrypting and decrypting API keys');
  }
} catch (error) {
  console.error('Error setting up database:', error.message);
  process.exit(1);
}
