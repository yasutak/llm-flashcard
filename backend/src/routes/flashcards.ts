import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../middleware/auth';
import { queryAll, queryOne } from '../utils/db';
import type { Env, Flashcard, CreateFlashcardRequest, UpdateFlashcardRequest } from '../types';

// Create a router for flashcard routes
const router = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all routes
router.use('*', authMiddleware());

// Validation schemas
const createFlashcardSchema = z.object({
  chat_id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
});

const updateFlashcardSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
});

// Get all flashcards for the current user
router.get('/', async (c) => {
  const userId = c.get('userId');
  
  try {
    const flashcards = await queryAll<Flashcard>(
      c.env.DB,
      'SELECT * FROM flashcards WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
    
    return c.json(flashcards);
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Get flashcards for a specific chat
router.get('/chat/:chatId', async (c) => {
  const userId = c.get('userId');
  const chatId = c.req.param('chatId');
  
  try {
    // Check if the chat exists and belongs to the user
    const chat = await queryOne(
      c.env.DB,
      'SELECT id FROM chats WHERE id = ? AND user_id = ?',
      [chatId, userId]
    );
    
    if (!chat) {
      throw new HTTPException(404, { message: 'Chat not found' });
    }
    
    // Get the flashcards
    const flashcards = await queryAll<Flashcard>(
      c.env.DB,
      'SELECT * FROM flashcards WHERE chat_id = ? AND user_id = ? ORDER BY updated_at DESC',
      [chatId, userId]
    );
    
    return c.json(flashcards);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Error fetching flashcards for chat:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Create a new flashcard
router.post(
  '/',
  zValidator('json', createFlashcardSchema),
  async (c) => {
    const { chat_id, question, answer } = c.req.valid('json') as CreateFlashcardRequest;
    const userId = c.get('userId');
    
    try {
      // Check if the chat exists and belongs to the user
      const chat = await queryOne(
        c.env.DB,
        'SELECT id FROM chats WHERE id = ? AND user_id = ?',
        [chat_id, userId]
      );
      
      if (!chat) {
        throw new HTTPException(404, { message: 'Chat not found' });
      }
      
      // Generate a unique ID
      const flashcardId = nanoid();
      
      // Get the current timestamp
      const now = Math.floor(Date.now() / 1000);
      
      // Insert the new flashcard
      await c.env.DB.prepare(
        'INSERT INTO flashcards (id, user_id, chat_id, question, answer, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(flashcardId, userId, chat_id, question, answer, now, now)
        .run();
      
      // Return the new flashcard
      return c.json({
        id: flashcardId,
        user_id: userId,
        chat_id,
        question,
        answer,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error('Error creating flashcard:', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }
);

// Update a flashcard
router.put(
  '/:flashcardId',
  zValidator('json', updateFlashcardSchema),
  async (c) => {
    const updates = c.req.valid('json') as UpdateFlashcardRequest;
    const userId = c.get('userId');
    const flashcardId = c.req.param('flashcardId');
    
    try {
      // Check if the flashcard exists and belongs to the user
      const flashcard = await queryOne<Flashcard>(
        c.env.DB,
        'SELECT * FROM flashcards WHERE id = ? AND user_id = ?',
        [flashcardId, userId]
      );
      
      if (!flashcard) {
        throw new HTTPException(404, { message: 'Flashcard not found' });
      }
      
      // Get the current timestamp
      const now = Math.floor(Date.now() / 1000);
      
      // Update the flashcard
      const question = updates.question ?? flashcard.question;
      const answer = updates.answer ?? flashcard.answer;
      
      await c.env.DB.prepare(
        'UPDATE flashcards SET question = ?, answer = ?, updated_at = ? WHERE id = ?'
      )
        .bind(question, answer, now, flashcardId)
        .run();
      
      // Return the updated flashcard
      return c.json({
        ...flashcard,
        question,
        answer,
        updated_at: now,
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error('Error updating flashcard:', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }
);

// Delete a flashcard
router.delete('/:flashcardId', async (c) => {
  const userId = c.get('userId');
  const flashcardId = c.req.param('flashcardId');
  
  try {
    // Check if the flashcard exists and belongs to the user
    const flashcard = await queryOne(
      c.env.DB,
      'SELECT id FROM flashcards WHERE id = ? AND user_id = ?',
      [flashcardId, userId]
    );
    
    if (!flashcard) {
      throw new HTTPException(404, { message: 'Flashcard not found' });
    }
    
    // Delete the flashcard
    await c.env.DB.prepare('DELETE FROM flashcards WHERE id = ?')
      .bind(flashcardId)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Error deleting flashcard:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

export default router;
