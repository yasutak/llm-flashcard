#!/usr/bin/env node

/**
 * Script to run database migrations
 * 
 * Usage:
 * node run-migrations.js
 * 
 * This script will run all migrations in the migrations directory in order.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get the database name from wrangler.toml
function getDatabaseName() {
  const wranglerPath = path.join(__dirname, 'wrangler.toml');
  const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
  const match = wranglerContent.match(/database_name\s*=\s*"([^"]+)"/);
  if (!match) {
    throw new Error('Could not find database_name in wrangler.toml');
  }
  return match[1];
}

// Get all migration files
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to ensure migrations run in order
  
  return files.map(file => path.join(migrationsDir, file));
}

// Check if a migration has already been applied
function isMigrationApplied(dbName, migrationName) {
  try {
    const result = execSync(
      `npx wrangler d1 execute ${dbName} --command="SELECT COUNT(*) as count FROM migrations WHERE name = '${migrationName}';"`,
      { encoding: 'utf8' }
    );
    
    // Parse the result to get the count
    const match = result.match(/count\s*\|\s*(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10) > 0;
    }
    return false;
  } catch (error) {
    // If the migrations table doesn't exist yet, the migration hasn't been applied
    return false;
  }
}

// Record a migration as applied
function recordMigration(dbName, migrationName) {
  const timestamp = Math.floor(Date.now() / 1000);
  const command = `INSERT INTO migrations (name, applied_at) VALUES ('${migrationName}', ${timestamp});`;
  
  try {
    execSync(`npx wrangler d1 execute ${dbName} --command="${command}"`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`\x1b[31m%s\x1b[0m`, `Error recording migration ${migrationName}:`);
    console.error(error);
    return false;
  }
}

// Run a migration
function runMigration(dbName, migrationPath) {
  const filename = path.basename(migrationPath);
  
  // Check if migration has already been applied
  if (isMigrationApplied(dbName, filename)) {
    console.log(`Migration ${filename} has already been applied. Skipping...`);
    return true;
  }
  
  console.log(`Running migration: ${filename}...`);
  
  try {
    execSync(`npx wrangler d1 execute ${dbName} --file=${migrationPath}`, { stdio: 'inherit' });
    
    // Record the migration as applied
    if (!recordMigration(dbName, filename)) {
      console.error(`\x1b[31m%s\x1b[0m`, `Migration ${filename} was applied but could not be recorded.`);
      return false;
    }
    
    console.log(`\x1b[32m%s\x1b[0m`, `Migration ${filename} completed successfully!`);
    return true;
  } catch (error) {
    console.error(`\x1b[31m%s\x1b[0m`, `Error running migration ${filename}:`);
    console.error(error);
    return false;
  }
}

// Run all migrations
async function runMigrations() {
  try {
    const dbName = getDatabaseName();
    const migrationFiles = getMigrationFiles();
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      rl.close();
      return;
    }
    
    console.log(`Found ${migrationFiles.length} migration files.`);
    
    rl.question('Do you want to run all migrations? (yes/no): ', (answer) => {
      if (answer.toLowerCase() !== 'yes') {
        console.log('Operation cancelled.');
        rl.close();
        return;
      }
      
      console.log('Running migrations...');
      
      let success = true;
      for (const migrationFile of migrationFiles) {
        if (!runMigration(dbName, migrationFile)) {
          success = false;
          break;
        }
      }
      
      if (success) {
        console.log('\x1b[32m%s\x1b[0m', 'All migrations completed successfully!');
      } else {
        console.error('\x1b[31m%s\x1b[0m', 'Migration failed. See error above.');
      }
      
      rl.close();
    });
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Error running migrations:');
    console.error(error);
    rl.close();
  }
}

// Run the script
runMigrations();
