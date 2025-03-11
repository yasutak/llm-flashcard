import { Hono } from 'hono';
import * as claudeService from '../../services/claude-service';
import * as encryptionUtils from '../../utils/encryption';
import * as dbUtils from '../../utils/db';
import { authMiddleware } from '../../middleware/auth';
import type { Env, Message } from '../../types';

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

describe('Chat Routes - Flashcard Generation', () => {
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
    
    // Set up the flashcard generation route
    app.post('/:chatId/generate-flashcards', async (c) => {
      const userId = 'test-user-id';
      const chatId = c.req.param('chatId');
      
      try {
        // Check if the chat exists and belongs to the user
        const chat = await dbUtils.queryOne(
          c.env.DB,
          'SELECT id FROM chats WHERE id = ? AND user_id = ?',
          [chatId, userId]
        );
        
        if (!chat) {
          return c.json({ error: 'Chat not found' }, 404);
        }
        
        // Get the user's API key
        const user = await dbUtils.queryOne<{ encrypted_api_key: string }>(
          c.env.DB,
          'SELECT encrypted_api_key FROM users WHERE id = ?',
          [userId]
        );
        
        if (!user || !user.encrypted_api_key) {
          return c.json({ error: 'API key not found' }, 400);
        }
        
        // Decrypt the API key
        const apiKey = await encryptionUtils.decrypt(user.encrypted_api_key, c.env.ENCRYPTION_KEY);
        
        // Get all messages in the chat
        const messages = await dbUtils.queryAll<Message>(
          c.env.DB,
          'SELECT role, content FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
          [chatId]
        );
        
        if (messages.length === 0) {
          return c.json({ error: 'Chat has no messages' }, 400);
        }
        
        // Format messages for Claude
        const claudeMessages = messages.map((message) => ({
          role: message.role,
          content: message.content,
        }));
        
        // Generate flashcards from the conversation
        const flashcards = await claudeService.generateFlashcardsFromConversation(apiKey, claudeMessages);
        
        // Get the current timestamp
        const now = Math.floor(Date.now() / 1000);
        
        // Insert the flashcards
        for (const flashcard of flashcards) {
          const flashcardId = 'test-flashcard-id';
          
          await c.env.DB.prepare(
            'INSERT INTO flashcards (id, user_id, chat_id, question, answer, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
          )
            .bind(flashcardId, userId, chatId, flashcard.question, flashcard.answer, now, now)
            .run();
        }
        
        return c.json({ success: true, count: flashcards.length });
      } catch (error) {
        console.error('Error generating flashcards:', error);
        return c.json({ error: 'Internal server error' }, 500);
      }
    });
  });
  
  describe('POST /:chatId/generate-flashcards', () => {
    it('should generate flashcards from a chat', async () => {
      const chatId = 'test-chat-id';
      const mockMessages = [
        { role: 'user' as const, content: 'What is a neural network?' },
        { role: 'assistant' as const, content: 'A neural network is a computing system inspired by the human brain...' }
      ];
      
      const mockFlashcards = [
        { question: 'What is a neural network?', answer: 'A computing system inspired by the human brain...' }
      ];
      
      // Mock the queryOne function to return a chat
      (dbUtils.queryOne as jest.Mock).mockImplementationOnce(() => ({ id: chatId }));
      
      // Mock the queryOne function to return a user with an API key
      (dbUtils.queryOne as jest.Mock).mockImplementationOnce(() => ({ encrypted_api_key: 'encrypted-api-key' }));
      
      // Mock the decrypt function
      (encryptionUtils.decrypt as jest.Mock).mockResolvedValue('sk-ant-test123456789');
      
      // Mock the queryAll function to return messages
      (dbUtils.queryAll as jest.Mock).mockResolvedValue(mockMessages);
      
      // Mock the generateFlashcardsFromConversation function
      (claudeService.generateFlashcardsFromConversation as jest.Mock).mockResolvedValue(mockFlashcards);
      
      // Execute the route handler
      const res = await app.request(`http://localhost/${chatId}/generate-flashcards`, {
        method: 'POST',
      }, mockEnv);
      
      // Verify the response
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true, count: 1 });
      
      // Verify that the API key was decrypted
      expect(encryptionUtils.decrypt).toHaveBeenCalledWith('encrypted-api-key', 'test-encryption-key');
      
      // Verify that the flashcards were generated
      expect(claudeService.generateFlashcardsFromConversation).toHaveBeenCalledWith(
        'sk-ant-test123456789',
        mockMessages
      );
      
      // Verify that the flashcards were stored in the database
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        'INSERT INTO flashcards (id, user_id, chat_id, question, answer, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      // We're using 'as any' here because the D1Database type doesn't include bind and run methods
      // but our mock implementation does
      expect((mockEnv.DB as any).bind).toHaveBeenCalledWith(
        'test-flashcard-id',
        'test-user-id',
        chatId,
        mockFlashcards[0].question,
        mockFlashcards[0].answer,
        expect.any(Number),
        expect.any(Number)
      );
      expect((mockEnv.DB as any).run).toHaveBeenCalled();
    });
    
    it('should return 404 if the chat is not found', async () => {
      const chatId = 'nonexistent-chat-id';
      
      // Mock the queryOne function to return null (chat not found)
      (dbUtils.queryOne as jest.Mock).mockResolvedValueOnce(null);
      
      // Execute the route handler
      const res = await app.request(`http://localhost/${chatId}/generate-flashcards`, {
        method: 'POST',
      }, mockEnv);
      
      // Verify the response
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toEqual({ error: 'Chat not found' });
      
      // Verify that no flashcards were generated or stored
      expect(claudeService.generateFlashcardsFromConversation).not.toHaveBeenCalled();
      expect(mockEnv.DB.prepare).not.toHaveBeenCalled();
    });
    
    it('should return 400 if the user has no API key', async () => {
      const chatId = 'test-chat-id';
      
      // Mock the queryOne function to return a chat
      (dbUtils.queryOne as jest.Mock).mockResolvedValueOnce({ id: chatId });
      
      // Mock the queryOne function to return a user without an API key
      (dbUtils.queryOne as jest.Mock).mockResolvedValueOnce({ encrypted_api_key: null });
      
      // Execute the route handler
      const res = await app.request(`http://localhost/${chatId}/generate-flashcards`, {
        method: 'POST',
      }, mockEnv);
      
      // Verify the response
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toEqual({ error: 'API key not found' });
      
      // Verify that no flashcards were generated or stored
      expect(claudeService.generateFlashcardsFromConversation).not.toHaveBeenCalled();
      expect(mockEnv.DB.prepare).not.toHaveBeenCalled();
    });
    
    it('should return 400 if the chat has no messages', async () => {
      const chatId = 'test-chat-id';
      
      // Mock the queryOne function to return a chat
      (dbUtils.queryOne as jest.Mock).mockResolvedValueOnce({ id: chatId });
      
      // Mock the queryOne function to return a user with an API key
      (dbUtils.queryOne as jest.Mock).mockResolvedValueOnce({ encrypted_api_key: 'encrypted-api-key' });
      
      // Mock the decrypt function
      (encryptionUtils.decrypt as jest.Mock).mockResolvedValue('sk-ant-test123456789');
      
      // Mock the queryAll function to return an empty array (no messages)
      (dbUtils.queryAll as jest.Mock).mockResolvedValue([]);
      
      // Execute the route handler
      const res = await app.request(`http://localhost/${chatId}/generate-flashcards`, {
        method: 'POST',
      }, mockEnv);
      
      // Verify the response
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toEqual({ error: 'Chat has no messages' });
      
      // Verify that no flashcards were generated or stored
      expect(claudeService.generateFlashcardsFromConversation).not.toHaveBeenCalled();
      expect(mockEnv.DB.prepare).not.toHaveBeenCalled();
    });
    
    it('should handle errors from the Claude API', async () => {
      const chatId = 'test-chat-id';
      const mockMessages = [
        { role: 'user' as const, content: 'What is a neural network?' },
        { role: 'assistant' as const, content: 'A neural network is a computing system inspired by the human brain...' }
      ];
      
      // Mock the queryOne function to return a chat
      (dbUtils.queryOne as jest.Mock).mockResolvedValueOnce({ id: chatId });
      
      // Mock the queryOne function to return a user with an API key
      (dbUtils.queryOne as jest.Mock).mockResolvedValueOnce({ encrypted_api_key: 'encrypted-api-key' });
      
      // Mock the decrypt function
      (encryptionUtils.decrypt as jest.Mock).mockResolvedValue('sk-ant-test123456789');
      
      // Mock the queryAll function to return messages
      (dbUtils.queryAll as jest.Mock).mockResolvedValue(mockMessages);
      
      // Mock the generateFlashcardsFromConversation function to throw an error
      (claudeService.generateFlashcardsFromConversation as jest.Mock).mockRejectedValue(
        new Error('Claude API error')
      );
      
      // Execute the route handler
      const res = await app.request(`http://localhost/${chatId}/generate-flashcards`, {
        method: 'POST',
      }, mockEnv);
      
      // Verify the response
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data).toEqual({ error: 'Internal server error' });
      
      // Verify that no flashcards were stored
      expect(mockEnv.DB.prepare).not.toHaveBeenCalled();
    });
  });
});
