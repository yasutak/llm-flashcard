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

// Deck types
export interface Deck {
  id: string
  user_id: string
  chat_id: string
  title: string
  description?: string
  color?: string
  created_at: number
  updated_at: number
}

// Flashcard types
export interface Flashcard {
  id: string
  user_id: string
  deck_id: string
  question: string
  answer: string
  difficulty?: number // 0-5 scale for difficulty
  last_reviewed?: number // Timestamp of last review
  review_count?: number // Number of times reviewed
  created_at: number
  updated_at: number
}

// Flashcard Review types
export interface FlashcardReview {
  id: string
  user_id: string
  flashcard_id: string
  score: number // 0-5 scale for how well the user remembered
  review_time: number // Timestamp of the review
}

// API Key type
export interface ApiKeyRequest {
  api_key: string
}

export interface ApiKeyStatus {
  exists: boolean
}
