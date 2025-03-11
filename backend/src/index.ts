import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { prettyJSON } from 'hono/pretty-json';
import { HTTPException } from 'hono/http-exception';
import { errorHandler } from './middleware/error-handler';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chats';
import flashcardRoutes from './routes/flashcards';
import userRoutes from './routes/user';

// Define environment bindings
type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
};

// Create Hono app
const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    // Allow all localhost origins with different ports and the production domain
    origin: (origin) => {
      if (origin && (origin.startsWith('http://localhost:') || origin === 'https://llm-flashcard.pages.dev')) {
        return origin;
      }
      return 'http://localhost:3000'; // Default fallback
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
);
app.use('*', errorHandler());

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/chats', chatRoutes);
app.route('/api/flashcards', flashcardRoutes);
app.route('/api/user', userRoutes);

// Health check
app.get('/', (c) => c.json({ status: 'ok', message: 'LLM Flashcard API is running' }));

// Not found handler
app.notFound((c) => {
  return c.json(
    {
      status: 404,
      message: 'Not Found',
      path: c.req.path,
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error(`${err}`);
  
  // Check if the error is an HTTPException
  const status = err instanceof HTTPException ? err.status : 500;
  const message = status === 500 ? 'Internal Server Error' : err.message;
  
  return c.json(
    {
      status,
      message,
    },
    status
  );
});

export default app;
