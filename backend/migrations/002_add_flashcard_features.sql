-- Migration to add flashcard features
-- This migration adds:
-- 1. Removes UNIQUE constraint on chat_id in decks table
-- 2. Adds description and color fields to decks table
-- 3. Adds difficulty, last_reviewed, and review_count fields to flashcards table
-- 4. Creates a new flashcard_reviews table for tracking user progress

-- Step 1: Create a new decks table without the UNIQUE constraint
CREATE TABLE IF NOT EXISTS decks_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  chat_id TEXT NOT NULL, -- Removed UNIQUE constraint to allow multiple decks per chat
  title TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Step 2: Copy data from the old decks table to the new one
INSERT INTO decks_new (id, user_id, chat_id, title, created_at, updated_at)
SELECT id, user_id, chat_id, title, created_at, updated_at FROM decks;

-- Step 3: Drop the old decks table
DROP TABLE decks;

-- Step 4: Rename the new decks table to decks
ALTER TABLE decks_new RENAME TO decks;

-- Step 5: Create a new flashcards table with the new fields
CREATE TABLE IF NOT EXISTS flashcards_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  deck_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty INTEGER DEFAULT 0, -- 0-5 scale for difficulty
  last_reviewed INTEGER, -- Timestamp of last review
  review_count INTEGER DEFAULT 0, -- Number of times reviewed
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

-- Step 6: Copy data from the old flashcards table to the new one
INSERT INTO flashcards_new (id, user_id, deck_id, question, answer, created_at, updated_at)
SELECT id, user_id, deck_id, question, answer, created_at, updated_at FROM flashcards;

-- Step 7: Drop the old flashcards table
DROP TABLE flashcards;

-- Step 8: Rename the new flashcards table to flashcards
ALTER TABLE flashcards_new RENAME TO flashcards;

-- Step 9: Create the flashcard_reviews table
CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  flashcard_id TEXT NOT NULL,
  score INTEGER NOT NULL, -- 0-5 scale for how well the user remembered
  review_time INTEGER NOT NULL, -- Timestamp of the review
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE
);

-- Step 10: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_decks_chat_id ON decks(chat_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_id ON flashcard_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_flashcard_id ON flashcard_reviews(flashcard_id);
