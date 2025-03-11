import { HTTPException } from 'hono/http-exception';
import { Hono } from 'hono';
import * as claudeService from '../../services/claude-service';
import * as encryptionUtils from '../../utils/encryption';
import * as dbUtils from '../../utils/db';
import { authMiddleware } from '../../middleware/auth';
import type { Env } from '../../types';

// Mock the claudeService, encryptionUtils, and dbUtils
jest.mock('../../services/claude-service');
jest.mock('../../utils/encryption');
jest.mock('../../utils/db');
jest.mock('../../middleware/auth');

// Mock the auth middleware to pass through
(authMiddleware as jest.Mock).mockImplementation(() => {
  return async (c: any, next: () => Promise<void>) => {
    c.set('userId', 'test-user-id');
    await next();
  };
});

describe('User Routes', () => {
  let app: Hono<{ Bindings: Env }>;
  let mockEnv: Env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a fresh app for each test
    app = new Hono<{ Bindings: Env }>();
    
    // Mock environment
    mockEnv = {
      DB: {
        prepare: jest.fn().mockReturnThis(),
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockResolvedValue({}),
      } as any,
      ENCRYPTION_KEY: 'test-encryption-key',
      JWT_SECRET: 'test-jwt-secret',
    };
    
    // Set up routes
    app.post('/apikey', async (c) => {
      const { api_key } = await c.req.json() as { api_key: string };
      const userId = 'test-user-id';
      
      try {
        // Verify the API key with Anthropic
        const isValid = await claudeService.verifyApiKey(api_key);
        
        if (!isValid) {
          throw new HTTPException(400, { message: 'Invalid API key' });
        }
        
        // Encrypt the API key
        const encryptedApiKey = await encryptionUtils.encrypt(api_key, c.env.ENCRYPTION_KEY);
        
        // Update the user's API key
        await c.env.DB.prepare(
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
    });
    
    app.get('/apikey', async (c) => {
      const userId = 'test-user-id';
      
      try {
        // Check if the user has an API key
        const user = await dbUtils.queryOne<{ encrypted_api_key: string | null }>(
          c.env.DB,
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
  });
  
  describe('POST /apikey', () => {
    it('should store a valid API key', async () => {
      const validApiKey = 'sk-ant-test123456789';
      
      // Mock the verifyApiKey function to return true
      (claudeService.verifyApiKey as jest.Mock).mockResolvedValue(true);
      
      // Mock the encrypt function
      (encryptionUtils.encrypt as jest.Mock).mockResolvedValue('encrypted-api-key');
      
      // Execute the route handler
      const res = await app.request('http://localhost/apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: validApiKey }),
      }, mockEnv);
      
      // Verify the response
      expect(res.status).toBe(200);
      
      // Verify that the API key was verified
      expect(claudeService.verifyApiKey).toHaveBeenCalledWith(validApiKey);
      
      // Verify that the API key was encrypted
      expect(encryptionUtils.encrypt).toHaveBeenCalledWith(validApiKey, 'test-encryption-key');
      
      // Verify that the encrypted API key was stored in the database
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        'UPDATE users SET encrypted_api_key = ?, updated_at = ? WHERE id = ?'
      );
      // We're using 'as any' here because the D1Database type doesn't include bind and run methods
      // but our mock implementation does
      expect((mockEnv.DB as any).bind).toHaveBeenCalledWith(
        'encrypted-api-key',
        expect.any(Number),
        'test-user-id'
      );
      expect((mockEnv.DB as any).run).toHaveBeenCalled();
    });
    
    it('should return an error for an invalid API key', async () => {
      // Mock the verifyApiKey function to return false
      (claudeService.verifyApiKey as jest.Mock).mockResolvedValue(false);
      
      // Execute the route handler
      const res = await app.request('http://localhost/apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: 'invalid-api-key' }),
      }, mockEnv);
      
      // Verify the response
      expect(res.status).toBe(400);
      
      // Verify that the API key was verified
      expect(claudeService.verifyApiKey).toHaveBeenCalledWith('invalid-api-key');
      
      // Verify that the API key was not encrypted or stored
      expect(encryptionUtils.encrypt).not.toHaveBeenCalled();
      expect(mockEnv.DB.prepare).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /apikey', () => {
    it('should return true if the user has an API key', async () => {
      // Mock the queryOne function to return a user with an API key
      (dbUtils.queryOne as jest.Mock).mockResolvedValue({ encrypted_api_key: 'encrypted-api-key' });
      
      // Execute the route handler
      const res = await app.request('http://localhost/apikey', {
        method: 'GET',
      }, mockEnv);
      
      // Verify the response
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ exists: true });
    });
    
    it('should return false if the user does not have an API key', async () => {
      // Mock the queryOne function to return a user without an API key
      (dbUtils.queryOne as jest.Mock).mockResolvedValue({ encrypted_api_key: null });
      
      // Execute the route handler
      const res = await app.request('http://localhost/apikey', {
        method: 'GET',
      }, mockEnv);
      
      // Verify the response
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ exists: false });
    });
    
    it('should return 404 if the user is not found', async () => {
      // Mock the queryOne function to return null (user not found)
      (dbUtils.queryOne as jest.Mock).mockResolvedValue(null);
      
      // Execute the route handler
      const res = await app.request('http://localhost/apikey', {
        method: 'GET',
      }, mockEnv);
      
      // Verify the response
      expect(res.status).toBe(404);
    });
  });
});
