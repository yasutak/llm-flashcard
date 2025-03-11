# LLM Flashcard

A web application for creating and studying flashcards generated from conversations with Claude AI.

## Features

- Chat with Claude AI to learn about any topic
- Automatically generate flashcards from your conversations
- Study flashcards with spaced repetition
- Side-by-side view for chatting and studying simultaneously
- Markdown support for rich text formatting

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Workers, Hono, D1 Database
- **Authentication**: JWT-based authentication
- **AI**: Claude API for conversation and flashcard generation

## Development

### Prerequisites

- Node.js 18+
- npm or pnpm
- Cloudflare account (for backend deployment)
- Anthropic API key (for Claude AI)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add the following variables:
     ```
     NEXT_PUBLIC_API_URL=http://localhost:8787
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Development

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend development server:
   ```bash
   npm run dev
   ```

## Testing

Run tests with:

```bash
npm test
```

## Deployment

The application is deployed using GitHub Actions workflows for CI/CD:

- Frontend: Vercel
- Backend: Cloudflare Workers

## License

MIT
