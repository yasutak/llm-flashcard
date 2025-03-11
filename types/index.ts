export interface User {
  id: string
  username: string
  created_at: number
  updated_at: number
  has_api_key: boolean
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterCredentials extends LoginCredentials {
  confirmPassword: string
}

// Chat types
export interface Chat {
  id: string
  user_id: string
  title: string
  created_at: number
  updated_at: number
}

export interface Message {
  id: string
  chat_id: string
  role: "user" | "assistant"
  content: string
  created_at: number
}

// Flashcard types
export interface Flashcard {
  id: string
  user_id: string
  chat_id: string
  question: string
  answer: string
  created_at: number
  updated_at: number
}

// API Key type
export interface ApiKeyRequest {
  api_key: string
}

export interface ApiKeyStatus {
  exists: boolean
}

