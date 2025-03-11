#!/usr/bin/env node

/**
 * Script to initialize the database with the schema
 * 
 * Usage:
 * node init-db.js
 * 
 * This script will create all tables in the database according to the schema.sql file.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read the schema file
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Execute the schema
try {
  console.log('Initializing database with schema...');
  
  // Create a temporary file with the schema
  const tempFile = path.join(__dirname, 'temp-schema.sql');
  fs.writeFileSync(tempFile, schema);
  
  // Execute the schema
  execSync(`npx wrangler d1 execute llm_flashcard --file=${tempFile}`, { stdio: 'inherit' });
  
  // Clean up
  fs.unlinkSync(tempFile);
  
  console.log('\x1b[32m%s\x1b[0m', 'Database initialized successfully!');
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', 'Error initializing database:');
  console.error(error);
}
