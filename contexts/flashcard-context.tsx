"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import type { Flashcard } from "@/types"
import { useAuth } from "./auth-context"
import { getFlashcards, getFlashcardsForChat, generateFlashcards, updateFlashcard, deleteFlashcard, generateFlashcardsFromMessage } from "@/services/flashcard-service"

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
  generateCardsFromMessage: (chatId: string, messageId: string) => Promise<void>
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
      // Get flashcards from the API
      const fetchedFlashcards = await getFlashcards()
      setFlashcards(fetchedFlashcards)
    } catch (error) {
      console.error("Error fetching flashcards:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFlashcardsForChat = async (chatId: string) => {
    setIsLoading(true)
    try {
      // Get flashcards for the chat from the API
      const chatFlashcards = await getFlashcardsForChat(chatId)
      setFlashcards(chatFlashcards)
    } catch (error) {
      console.error("Error fetching flashcards for chat:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateCard = async (id: string, updates: Partial<Flashcard>) => {
    setIsLoading(true)
    try {
      // Update the flashcard via the API
      const updatedCard = await updateFlashcard(id, updates)
      
      // Update the local state
      const updatedFlashcards = flashcards.map((card) =>
        card.id === id ? updatedCard : card
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
      // Delete the flashcard via the API
      await deleteFlashcard(id)
      
      // Update the local state
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
      // Call the real API endpoint to generate flashcards
      await generateFlashcards(chatId)
      
      // Fetch the updated flashcards for this chat
      const updatedFlashcards = await getFlashcardsForChat(chatId)
      setFlashcards(updatedFlashcards)
    } catch (error) {
      console.error("Error generating flashcards:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const generateCardsFromMessage = async (chatId: string, messageId: string) => {
    setIsLoading(true)
    try {
      // Call the API endpoint to generate flashcards from a specific message
      await generateFlashcardsFromMessage(chatId, messageId)
      
      // Fetch the updated flashcards for this chat
      const updatedFlashcards = await getFlashcardsForChat(chatId)
      setFlashcards(updatedFlashcards)
    } catch (error) {
      console.error("Error generating flashcards from message:", error)
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
        generateCardsFromMessage,
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
