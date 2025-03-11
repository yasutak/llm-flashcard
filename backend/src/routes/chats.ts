import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../middleware/auth';
import { queryAll, queryOne } from '../utils/db';
import { decrypt } from '../utils/encryption';
import { sendMessageToClaude, generateFlashcardsFromConversation, generateFlashcardsFromMessage, generateChatTitle } from '../services/claude-service';
import type { Env, Chat, Message, CreateChatRequest, SendMessageRequest } from '../types';

// Create a router for chat routes
const router = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all routes
router.use('*', authMiddleware());

// Validation schemas
const createChatSchema = z.object({
  title: z.string().min(1).max(100),
});

const updateChatSchema = z.object({
  title: z.string().min(1).max(100),
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
});

// Get all chats for the current user
router.get('/', async (c) => {
  const userId = c.get('userId');
  
  try {
    const chats = await queryAll<Chat>(
      c.env.DB,
      'SELECT * FROM chats WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
    
    return c.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Get a specific chat with its messages
router.get('/:chatId', async (c) => {
  const userId = c.get('userId');
  const chatId = c.req.param('chatId');
  
  try {
    // Get the chat
    const chat = await queryOne<Chat>(
      c.env.DB,
      'SELECT * FROM chats WHERE id = ? AND user_id = ?',
      [chatId, userId]
    );
    
    if (!chat) {
      throw new HTTPException(404, { message: 'Chat not found' });
    }
    
    // Get the messages
    const messages = await queryAll<Message>(
      c.env.DB,
      'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
      [chatId]
    );
    
    return c.json({ chat, messages });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Error fetching chat:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Create a new chat
router.post(
  '/',
  zValidator('json', createChatSchema),
  async (c) => {
    const { title } = c.req.valid('json') as CreateChatRequest;
    const userId = c.get('userId');
    
    try {
      // Generate a unique ID
      const chatId = nanoid();
      
      // Get the current timestamp
      const now = Math.floor(Date.now() / 1000);
      
      // Insert the new chat
      await c.env.DB.prepare(
        'INSERT INTO chats (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(chatId, userId, title, now, now)
        .run();
      
      // Return the new chat
      return c.json({
        id: chatId,
        user_id: userId,
        title,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }
);

// Get the deck for a specific chat
router.get('/:chatId/deck', async (c) => {
  const userId = c.get('userId');
  const chatId = c.req.param('chatId');
  
  try {
    // Check if the chat exists and belongs to the user
    const chat = await queryOne<Chat>(
      c.env.DB,
      'SELECT id FROM chats WHERE id = ? AND user_id = ?',
      [chatId, userId]
    );
    
    if (!chat) {
      throw new HTTPException(404, { message: 'Chat not found' });
    }
    
    // Get the deck for this chat
    const deck = await queryOne(
      c.env.DB,
      'SELECT * FROM decks WHERE chat_id = ? AND user_id = ?',
      [chatId, userId]
    );
    
    if (!deck) {
      throw new HTTPException(404, { message: 'Deck not found for this chat' });
    }
    
    return c.json({ deck });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Error fetching deck for chat:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Update a chat
router.patch(
  '/:chatId',
  zValidator('json', updateChatSchema),
  async (c) => {
    const { title } = c.req.valid('json');
    const userId = c.get('userId');
    const chatId = c.req.param('chatId');
    
    try {
      // Check if the chat exists and belongs to the user
      const chat = await queryOne<Chat>(
        c.env.DB,
        'SELECT id FROM chats WHERE id = ? AND user_id = ?',
        [chatId, userId]
      );
      
      if (!chat) {
        throw new HTTPException(404, { message: 'Chat not found' });
      }
      
      // Update the chat title
      const now = Math.floor(Date.now() / 1000);
      await c.env.DB.prepare('UPDATE chats SET title = ?, updated_at = ? WHERE id = ?')
        .bind(title, now, chatId)
        .run();
      
      // Check if there's a deck associated with this chat
      const deck = await queryOne(
        c.env.DB,
        'SELECT id FROM decks WHERE chat_id = ?',
        [chatId]
      );
      
      // If a deck exists, update its title too
      if (deck) {
        await c.env.DB.prepare('UPDATE decks SET title = ?, updated_at = ? WHERE id = ?')
          .bind(title, now, deck.id)
          .run();
      }
      
      return c.json({
        id: chatId,
        user_id: userId,
        title,
        updated_at: now,
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error('Error updating chat:', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }
);

// Delete a chat
router.delete('/:chatId', async (c) => {
  const userId = c.get('userId');
  const chatId = c.req.param('chatId');
  
  try {
    // Check if the chat exists and belongs to the user
    const chat = await queryOne<Chat>(
      c.env.DB,
      'SELECT id FROM chats WHERE id = ? AND user_id = ?',
      [chatId, userId]
    );
    
    if (!chat) {
      throw new HTTPException(404, { message: 'Chat not found' });
    }
    
    // Delete the chat (messages will be deleted by the ON DELETE CASCADE constraint)
    await c.env.DB.prepare('DELETE FROM chats WHERE id = ?')
      .bind(chatId)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Error deleting chat:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Send a message to a chat
router.post(
  '/:chatId/messages',
  zValidator('json', sendMessageSchema),
  async (c) => {
    const { content } = c.req.valid('json') as SendMessageRequest;
    const userId = c.get('userId');
    const chatId = c.req.param('chatId');
    
    try {
      // Check if the chat exists and belongs to the user
      const chat = await queryOne<Chat>(
        c.env.DB,
        'SELECT id, title FROM chats WHERE id = ? AND user_id = ?',
        [chatId, userId]
      );
      
      if (!chat) {
        throw new HTTPException(404, { message: 'Chat not found' });
      }
      
      // Get the user's API key
      const user = await queryOne<{ encrypted_api_key: string }>(
        c.env.DB,
        'SELECT encrypted_api_key FROM users WHERE id = ?',
        [userId]
      );
      
      if (!user || !user.encrypted_api_key) {
        throw new HTTPException(400, { message: 'API key not found' });
      }
      
      // Decrypt the API key
      const apiKey = await decrypt(user.encrypted_api_key, c.env.ENCRYPTION_KEY);
      
      // Get the current timestamp
      const now = Math.floor(Date.now() / 1000);
      
      // Generate a unique ID for the user message
      const userMessageId = nanoid();
      
      // Insert the user message
      await c.env.DB.prepare(
        'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(userMessageId, chatId, 'user', content, now)
        .run();
      
      // Get all messages in the chat for context
      const messages = await queryAll<Message>(
        c.env.DB,
        'SELECT role, content FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
        [chatId]
      );
      
      // Format messages for Claude
      const claudeMessages = messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));
      
      // Send the message to Claude
      const assistantResponse = await sendMessageToClaude(apiKey, claudeMessages);
      
      // Generate a unique ID for the assistant message
      const assistantMessageId = nanoid();
      
      // Insert the assistant message
      await c.env.DB.prepare(
        'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(assistantMessageId, chatId, 'assistant', assistantResponse, Math.floor(Date.now() / 1000))
        .run();
      
      // Update the chat's updated_at timestamp
      await c.env.DB.prepare('UPDATE chats SET updated_at = ? WHERE id = ?')
        .bind(Math.floor(Date.now() / 1000), chatId)
        .run();
      
      // Check if this is the first assistant message and the chat title is "New Chat"
      if (messages.length === 1 && messages[0].role === 'user' && chat.title === 'New Chat') {
        try {
          // Generate a title for the chat
          const title = await generateChatTitle(apiKey, assistantResponse);
          
          // Update the chat title
          await c.env.DB.prepare('UPDATE chats SET title = ? WHERE id = ?')
            .bind(title, chatId)
            .run();
          
          // Check if a deck already exists for this chat
          const existingDeck = await queryOne(
            c.env.DB,
            'SELECT id FROM decks WHERE chat_id = ?',
            [chatId]
          );
          
          // If no deck exists, create one
          if (!existingDeck) {
            // Generate a unique ID for the deck
            const deckId = nanoid();
            
            // Create a deck with the same title as the chat
            await c.env.DB.prepare(
              'INSERT INTO decks (id, user_id, chat_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
            )
              .bind(deckId, userId, chatId, title, now, now)
              .run();
            
            console.log('Created deck for chat:', chatId, 'with title:', title);
          }
        } catch (titleError) {
          // Log the error but don't fail the request
          console.error('Error generating title for chat:', titleError);
        }
      }
      
      // Return the assistant message
      return c.json({
        id: assistantMessageId,
        chat_id: chatId,
        role: 'assistant',
        content: assistantResponse,
        created_at: Math.floor(Date.now() / 1000),
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error('Error sending message:', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }
);

// Generate flashcards from a specific message
router.post('/:chatId/messages/:messageId/generate-flashcards', async (c) => {
  const userId = c.get('userId');
  const chatId = c.req.param('chatId');
  const messageId = c.req.param('messageId');
  
  try {
    // Check if the chat exists and belongs to the user
    const chat = await queryOne<Chat>(
      c.env.DB,
      'SELECT id FROM chats WHERE id = ? AND user_id = ?',
      [chatId, userId]
    );
    
    if (!chat) {
      throw new HTTPException(404, { message: 'Chat not found' });
    }
    
    // Check if the message exists and belongs to the chat
    const message = await queryOne<Message>(
      c.env.DB,
      'SELECT id, content, role FROM messages WHERE id = ? AND chat_id = ?',
      [messageId, chatId]
    );
    
    if (!message) {
      throw new HTTPException(404, { message: 'Message not found' });
    }
    
    // Only generate flashcards from assistant messages
    if (message.role !== 'assistant') {
      throw new HTTPException(400, { message: 'Can only generate flashcards from assistant messages' });
    }
    
    // Get the user's API key
    const user = await queryOne<{ encrypted_api_key: string }>(
      c.env.DB,
      'SELECT encrypted_api_key FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user || !user.encrypted_api_key) {
      throw new HTTPException(400, { message: 'API key not found' });
    }
    
    // Decrypt the API key
    const apiKey = await decrypt(user.encrypted_api_key, c.env.ENCRYPTION_KEY);
    
    // Get or create a deck for this chat
    let deck = await queryOne<{ id: string, title: string }>(
      c.env.DB,
      'SELECT id, title FROM decks WHERE chat_id = ?',
      [chatId]
    );
    
    if (!deck) {
      // Get the chat title
      const chatDetails = await queryOne<{ title: string }>(
        c.env.DB,
        'SELECT title FROM chats WHERE id = ?',
        [chatId]
      );
      
      if (!chatDetails) {
        throw new HTTPException(404, { message: 'Chat details not found' });
      }
      
      // Create a new deck
      const deckId = nanoid();
      const now = Math.floor(Date.now() / 1000);
      
      await c.env.DB.prepare(
        'INSERT INTO decks (id, user_id, chat_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
        .bind(deckId, userId, chatId, chatDetails.title, now, now)
        .run();
      
      deck = { id: deckId, title: chatDetails.title };
    }
    
    // Generate flashcards from the message
    const flashcards = await generateFlashcardsFromMessage(apiKey, message.content);
    
    // Get the current timestamp
    const now = Math.floor(Date.now() / 1000);
    
    // Insert the flashcards
    for (const flashcard of flashcards) {
      const flashcardId = nanoid();
      
      await c.env.DB.prepare(
        'INSERT INTO flashcards (id, user_id, deck_id, question, answer, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(flashcardId, userId, deck.id, flashcard.question, flashcard.answer, now, now)
        .run();
    }
    
    return c.json({ success: true, count: flashcards.length, deck_id: deck.id });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Error generating flashcards from message:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Generate flashcards from a chat
router.post('/:chatId/generate-flashcards', async (c) => {
  const userId = c.get('userId');
  const chatId = c.req.param('chatId');
  
  try {
    // Check if the chat exists and belongs to the user
    const chat = await queryOne<Chat>(
      c.env.DB,
      'SELECT id, title FROM chats WHERE id = ? AND user_id = ?',
      [chatId, userId]
    );
    
    if (!chat) {
      throw new HTTPException(404, { message: 'Chat not found' });
    }
    
    // Get the user's API key
    const user = await queryOne<{ encrypted_api_key: string }>(
      c.env.DB,
      'SELECT encrypted_api_key FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user || !user.encrypted_api_key) {
      throw new HTTPException(400, { message: 'API key not found' });
    }
    
    // Decrypt the API key
    const apiKey = await decrypt(user.encrypted_api_key, c.env.ENCRYPTION_KEY);
    
    // Get all messages in the chat
    const messages = await queryAll<Message>(
      c.env.DB,
      'SELECT role, content FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
      [chatId]
    );
    
    if (messages.length === 0) {
      throw new HTTPException(400, { message: 'Chat has no messages' });
    }
    
    // Get or create a deck for this chat
    let deck = await queryOne<{ id: string, title: string }>(
      c.env.DB,
      'SELECT id, title FROM decks WHERE chat_id = ?',
      [chatId]
    );
    
    if (!deck) {
      // Create a new deck
      const deckId = nanoid();
      const now = Math.floor(Date.now() / 1000);
      
      await c.env.DB.prepare(
        'INSERT INTO decks (id, user_id, chat_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
        .bind(deckId, userId, chatId, chat.title, now, now)
        .run();
      
      deck = { id: deckId, title: chat.title };
    }
    
    // Format messages for Claude
    const claudeMessages = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));
    
    // Generate flashcards from the conversation
    const flashcards = await generateFlashcardsFromConversation(apiKey, claudeMessages);
    
    // Get the current timestamp
    const now = Math.floor(Date.now() / 1000);
    
    // Insert the flashcards
    for (const flashcard of flashcards) {
      const flashcardId = nanoid();
      
      await c.env.DB.prepare(
        'INSERT INTO flashcards (id, user_id, deck_id, question, answer, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(flashcardId, userId, deck.id, flashcard.question, flashcard.answer, now, now)
        .run();
    }
    
    return c.json({ success: true, count: flashcards.length, deck_id: deck.id });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Error generating flashcards:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

export default router;
