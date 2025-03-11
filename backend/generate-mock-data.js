#!/usr/bin/env node

/**
 * Script to generate mock data for the database
 * 
 * Usage:
 * node generate-mock-data.js
 * 
 * This script will generate mock data for all tables in the database.
 * It's useful for testing and development.
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Helper function to generate a random ID
function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

// Helper function to generate a random timestamp within the last 30 days
function generateTimestamp() {
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
  return Math.floor(Math.random() * (now - thirtyDaysAgo) + thirtyDaysAgo);
}

// Helper function to generate a random integer between min and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to pick a random item from an array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to execute SQL commands
function executeSql(command) {
  const tempFile = path.join(__dirname, 'temp-sql.sql');
  fs.writeFileSync(tempFile, command);
  try {
    execSync(`npx wrangler d1 execute llm_flashcard --file=${tempFile}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Error executing SQL:', error);
  } finally {
    fs.unlinkSync(tempFile);
  }
}

// Generate mock data
async function generateMockData() {
  console.log('Generating mock data...');

  // Sample data
  const usernames = ['alice', 'bob', 'charlie', 'dave', 'eve'];
  const chatTitles = [
    'Introduction to Machine Learning',
    'JavaScript Fundamentals',
    'Python Data Structures',
    'React Hooks Tutorial',
    'SQL Basics',
    'TypeScript Advanced Types',
    'CSS Grid Layout',
    'Node.js Streams',
    'GraphQL Queries',
    'Docker Containers'
  ];
  const deckColors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3', '#33FFF3'];
  const deckDescriptions = [
    'Core concepts and terminology',
    'Important formulas and equations',
    'Key definitions to remember',
    'Practice problems for exams',
    'Quick reference guide',
    'Advanced topics for experts'
  ];

  // Create users
  const users = [];
  for (let i = 0; i < usernames.length; i++) {
    const userId = generateId();
    const username = usernames[i];
    // Simple password hash (in a real app, use proper hashing)
    const passwordHash = crypto.createHash('sha256').update(`password${i}`).digest('hex');
    const encryptedApiKey = crypto.createHash('sha256').update(`api-key-${i}`).digest('hex');
    const createdAt = generateTimestamp();
    const updatedAt = createdAt + getRandomInt(0, 86400); // Up to 1 day later

    users.push({
      id: userId,
      username,
      passwordHash,
      encryptedApiKey,
      createdAt,
      updatedAt
    });
  }

  // Create chats, decks, messages, and flashcards for each user
  const chats = [];
  const decks = [];
  const messages = [];
  const flashcards = [];
  const flashcardReviews = [];

  for (const user of users) {
    // Create 2-5 chats for each user
    const numChats = getRandomInt(2, 5);
    for (let i = 0; i < numChats; i++) {
      const chatId = generateId();
      const title = getRandomItem(chatTitles);
      const createdAt = generateTimestamp();
      const updatedAt = createdAt + getRandomInt(0, 86400); // Up to 1 day later

      chats.push({
        id: chatId,
        userId: user.id,
        title,
        createdAt,
        updatedAt
      });

      // Create 1-3 decks for each chat
      const numDecks = getRandomInt(1, 3);
      for (let j = 0; j < numDecks; j++) {
        const deckId = generateId();
        const deckTitle = j === 0 ? title : `${title} - Part ${j + 1}`;
        const description = getRandomItem(deckDescriptions);
        const color = getRandomItem(deckColors);
        const deckCreatedAt = createdAt + getRandomInt(0, 3600); // Up to 1 hour later
        const deckUpdatedAt = deckCreatedAt + getRandomInt(0, 86400); // Up to 1 day later

        decks.push({
          id: deckId,
          userId: user.id,
          chatId,
          title: deckTitle,
          description,
          color,
          createdAt: deckCreatedAt,
          updatedAt: deckUpdatedAt
        });

        // Create 3-10 flashcards for each deck
        const numFlashcards = getRandomInt(3, 10);
        for (let k = 0; k < numFlashcards; k++) {
          const flashcardId = generateId();
          const question = `Question ${k + 1} for ${deckTitle}`;
          const answer = `Answer ${k + 1} for ${deckTitle}`;
          const difficulty = getRandomInt(0, 5);
          const reviewCount = getRandomInt(0, 10);
          const lastReviewed = reviewCount > 0 ? deckCreatedAt + getRandomInt(3600, 86400) : null;
          const flashcardCreatedAt = deckCreatedAt + getRandomInt(0, 3600); // Up to 1 hour later
          const flashcardUpdatedAt = flashcardCreatedAt + getRandomInt(0, 86400); // Up to 1 day later

          flashcards.push({
            id: flashcardId,
            userId: user.id,
            deckId,
            question,
            answer,
            difficulty,
            reviewCount,
            lastReviewed,
            createdAt: flashcardCreatedAt,
            updatedAt: flashcardUpdatedAt
          });

          // Create 0-10 reviews for each flashcard
          const numReviews = getRandomInt(0, reviewCount);
          for (let l = 0; l < numReviews; l++) {
            const reviewId = generateId();
            const score = getRandomInt(0, 5);
            const reviewTime = lastReviewed - getRandomInt(0, 86400 * 7); // Up to 7 days before lastReviewed

            flashcardReviews.push({
              id: reviewId,
              userId: user.id,
              flashcardId,
              score,
              reviewTime
            });
          }
        }
      }

      // Create 3-10 messages for each chat
      const numMessages = getRandomInt(3, 10);
      for (let j = 0; j < numMessages; j++) {
        const messageId = generateId();
        const role = j % 2 === 0 ? 'user' : 'assistant';
        const content = `${role === 'user' ? 'Question' : 'Answer'} ${j + 1} for ${title}`;
        const messageCreatedAt = createdAt + j * 60; // Each message 1 minute apart

        messages.push({
          id: messageId,
          chatId,
          role,
          content,
          createdAt: messageCreatedAt
        });
      }
    }
  }

  // Generate SQL commands
  let sql = '';

  // Insert users
  for (const user of users) {
    sql += `INSERT INTO users (id, username, password_hash, encrypted_api_key, created_at, updated_at) VALUES ('${user.id}', '${user.username}', '${user.passwordHash}', '${user.encryptedApiKey}', ${user.createdAt}, ${user.updatedAt});\n`;
  }

  // Insert chats
  for (const chat of chats) {
    sql += `INSERT INTO chats (id, user_id, title, created_at, updated_at) VALUES ('${chat.id}', '${chat.userId}', '${chat.title}', ${chat.createdAt}, ${chat.updatedAt});\n`;
  }

  // Insert messages
  for (const message of messages) {
    sql += `INSERT INTO messages (id, chat_id, role, content, created_at) VALUES ('${message.id}', '${message.chatId}', '${message.role}', '${message.content}', ${message.createdAt});\n`;
  }

  // Insert decks
  for (const deck of decks) {
    sql += `INSERT INTO decks (id, user_id, chat_id, title, description, color, created_at, updated_at) VALUES ('${deck.id}', '${deck.userId}', '${deck.chatId}', '${deck.title}', '${deck.description}', '${deck.color}', ${deck.createdAt}, ${deck.updatedAt});\n`;
  }

  // Insert flashcards
  for (const flashcard of flashcards) {
    const lastReviewed = flashcard.lastReviewed ? flashcard.lastReviewed : 'NULL';
    sql += `INSERT INTO flashcards (id, user_id, deck_id, question, answer, difficulty, review_count, last_reviewed, created_at, updated_at) VALUES ('${flashcard.id}', '${flashcard.userId}', '${flashcard.deckId}', '${flashcard.question}', '${flashcard.answer}', ${flashcard.difficulty}, ${flashcard.reviewCount}, ${lastReviewed}, ${flashcard.createdAt}, ${flashcard.updatedAt});\n`;
  }

  // Insert flashcard reviews
  for (const review of flashcardReviews) {
    sql += `INSERT INTO flashcard_reviews (id, user_id, flashcard_id, score, review_time) VALUES ('${review.id}', '${review.userId}', '${review.flashcardId}', ${review.score}, ${review.reviewTime});\n`;
  }

  // Execute SQL commands
  executeSql(sql);

  console.log('\x1b[32m%s\x1b[0m', 'Mock data has been generated successfully!');
  console.log('\x1b[32m%s\x1b[0m', `Generated ${users.length} users, ${chats.length} chats, ${messages.length} messages, ${decks.length} decks, ${flashcards.length} flashcards, and ${flashcardReviews.length} reviews.`);
}

// Run the script
generateMockData().catch(error => {
  console.error('\x1b[31m%s\x1b[0m', 'Error generating mock data:');
  console.error(error);
});
