"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import type { Flashcard } from "@/types"
import { useAuth } from "./auth-context"

// Dummy flashcard data
const dummyFlashcards: Flashcard[] = [
  {
    id: "1",
    user_id: "user1",
    chat_id: "chat1",
    question: "What is the capital of France?",
    answer: "Paris",
    created_at: Date.now() - 1000000,
    updated_at: Date.now() - 1000000,
  },
  {
    id: "2",
    user_id: "user1",
    chat_id: "chat1",
    question: 'Who wrote "Romeo and Juliet"?',
    answer: "William Shakespeare",
    created_at: Date.now() - 900000,
    updated_at: Date.now() - 900000,
  },
  {
    id: "3",
    user_id: "user1",
    chat_id: "chat2",
    question: "What is the largest planet in our solar system?",
    answer: "Jupiter",
    created_at: Date.now() - 800000,
    updated_at: Date.now() - 800000,
  },
  {
    id: "4",
    user_id: "user1",
    chat_id: "chat2",
    question: "What is the chemical symbol for gold?",
    answer: "Au",
    created_at: Date.now() - 700000,
    updated_at: Date.now() - 700000,
  },
  {
    id: "5",
    user_id: "user1",
    chat_id: "chat3",
    question: "In which year did World War II end?",
    answer: "1945",
    created_at: Date.now() - 600000,
    updated_at: Date.now() - 600000,
  },
]

interface FlashcardContextType {
  flashcards: Flashcard[]
  isLoading: boolean
  fetchFlashcards: () => Promise<void>
  fetchFlashcardsForChat: (chatId: string) => Promise<void>
  updateCard: (id: string, updates: Partial<Flashcard>) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  generateCardsFromChat: (chatId: string) => Promise<void>
}

const FlashcardContext = createContext<FlashcardContextType | undefined>(undefined)

export function FlashcardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [flashcards, setFlashcards] = useState<Flashcard[]>(dummyFlashcards)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    if (user) {
      fetchFlashcards()
    }
  }, [user])

  const fetchFlashcards = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setFlashcards(dummyFlashcards)
    } catch (error) {
      console.error("Error fetching flashcards:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFlashcardsForChat = async (chatId: string) => {
    setIsLoading(true)
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const filteredFlashcards = dummyFlashcards.filter((card) => card.chat_id === chatId)
      setFlashcards(filteredFlashcards)
    } catch (error) {
      console.error("Error fetching flashcards for chat:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateCard = async (id: string, updates: Partial<Flashcard>) => {
    setIsLoading(true)
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      const updatedFlashcards = flashcards.map((card) =>
        card.id === id ? { ...card, ...updates, updated_at: Date.now() } : card,
      )
      setFlashcards(updatedFlashcards)
    } catch (error) {
      console.error("Error updating flashcard:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCard = async (id: string) => {
    setIsLoading(true)
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      const updatedFlashcards = flashcards.filter((card) => card.id !== id)
      setFlashcards(updatedFlashcards)
    } catch (error) {
      console.error("Error deleting flashcard:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const generateCardsFromChat = async (chatId: string) => {
    setIsLoading(true)
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const newCard: Flashcard = {
        id: `${Date.now()}`,
        user_id: user?.id || "user1",
        chat_id: chatId,
        question: "What is a new question generated from this chat?",
        answer: "This is a simulated answer for the newly generated flashcard.",
        created_at: Date.now(),
        updated_at: Date.now(),
      }
      setFlashcards([...flashcards, newCard])
    } catch (error) {
      console.error("Error generating flashcards:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FlashcardContext.Provider
      value={{
        flashcards,
        isLoading,
        fetchFlashcards,
        fetchFlashcardsForChat,
        updateCard,
        deleteCard,
        generateCardsFromChat,
      }}
    >
      {children}
    </FlashcardContext.Provider>
  )
}

export function useFlashcards() {
  const context = useContext(FlashcardContext)
  if (context === undefined) {
    throw new Error("useFlashcards must be used within a FlashcardProvider")
  }
  return context
}

