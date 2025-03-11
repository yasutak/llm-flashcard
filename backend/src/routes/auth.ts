import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { HTTPException } from 'hono/http-exception';
import { generateJWT } from '../utils/jwt';
import { queryOne } from '../utils/db';
import type { Env, LoginCredentials, RegisterCredentials } from '../types';

// Create a router for auth routes
const router = new Hono<{ Bindings: Env }>();

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

// Login route
router.post(
  '/login',
  zValidator('json', loginSchema),
  async (c) => {
    const { username, password } = c.req.valid('json') as LoginCredentials;
    
    try {
      // Find the user by username
      const user = await queryOne<{
        id: string;
        username: string;
        password_hash: string;
      }>(
        c.env.DB,
        'SELECT id, username, password_hash FROM users WHERE username = ?',
        [username]
      );
      
      if (!user) {
        throw new HTTPException(401, { message: 'Invalid username or password' });
      }
      
      // Verify the password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        throw new HTTPException(401, { message: 'Invalid username or password' });
      }
      
      // Generate a JWT token
      const token = await generateJWT(
        { userId: user.id },
        c.env.JWT_SECRET
      );
      
      return c.json({
        token,
        user: {
          id: user.id,
          username: user.username,
        },
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error('Login error:', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }
);

// Register route
router.post(
  '/register',
  zValidator('json', registerSchema),
  async (c) => {
    const { username, password } = c.req.valid('json') as RegisterCredentials;
    
    try {
      // Check if the username is already taken
      const existingUser = await queryOne(
        c.env.DB,
        'SELECT id FROM users WHERE username = ?',
        [username]
      );
      
      if (existingUser) {
        throw new HTTPException(409, { message: 'Username already exists' });
      }
      
      // Hash the password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Generate a unique ID
      const userId = nanoid();
      
      // Get the current timestamp
      const now = Math.floor(Date.now() / 1000);
      
      // Insert the new user
      await c.env.DB.prepare(
        'INSERT INTO users (id, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(userId, username, passwordHash, now, now)
        .run();
      
      // Generate a JWT token
      const token = await generateJWT(
        { userId },
        c.env.JWT_SECRET
      );
      
      return c.json({
        token,
        user: {
          id: userId,
          username,
        },
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error('Registration error:', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }
);

// Logout route (just a placeholder since JWT tokens are stateless)
router.post('/logout', (c) => {
  return c.json({ success: true });
});

export default router;
