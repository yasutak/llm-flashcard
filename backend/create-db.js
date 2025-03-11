#!/usr/bin/env node

/**
 * Script to create a new database with the updated schema
 * 
 * Usage:
 * node create-db.js
 * 
 * This script will:
 * 1. Create a new database
 * 2. Initialize it with the schema from schema.sql
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\x1b[33m%s\x1b[0m', 'This script will create a new database with the updated schema.');
console.log('\x1b[33m%s\x1b[0m', 'You will need to update your wrangler.toml file with the new database ID.');

rl.question('Enter a name for the new database (e.g., llm_flashcard_db_new): ', (dbName) => {
  if (!dbName) {
    console.log('Database name is required. Exiting...');
    rl.close();
    return;
  }

  try {
    // Create a new database
    console.log(`Creating new database: ${dbName}...`);
    const createOutput = execSync(`npx wrangler d1 create ${dbName}`, { encoding: 'utf8' });
    console.log(createOutput);

    // Extract the database ID from the output
    const dbIdMatch = createOutput.match(/database_id\s*=\s*"([^"]+)"/);
    if (!dbIdMatch) {
      console.error('\x1b[31m%s\x1b[0m', 'Could not extract database ID from output.');
      rl.close();
      return;
    }

    const dbId = dbIdMatch[1];
    console.log(`Database created with ID: ${dbId}`);

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Create a temporary file with the schema
    const tempFile = path.join(__dirname, 'temp-schema.sql');
    fs.writeFileSync(tempFile, schema);

    // Execute the schema on the new database
    console.log('Initializing database with schema...');
    execSync(`npx wrangler d1 execute ${dbName} --file=${tempFile}`, { stdio: 'inherit' });

    // Clean up
    fs.unlinkSync(tempFile);

    console.log('\x1b[32m%s\x1b[0m', 'Database created and initialized successfully!');
    console.log('\x1b[33m%s\x1b[0m', 'Update your wrangler.toml file with the following:');
    console.log(`
[[d1_databases]]
binding = "DB"
database_name = "${dbName}"
database_id = "${dbId}"
`);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Error creating database:');
    console.error(error);
  }

  rl.close();
});
