# LLM Flashcard Backend

This is the backend API for the LLM Flashcard application, built with Cloudflare Workers, D1 database, and Anthropic Claude 3.7 integration.

## Features

- **Authentication System**: User registration, login, and JWT-based authentication
- **Chat System**: Create, retrieve, and manage chat sessions with Claude
- **Flashcard System**: Automatically generate flashcards from chat conversations
- **API Key Management**: Securely store and manage Anthropic API keys

## Tech Stack

- **Cloudflare Workers**: Serverless compute platform
- **Cloudflare D1**: SQLite-based serverless database
- **Hono**: Lightweight web framework for Cloudflare Workers
- **Anthropic Claude 3.7**: LLM for chat and flashcard generation
- **JWT**: For secure authentication
- **Zod**: For request validation
- **bcrypt**: For password hashing
- **Web Crypto API**: For API key encryption

## Project Structure

```
/
├── src/
│   ├── index.ts              # Entry point
│   ├── middleware/           # Middleware functions
│   │   ├── auth.ts           # Authentication middleware
│   │   └── error-handler.ts  # Error handling middleware
│   ├── routes/               # API routes
│   │   ├── auth.ts           # Authentication routes
│   │   ├── chats.ts          # Chat routes
│   │   ├── flashcards.ts     # Flashcard routes
│   │   └── user.ts           # User routes
│   ├── services/             # Business logic
│   │   └── claude-service.ts # Claude API integration
│   ├── utils/                # Utility functions
│   │   ├── db.ts             # Database utilities
│   │   ├── jwt.ts            # JWT utilities
│   │   └── encryption.ts     # Encryption utilities
│   └── types/                # Type definitions
│       └── index.ts          # Type definitions
├── wrangler.toml             # Cloudflare Workers configuration
└── package.json              # Dependencies
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get a JWT token
- `POST /api/auth/logout` - Logout (client-side token removal)

### User

- `POST /api/user/apikey` - Store user's Anthropic API key
- `GET /api/user/apikey` - Check if user has stored an API key
- `GET /api/user/profile` - Get user profile information

### Chats

- `GET /api/chats` - Get all chat sessions for the user
- `GET /api/chats/:chatId` - Get a specific chat with its messages
- `POST /api/chats` - Create a new chat session
- `DELETE /api/chats/:chatId` - Delete a chat session
- `POST /api/chats/:chatId/messages` - Send a message to a chat
- `POST /api/chats/:chatId/generate-flashcards` - Generate flashcards from a chat

### Flashcards

- `GET /api/flashcards` - Get all flashcards for the user
- `GET /api/flashcards/chat/:chatId` - Get flashcards for a specific chat
- `POST /api/flashcards` - Create a new flashcard
- `PUT /api/flashcards/:flashcardId` - Update a flashcard
- `DELETE /api/flashcards/:flashcardId` - Delete a flashcard

## Database Schema

```sql
-- Users Table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  encrypted_api_key TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Chats Table
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages Table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Flashcards Table
CREATE TABLE flashcards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);
```

## Setup and Development

### Prerequisites

- Node.js (v18 or later)
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Local Development

1. Login to Cloudflare:
   ```
   wrangler login
   ```

2. Create a D1 database:
   ```
   wrangler d1 create llm_flashcard_db
   ```

3. Update the `wrangler.toml` file with your database ID.

4. Initialize the database schema:
   ```
   wrangler d1 execute llm_flashcard_db --local --file=schema.sql
   ```

5. Start the development server:
   ```
   npm run dev
   ```

### Deployment

1. Deploy to Cloudflare Workers:
   ```
   npm run deploy
   ```

2. Initialize the production database schema:
   ```
   wrangler d1 execute llm_flashcard_db --file=schema.sql
   ```

## Security Considerations

- JWT tokens are used for authentication
- Passwords are hashed using bcrypt
- API keys are encrypted using AES-GCM
- Input validation is performed using Zod
- CORS is configured to restrict access to allowed origins

## Environment Variables

The following environment variables are required:

- `JWT_SECRET`: Secret key for JWT token generation and verification
- `ENCRYPTION_KEY`: Key for encrypting and decrypting API keys

These can be set in the `wrangler.toml` file or in the Cloudflare dashboard.

## License

MIT
