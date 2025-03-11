import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../middleware/auth';
import { encrypt } from '../utils/encryption';
import { queryOne } from '../utils/db';
import { verifyApiKey } from '../services/claude-service';
import type { Env, ApiKeyRequest } from '../types';

// Create a router for user routes
const router = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all routes
router.use('*', authMiddleware());

// Validation schema for API key
const apiKeySchema = z.object({
  api_key: z.string().min(1),
});

// Store API key route
router.post(
  '/apikey',
  zValidator('json', apiKeySchema),
  async (c) => {
    const { api_key } = c.req.valid('json') as ApiKeyRequest;
    const userId = c.get('userId');
    
    try {
      // Verify the API key with Anthropic
      const isValid = await verifyApiKey(api_key);
      
      if (!isValid) {
        throw new HTTPException(400, { message: 'Invalid API key' });
      }
      
      // Encrypt the API key
      const encryptedApiKey = await encrypt(api_key, c.env.ENCRYPTION_KEY);
      
      // Update the user's API key
      await (c.env!.DB as unknown as D1Database).prepare(
        'UPDATE users SET encrypted_api_key = ?, updated_at = ? WHERE id = ?'
      )
        .bind(encryptedApiKey, Math.floor(Date.now() / 1000), userId)
        .run();
      
      return c.json({ success: true });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error('API key storage error:', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }
);

// Check if API key exists route
router.get('/apikey', async (c) => {
  const userId = c.get('userId');
  
  try {
    // Check if the user has an API key
    const user = await queryOne<{ encrypted_api_key: string | null }>(
      c.env!.DB as unknown as D1Database,
      'SELECT encrypted_api_key FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      throw new HTTPException(404, { message: 'User not found' });
    }
    
    return c.json({ exists: !!user.encrypted_api_key });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('API key check error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Get user profile route
router.get('/profile', async (c) => {
  const userId = c.get('userId');
  
  try {
    // Get the user's profile
    const user = await queryOne<{ id: string; username: string }>(
      c.env!.DB as unknown as D1Database,
      'SELECT id, username FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      throw new HTTPException(404, { message: 'User not found' });
    }
    
    return c.json({ user });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Profile fetch error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

export default router;
