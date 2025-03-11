import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../middleware/auth';
import { queryAll, queryOne } from '../utils/db';
import type { Env, Deck, Flashcard, CreateDeckRequest, UpdateDeckRequest } from '../types';

// Create a router for deck routes
const router = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all routes
router.use('*', authMiddleware());

// Validation schemas
const createDeckSchema = z.object({
  chat_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
});

const updateDeckSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
});

// Get all decks for the current user
router.get('/', async (c) => {
  const userId = c.get('userId');
  
  try {
    const decks = await queryAll<Deck>(
      c.env.DB,
      'SELECT * FROM decks WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
    
    return c.json(decks);
  } catch (error) {
    console.error('Error fetching decks:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Get a specific deck with its flashcards
router.get('/:deckId', async (c) => {
  const userId = c.get('userId');
  const deckId = c.req.param('deckId');
  
  try {
    // Get the deck
    const deck = await queryOne<Deck>(
      c.env.DB,
      'SELECT * FROM decks WHERE id = ? AND user_id = ?',
      [deckId, userId]
    );
    
    if (!deck) {
      throw new HTTPException(404, { message: 'Deck not found' });
    }
    
    // Get the flashcards
    const flashcards = await queryAll<Flashcard>(
      c.env.DB,
      'SELECT * FROM flashcards WHERE deck_id = ? AND user_id = ? ORDER BY updated_at DESC',
      [deckId, userId]
    );
    
    return c.json({ deck, flashcards });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Error fetching deck:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Create a new deck
router.post(
  '/',
  zValidator('json', createDeckSchema),
  async (c) => {
    const { chat_id, title, description, color } = c.req.valid('json') as CreateDeckRequest;
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
      const deckId = nanoid();
      
      // Get the current timestamp
      const now = Math.floor(Date.now() / 1000);
      
      // Insert the new deck
      await c.env.DB.prepare(
        'INSERT INTO decks (id, user_id, chat_id, title, description, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(deckId, userId, chat_id, title, description || null, color || null, now, now)
        .run();
      
      // Return the new deck
      return c.json({
        id: deckId,
        user_id: userId,
        chat_id,
        title,
        description,
        color,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error('Error creating deck:', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }
);

// Update a deck
router.put(
  '/:deckId',
  zValidator('json', updateDeckSchema),
  async (c) => {
    const updates = c.req.valid('json') as UpdateDeckRequest;
    const userId = c.get('userId');
    const deckId = c.req.param('deckId');
    
    try {
      // Check if the deck exists and belongs to the user
      const deck = await queryOne<Deck>(
        c.env.DB,
        'SELECT * FROM decks WHERE id = ? AND user_id = ?',
        [deckId, userId]
      );
      
      if (!deck) {
        throw new HTTPException(404, { message: 'Deck not found' });
      }
      
      // Get the current timestamp
      const now = Math.floor(Date.now() / 1000);
      
      // Prepare the update values
      const title = updates.title ?? deck.title;
      const description = updates.description ?? deck.description;
      const color = updates.color ?? deck.color;
      
      // Update the deck
      await c.env.DB.prepare(
        'UPDATE decks SET title = ?, description = ?, color = ?, updated_at = ? WHERE id = ?'
      )
        .bind(title, description, color, now, deckId)
        .run();
      
      // Return the updated deck
      return c.json({
        ...deck,
        title,
        description,
        color,
        updated_at: now,
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error('Error updating deck:', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }
);

// Delete a deck
router.delete('/:deckId', async (c) => {
  const userId = c.get('userId');
  const deckId = c.req.param('deckId');
  
  try {
    // Check if the deck exists and belongs to the user
    const deck = await queryOne<Deck>(
      c.env.DB,
      'SELECT id FROM decks WHERE id = ? AND user_id = ?',
      [deckId, userId]
    );
    
    if (!deck) {
      throw new HTTPException(404, { message: 'Deck not found' });
    }
    
    // Delete the deck (flashcards will be deleted by the ON DELETE CASCADE constraint)
    await c.env.DB.prepare('DELETE FROM decks WHERE id = ?')
      .bind(deckId)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Error deleting deck:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Get flashcards for a specific deck
router.get('/:deckId/flashcards', async (c) => {
  const userId = c.get('userId');
  const deckId = c.req.param('deckId');
  
  try {
    // Check if the deck exists and belongs to the user
    const deck = await queryOne<Deck>(
      c.env.DB,
      'SELECT id FROM decks WHERE id = ? AND user_id = ?',
      [deckId, userId]
    );
    
    if (!deck) {
      throw new HTTPException(404, { message: 'Deck not found' });
    }
    
    // Get the flashcards
    const flashcards = await queryAll<Flashcard>(
      c.env.DB,
      'SELECT * FROM flashcards WHERE deck_id = ? AND user_id = ? ORDER BY updated_at DESC',
      [deckId, userId]
    );
    
    return c.json(flashcards);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Error fetching flashcards for deck:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

export default router;
