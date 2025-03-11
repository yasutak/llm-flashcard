#!/usr/bin/env node

/**
 * Script to delete all data from the database
 * 
 * Usage:
 * node delete-data.js
 * 
 * This script will delete all data from all tables in the database.
 * It's useful for resetting the database to a clean state.
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\x1b[31m%s\x1b[0m', 'WARNING: This will delete ALL data from the database!');
console.log('\x1b[31m%s\x1b[0m', 'This action cannot be undone.');

rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes') {
    console.log('Operation cancelled.');
    rl.close();
    return;
  }

  try {
    console.log('Deleting all data from the database...');

    // Delete data from all tables in reverse order of dependencies
    const tables = [
      'flashcard_reviews',
      'flashcards',
      'decks',
      'messages',
      'chats',
      'users'
    ];

    // Use D1 CLI to execute DELETE statements
    tables.forEach(table => {
      console.log(`Deleting data from ${table}...`);
      const command = `npx wrangler d1 execute llm_flashcard --command "DELETE FROM ${table};"`;
      execSync(command, { stdio: 'inherit' });
    });

    console.log('\x1b[32m%s\x1b[0m', 'All data has been deleted successfully!');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Error deleting data:');
    console.error(error);
  }

  rl.close();
});
