import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import userRoutes from '../../routes/user';
import * as claudeService from '../../services/claude-service';
import * as encryptionUtils from '../../utils/encryption';

// Mock the claudeService and encryptionUtils
jest.mock('../../services/claude-service');
jest.mock('../../utils/encryption');

// Mock the Hono context
const mockGet = jest.fn();
const mockJson = jest.fn().mockReturnValue({ json: true });
const mockEnv = {
  DB: {
    prepare: jest.fn().mockReturnThis(),
    bind: jest.fn().mockReturnThis(),
    run: jest.fn().mockResolvedValue({}),
  },
  ENCRYPTION_KEY: 'test-encryption-key',
};

const mockContext = {
  get: mockGet,
  json: mockJson,
  req: {
    valid: jest.fn(),
  },
  env: mockEnv,
};

describe('User Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue('test-user-id');
  });

  describe('POST /apikey', () => {
    it('should store a valid API key', async () => {
      // Mock the request body
      mockContext.req.valid.mockReturnValue({ api_key: 'test-api-key' });
      
      // Mock the verifyApiKey function to return true
      (claudeService.verifyApiKey as jest.Mock).mockResolvedValue(true);
      
      // Mock the encrypt function
      (encryptionUtils.encrypt as jest.Mock).mockResolvedValue('encrypted-api-key');
      
      // Call the route handler
      const app = new Hono();
      app.post('/apikey', userRoutes.routes['/apikey'].POST);
      
      // Create a mock execution context
      const executionContext = {
        waitUntil: jest.fn(),
        passThroughOnException: jest.fn(),
      };
      
      // Execute the route handler
      await app.fetch(
        new Request('http://localhost/apikey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: 'test-api-key' }),
        }),
        mockEnv,
        executionContext
      );
      
      // Verify that the API key was verified
      expect(claudeService.verifyApiKey).toHaveBeenCalledWith('test-api-key');
      
      // Verify that the API key was encrypted
      expect(encryptionUtils.encrypt).toHaveBeenCalledWith('test-api-key', 'test-encryption-key');
      
      // Verify that the encrypted API key was stored in the database
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        'UPDATE users SET encrypted_api_key = ?, updated_at = ? WHERE id = ?'
      );
      expect(mockEnv.DB.bind).toHaveBeenCalledWith(
        'encrypted-api-key',
        expect.any(Number),
        'test-user-id'
      );
      expect(mockEnv.DB.run).toHaveBeenCalled();
    });

    it('should return an error for an invalid API key', async () => {
      // Mock the request body
      mockContext.req.valid.mockReturnValue({ api_key: 'invalid-api-key' });
      
      // Mock the verifyApiKey function to return false
      (claudeService.verifyApiKey as jest.Mock).mockResolvedValue(false);
      
      // Call the route handler
      const app = new Hono();
      app.post('/apikey', userRoutes.routes['/apikey'].POST);
      
      // Create a mock execution context
      const executionContext = {
        waitUntil: jest.fn(),
        passThroughOnException: jest.fn(),
      };
      
      // Execute the route handler and expect it to throw an HTTPException
      await expect(
        app.fetch(
          new Request('http://localhost/apikey', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: 'invalid-api-key' }),
          }),
          mockEnv,
          executionContext
        )
      ).rejects.toThrow(HTTPException);
      
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
      const mockQueryOne = jest.fn().mockResolvedValue({ encrypted_api_key: 'encrypted-api-key' });
      jest.mock('../../utils/db', () => ({
        queryOne: mockQueryOne,
      }));
      
      // Call the route handler
      const app = new Hono();
      app.get('/apikey', userRoutes.routes['/apikey'].GET);
      
      // Create a mock execution context
      const executionContext = {
        waitUntil: jest.fn(),
        passThroughOnException: jest.fn(),
      };
      
      // Execute the route handler
      const response = await app.fetch(
        new Request('http://localhost/apikey', { method: 'GET' }),
        mockEnv,
        executionContext
      );
      
      // Verify the response
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({ exists: true });
    });

    it('should return false if the user does not have an API key', async () => {
      // Mock the queryOne function to return a user without an API key
      const mockQueryOne = jest.fn().mockResolvedValue({ encrypted_api_key: null });
      jest.mock('../../utils/db', () => ({
        queryOne: mockQueryOne,
      }));
      
      // Call the route handler
      const app = new Hono();
      app.get('/apikey', userRoutes.routes['/apikey'].GET);
      
      // Create a mock execution context
      const executionContext = {
        waitUntil: jest.fn(),
        passThroughOnException: jest.fn(),
      };
      
      // Execute the route handler
      const response = await app.fetch(
        new Request('http://localhost/apikey', { method: 'GET' }),
        mockEnv,
        executionContext
      );
      
      // Verify the response
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({ exists: false });
    });
  });
});
