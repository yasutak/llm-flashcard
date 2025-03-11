#!/usr/bin/env node

/**
 * Script to reset the database by deleting all data and generating new mock data
 * 
 * Usage:
 * node reset-db.js
 * 
 * This script will:
 * 1. Delete all data from all tables in the database
 * 2. Generate new mock data for all tables
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\x1b[31m%s\x1b[0m', 'WARNING: This will delete ALL data from the database and replace it with mock data!');
console.log('\x1b[31m%s\x1b[0m', 'This action cannot be undone.');

rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes') {
    console.log('Operation cancelled.');
    rl.close();
    return;
  }

  try {
    console.log('Step 1: Deleting all data from the database...');
    
    // Run the delete-data.js script with auto-confirmation
    execSync('echo "yes" | node delete-data.js', { stdio: 'inherit' });
    
    console.log('\nStep 2: Generating new mock data...');
    
    // Run the generate-mock-data.js script
    execSync('node generate-mock-data.js', { stdio: 'inherit' });
    
    console.log('\n\x1b[32m%s\x1b[0m', 'Database reset completed successfully!');
    console.log('\x1b[32m%s\x1b[0m', 'The database now contains fresh mock data for testing.');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Error resetting database:');
    console.error(error);
  }

  rl.close();
});
