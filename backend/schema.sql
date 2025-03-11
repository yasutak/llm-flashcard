-- Database schema for LLM Flashcard application

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  encrypted_api_key TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Chats Table
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Decks Table
CREATE TABLE IF NOT EXISTS decks (
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

-- Flashcards Table
CREATE TABLE IF NOT EXISTS flashcards (
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

-- Flashcard Reviews Table (for tracking user progress)
CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  flashcard_id TEXT NOT NULL,
  score INTEGER NOT NULL, -- 0-5 scale for how well the user remembered
  review_time INTEGER NOT NULL, -- Timestamp of the review
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_decks_chat_id ON decks(chat_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON flashcards(deck_id);
