// Type definitions for the backend

// User types
export interface User {
  id: string;
  username: string;
  password_hash: string;
  encrypted_api_key?: string;
  created_at: number;
  updated_at: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

// Chat types
export interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: number;
}

export interface CreateChatRequest {
  title: string;
}

export interface SendMessageRequest {
  content: string;
}

// Deck types
export interface Deck {
  id: string;
  user_id: string;
  chat_id: string;
  title: string;
  description?: string;
  color?: string;
  created_at: number;
  updated_at: number;
}

export interface CreateDeckRequest {
  chat_id: string;
  title: string;
  description?: string;
  color?: string;
}

export interface UpdateDeckRequest {
  title?: string;
  description?: string;
  color?: string;
}

// Flashcard types
export interface Flashcard {
  id: string;
  user_id: string;
  deck_id: string;
  question: string;
  answer: string;
  difficulty?: number; // 0-5 scale for difficulty
  last_reviewed?: number; // Timestamp of last review
  review_count?: number; // Number of times reviewed
  created_at: number;
  updated_at: number;
}

export interface CreateFlashcardRequest {
  deck_id: string;
  question: string;
  answer: string;
  difficulty?: number;
}

export interface UpdateFlashcardRequest {
  question?: string;
  answer?: string;
  difficulty?: number;
  review_count?: number;
  last_reviewed?: number;
}

// Flashcard Review types
export interface FlashcardReview {
  id: string;
  user_id: string;
  flashcard_id: string;
  score: number; // 0-5 scale for how well the user remembered
  review_time: number; // Timestamp of the review
}

export interface CreateFlashcardReviewRequest {
  flashcard_id: string;
  score: number;
}

// API Key types
export interface ApiKeyRequest {
  api_key: string;
}

export interface ApiKeyResponse {
  exists: boolean;
}

// Environment bindings for Cloudflare Workers
export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  [key: string]: any; // Add index signature
}

// Extend Hono's Context type to include our custom properties
declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
  }
}
