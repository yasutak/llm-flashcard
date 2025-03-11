import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../middleware/auth';
import { queryAll, queryOne } from '../utils/db';
import type { Env, FlashcardReview, CreateFlashcardReviewRequest } from '../types';

// Create a router for flashcard review routes
const router = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all routes
router.use('*', authMiddleware());

// Validation schemas
const createFlashcardReviewSchema = z.object({
  flashcard_id: z.string().min(1),
  score: z.number().min(0).max(5),
});

// Get all reviews for a specific flashcard
router.get('/flashcard/:flashcardId', async (c) => {
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
    
    // Get the reviews
    const reviews = await queryAll<FlashcardReview>(
      c.env.DB,
      'SELECT * FROM flashcard_reviews WHERE flashcard_id = ? AND user_id = ? ORDER BY review_time DESC',
      [flashcardId, userId]
    );
    
    return c.json(reviews);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Error fetching flashcard reviews:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Create a new flashcard review
router.post(
  '/',
  zValidator('json', createFlashcardReviewSchema),
  async (c) => {
    const { flashcard_id, score } = c.req.valid('json') as CreateFlashcardReviewRequest;
    const userId = c.get('userId');
    
    try {
      // Check if the flashcard exists and belongs to the user
      const flashcard = await queryOne(
        c.env.DB,
        'SELECT * FROM flashcards WHERE id = ? AND user_id = ?',
        [flashcard_id, userId]
      );
      
      if (!flashcard) {
        throw new HTTPException(404, { message: 'Flashcard not found' });
      }
      
      // Generate a unique ID
      const reviewId = nanoid();
      
      // Get the current timestamp
      const now = Math.floor(Date.now() / 1000);
      
      // Insert the new review
      await c.env.DB.prepare(
        'INSERT INTO flashcard_reviews (id, user_id, flashcard_id, score, review_time) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(reviewId, userId, flashcard_id, score, now)
        .run();
      
      // Update the flashcard's review count and last_reviewed timestamp
      const reviewCount = (flashcard.review_count || 0) + 1;
      
      await c.env.DB.prepare(
        'UPDATE flashcards SET review_count = ?, last_reviewed = ?, updated_at = ? WHERE id = ?'
      )
        .bind(reviewCount, now, now, flashcard_id)
        .run();
      
      // Return the new review
      return c.json({
        id: reviewId,
        user_id: userId,
        flashcard_id,
        score,
        review_time: now,
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error('Error creating flashcard review:', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }
);

// Get review statistics for a user
router.get('/stats', async (c) => {
  const userId = c.get('userId');
  
  try {
    // Get the total number of reviews
    const totalReviews = await queryOne<{ count: number }>(
      c.env.DB,
      'SELECT COUNT(*) as count FROM flashcard_reviews WHERE user_id = ?',
      [userId]
    );
    
    // Get the average score
    const averageScore = await queryOne<{ avg: number }>(
      c.env.DB,
      'SELECT AVG(score) as avg FROM flashcard_reviews WHERE user_id = ?',
      [userId]
    );
    
    // Get the number of reviews per day for the last 7 days
    const reviewsPerDay = await queryAll<{ day: number; count: number }>(
      c.env.DB,
      `SELECT 
        CAST(review_time / 86400 as INTEGER) as day, 
        COUNT(*) as count 
      FROM flashcard_reviews 
      WHERE user_id = ? AND review_time > ? 
      GROUP BY day 
      ORDER BY day DESC 
      LIMIT 7`,
      [userId, Math.floor(Date.now() / 1000) - 7 * 86400]
    );
    
    return c.json({
      total_reviews: totalReviews?.count || 0,
      average_score: averageScore?.avg || 0,
      reviews_per_day: reviewsPerDay,
    });
  } catch (error) {
    console.error('Error fetching review statistics:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

export default router;
