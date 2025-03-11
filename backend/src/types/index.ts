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

// Flashcard types
export interface Flashcard {
  id: string;
  user_id: string;
  chat_id: string;
  question: string;
  answer: string;
  created_at: number;
  updated_at: number;
}

export interface CreateFlashcardRequest {
  chat_id: string;
  question: string;
  answer: string;
}

export interface UpdateFlashcardRequest {
  question?: string;
  answer?: string;
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
}

// Extend Hono's Context type to include our custom properties
declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
  }
}
