# Product Requirements Document: LLM Flashcard Chat Application

## 1. Product Overview

The LLM Flashcard Chat Application is a web-based platform that enables users to have conversations with an AI assistant powered by Claude, while automatically generating flashcards from important information discussed. The application aims to enhance learning and retention by converting key points from conversations into question-answer flashcards that users can review later.

## 2. User Requirements

### 2.1 Core Functionality
- Users can input their Anthropic API key to access the Claude 3.7 Sonnet model
- Users can have text-based conversations with the AI
- The system automatically identifies and generates flashcards from important information
- Users can also manually trigger flashcard generation
- Users can switch between chat and flashcard viewing modes
- Users can edit and delete flashcards

### 2.2 User Interface
- Responsive web design for desktop and mobile devices
- Blue-based color scheme
- Simple, intuitive navigation between chat and flashcard views

### 2.3 User Management
- User authentication via username and password
- Secure storage of user data and API keys

## 3. Technical Requirements

### 3.1 Technology Stack
- Frontend: React with TypeScript and Tailwind CSS
- Backend: Cloudflare Workers with Hono framework
- Database: Cloudflare D1 (SQLite-compatible)
- Authentication: Custom username/password system
- API Integration: Anthropic Claude API

### 3.2 Security Requirements
- Encrypted storage of Anthropic API keys
- Secure authentication system
- Protection against common web vulnerabilities

### 3.3 Performance Requirements
- Responsive UI with minimal loading times
- Efficient handling of conversation history

## 4. Feature Specifications

### 4.1 User Authentication
- Registration with username and password
- Login functionality
- Password recovery (future implementation)

### 4.2 Chat Interface
- Text input for user messages
- Display of conversation history
- Clear indication of AI vs user messages
- API key input during initial setup

### 4.3 Flashcard Generation
- Automatic identification of important information based on AI intuition
- Manual triggering of flashcard generation
- Question-answer format for flashcards
- Organization by conversation/chat session

### 4.4 Flashcard Management
- View flashcards grouped by conversation
- Edit flashcard content
- Delete flashcards
- Simple review system

## 5. Future Enhancements (Not in Initial Release)
- Tagging and categorization of flashcards
- Spaced repetition system
- Rich media support in flashcards
- Sharing functionality
- Import/export capabilities
- Analytics for usage patterns

# Technical Specifications

## 1. Architecture Overview

The application will follow a client-server architecture, with a React frontend and Cloudflare Workers backend using the Hono framework.

### 1.1 System Components
- **Frontend**: React SPA with TypeScript and Tailwind CSS
- **Backend**: Hono framework running on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite-compatible database)
- **External Services**: Anthropic Claude API

### 1.2 Component Interactions
```
┌─────────────┐      ┌───────────────┐      ┌─────────────┐
│  React SPA  │ <─── │  Hono/Worker  │ <─── │   Claude    │
│  Frontend   │ ───> │   Backend     │ ───> │     API     │
└─────────────┘      └───────────────┘      └─────────────┘
                            ^
                            │
                            v
                     ┌─────────────┐
                     │  Cloudflare │
                     │     D1      │
                     └─────────────┘
```

## 2. Frontend Specifications

### 2.1 Pages/Views
- **Login/Register Page**: User authentication
- **Chat View**: Primary conversation interface
- **Flashcard View**: Review interface for generated flashcards
- **Settings View**: API key management and user preferences

### 2.2 State Management
- React hooks for local component state
- Context API for application-wide state
- Local storage for persistence of non-sensitive data

### 2.3 API Interactions
- RESTful API calls to backend services
- WebSocket or polling for real-time updates (if needed)

## 3. Backend Specifications

### 3.1 API Endpoints

#### Authentication
- `POST /api/auth/register`: User registration
- `POST /api/auth/login`: User login
- `POST /api/auth/logout`: User logout

#### Chat
- `GET /api/chats`: Get all chat sessions for user
- `GET /api/chats/:id`: Get a specific chat session
- `POST /api/chats`: Create a new chat session
- `DELETE /api/chats/:id`: Delete a chat session
- `POST /api/chats/:id/messages`: Add a message to a chat session

#### Flashcards
- `GET /api/flashcards`: Get all flashcards for user
- `GET /api/flashcards/chat/:chatId`: Get flashcards for a specific chat
- `POST /api/flashcards`: Create a new flashcard
- `PUT /api/flashcards/:id`: Update a flashcard
- `DELETE /api/flashcards/:id`: Delete a flashcard
- `POST /api/chats/:id/generate-flashcards`: Generate flashcards from chat

#### API Keys
- `POST /api/user/apikey`: Store user's Anthropic API key
- `GET /api/user/apikey`: Verify API key existence (not returning the key)

### 3.2 Middleware
- Authentication middleware
- Error handling middleware
- Logging middleware

### 3.3 External API Integration
- Anthropic Claude API integration
- Error handling for API failures

## 4. Database Schema

### 4.1 Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  encrypted_api_key TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### 4.2 Chats Table
```sql
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4.3 Messages Table
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);
```

### 4.4 Flashcards Table
```sql
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

## 5. Security Specifications

### 5.1 API Key Management
- API keys will be encrypted before storage using AES-256
- Encryption key will be stored as a Cloudflare Worker Secret
- API calls to Anthropic will be made server-side only

### 5.2 Authentication
- Passwords will be hashed using bcrypt
- JWT tokens for session management
- HTTPS for all communications

### 5.3 Data Protection
- Input validation for all user-provided data
- Protection against common web vulnerabilities (XSS, CSRF, etc.)

## 6. Deployment Strategy

### 6.1 Development Environment
- Local development using Wrangler
- GitHub repository for version control

### 6.2 Production Deployment
- Deployment to Cloudflare Workers
- Database initialization and migrations using Wrangler
- CI/CD pipeline through GitHub Actions

## 7. Testing Strategy

### 7.1 Unit Testing
- Frontend component testing with React Testing Library
- Backend API testing

### 7.2 Integration Testing
- End-to-end testing of critical user flows

### 7.3 Security Testing
- Penetration testing for API key storage
- Authentication system review

## 8. Implementation Timeline

### Phase 1 (MVP)
- User authentication system
- Basic chat interface
- API key management
- Database setup and basic operations

### Phase 2
- Automatic flashcard generation
- Manual flashcard creation
- Flashcard viewing interface

### Phase 3
- Flashcard editing and deletion
- UI polishing
- Bug fixes and performance optimization