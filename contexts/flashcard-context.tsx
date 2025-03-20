"use client"

import { createContext, useContext, useState, type ReactNode, useEffect, useRef } from "react"
import type { Flashcard, Deck } from "@/types"
import { useAuth } from "./auth-context"
import { 
  getFlashcards, 
  getFlashcardsForChat, 
  getFlashcardsForDeck,
  generateFlashcards, 
  updateFlashcard, 
  deleteFlashcard, 
  generateFlashcardsFromMessage,
  getDecks,
  getDeck,
  updateDeck,
  deleteDeck,
  createFlashcard
} from "@/services/flashcard-service"

// Dummy flashcard data
const dummyFlashcards: Flashcard[] = [
  {
    id: "1",
    user_id: "user1",
    deck_id: "deck1",
    question: "What is the capital of France?",
    answer: "Paris",
    created_at: Date.now() - 1000000,
    updated_at: Date.now() - 1000000,
  },
  {
    id: "2",
    user_id: "user1",
    deck_id: "deck1",
    question: 'Who wrote "Romeo and Juliet"?',
    answer: "William Shakespeare",
    created_at: Date.now() - 900000,
    updated_at: Date.now() - 900000,
  },
  {
    id: "3",
    user_id: "user1",
    deck_id: "deck2",
    question: "What is the largest planet in our solar system?",
    answer: "Jupiter",
    created_at: Date.now() - 800000,
    updated_at: Date.now() - 800000,
  },
  {
    id: "4",
    user_id: "user1",
    deck_id: "deck2",
    question: "What is the chemical symbol for gold?",
    answer: "Au",
    created_at: Date.now() - 700000,
    updated_at: Date.now() - 700000,
  },
  {
    id: "5",
    user_id: "user1",
    deck_id: "deck3",
    question: "In which year did World War II end?",
    answer: "1945",
    created_at: Date.now() - 600000,
    updated_at: Date.now() - 600000,
  },
]

// Dummy deck data
const dummyDecks: Deck[] = [
  {
    id: "deck1",
    user_id: "user1",
    chat_id: "chat1",
    title: "General Knowledge",
    created_at: Date.now() - 1000000,
    updated_at: Date.now() - 1000000,
  },
  {
    id: "deck2",
    user_id: "user1",
    chat_id: "chat2",
    title: "Science",
    created_at: Date.now() - 800000,
    updated_at: Date.now() - 800000,
  },
  {
    id: "deck3",
    user_id: "user1",
    chat_id: "chat3",
    title: "History",
    created_at: Date.now() - 600000,
    updated_at: Date.now() - 600000,
  },
]

interface FlashcardContextType {
  flashcards: Flashcard[]
  decks: Deck[]
  currentDeck: Deck | null
  isLoading: boolean
  fetchFlashcards: () => Promise<void>
  fetchDecks: () => Promise<void>
  fetchDeck: (deckId: string) => Promise<void>
  fetchFlashcardsForDeck: (deckId: string) => Promise<void>
  fetchFlashcardsForChat: (chatId: string) => Promise<void>
  updateCard: (id: string, updates: Partial<Flashcard>) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  createCard: (data: { question: string; answer: string; deck_id: string }) => Promise<void>
  updateDeckTitle: (deckId: string, title: string) => Promise<void>
  deleteDeck: (deckId: string) => Promise<void>
  generateCardsFromChat: (chatId: string) => Promise<{ deck_id: string }>
  generateCardsFromMessage: (chatId: string, messageId: string) => Promise<{ deck_id: string }>
}

const FlashcardContext = createContext<FlashcardContextType | undefined>(undefined)

export function FlashcardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [flashcards, setFlashcards] = useState<Flashcard[]>(dummyFlashcards)
  const [decks, setDecks] = useState<Deck[]>(dummyDecks)
  const [currentDeck, setCurrentDeck] = useState<Deck | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    if (user) {
      fetchDecks()
      fetchFlashcards()
    }
  }, [user])

  // Fetch all decks
  const fetchDecks = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const fetchedDecks = await getDecks()
      setDecks(fetchedDecks)
    } catch (error) {
      console.error("Error fetching decks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch a specific deck with its flashcards
  const fetchDeck = async (deckId: string) => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await getDeck(deckId)
      setCurrentDeck(response.deck)
      setFlashcards(response.flashcards)
    } catch (error) {
      console.error("Error fetching deck:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Use a ref to track if a fetch for deck is already in progress
  const isFetchingDeckRef = useRef(false)
  // Use a ref to track the last fetch for deck time
  const lastFetchDeckTimeRef = useRef(0)

  // Fetch flashcards for a specific deck
  const fetchFlashcardsForDeck = async (deckId: string) => {
    if (!user) return

    // Check if we're already fetching or if we've fetched recently
    const now = Date.now()
    if (isFetchingDeckRef.current || (now - lastFetchDeckTimeRef.current < FETCH_COOLDOWN)) {
      console.log("Fetch deck request debounced - already fetching or too soon since last fetch")
      return
    }

    // Set the fetching flag and update last fetch time
    isFetchingDeckRef.current = true
    lastFetchDeckTimeRef.current = now
    
    setIsLoading(true)
    try {
      const deckFlashcards = await getFlashcardsForDeck(deckId)
      setFlashcards(deckFlashcards)
    } catch (error) {
      console.error("Error fetching flashcards for deck:", error)
    } finally {
      setIsLoading(false)
      // Reset the fetching flag after a short delay
      setTimeout(() => {
        isFetchingDeckRef.current = false
      }, 500)
    }
  }

  // Update a deck's title
  const updateDeckTitle = async (deckId: string, title: string) => {
    setIsLoading(true)
    try {
      const updatedDeck = await updateDeck(deckId, title)
      
      // Update the local state
      const updatedDecks = decks.map((deck) =>
        deck.id === deckId ? updatedDeck : deck
      )
      setDecks(updatedDecks)
      
      // Update current deck if it's the one being updated
      if (currentDeck && currentDeck.id === deckId) {
        setCurrentDeck(updatedDeck)
      }
    } catch (error) {
      console.error("Error updating deck title:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Delete a deck
  const deleteDeckById = async (deckId: string) => {
    setIsLoading(true)
    try {
      await deleteDeck(deckId)
      
      // Update the local state
      const updatedDecks = decks.filter((deck) => deck.id !== deckId)
      setDecks(updatedDecks)
      
      // Clear current deck if it's the one being deleted
      if (currentDeck && currentDeck.id === deckId) {
        setCurrentDeck(null)
      }
      
      // Remove flashcards associated with this deck
      const updatedFlashcards = flashcards.filter((card) => card.deck_id !== deckId)
      setFlashcards(updatedFlashcards)
    } catch (error) {
      console.error("Error deleting deck:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Use a ref to track if a fetch is already in progress
  const isFetchingRef = useRef(false)
  // Use a ref to track the last fetch time to prevent rapid successive calls
  const lastFetchTimeRef = useRef(0)
  // Minimum time between fetches in milliseconds
  const FETCH_COOLDOWN = 2000

  const fetchFlashcards = async () => {
    if (!user) return

    // Check if we're already fetching or if we've fetched recently
    const now = Date.now()
    if (isFetchingRef.current || (now - lastFetchTimeRef.current < FETCH_COOLDOWN)) {
      console.log("Fetch request debounced - already fetching or too soon since last fetch")
      return
    }

    // Set the fetching flag and update last fetch time
    isFetchingRef.current = true
    lastFetchTimeRef.current = now
    
    setIsLoading(true)
    try {
      // Get flashcards from the API
      const fetchedFlashcards = await getFlashcards()
      setFlashcards(fetchedFlashcards)
    } catch (error) {
      console.error("Error fetching flashcards:", error)
    } finally {
      setIsLoading(false)
      // Reset the fetching flag after a short delay
      setTimeout(() => {
        isFetchingRef.current = false
      }, 500)
    }
  }

  // Use a ref to track if a fetch for chat is already in progress
  const isFetchingChatRef = useRef(false)
  // Use a ref to track the last fetch for chat time
  const lastFetchChatTimeRef = useRef(0)

  const fetchFlashcardsForChat = async (chatId: string) => {
    // Check if we're already fetching or if we've fetched recently
    const now = Date.now()
    if (isFetchingChatRef.current || (now - lastFetchChatTimeRef.current < FETCH_COOLDOWN)) {
      console.log("Fetch chat request debounced - already fetching or too soon since last fetch")
      return
    }

    // Set the fetching flag and update last fetch time
    isFetchingChatRef.current = true
    lastFetchChatTimeRef.current = now
    
    setIsLoading(true)
    try {
      // Get flashcards for the chat from the API
      const chatFlashcards = await getFlashcardsForChat(chatId)
      setFlashcards(chatFlashcards)
    } catch (error) {
      console.error("Error fetching flashcards for chat:", error)
    } finally {
      setIsLoading(false)
      // Reset the fetching flag after a short delay
      setTimeout(() => {
        isFetchingChatRef.current = false
      }, 500)
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

  const createCard = async (data: { question: string; answer: string; deck_id: string }) => {
    setIsLoading(true)
    try {
      // Create the flashcard via the API
      const newCard = await createFlashcard(data)
      
      // Update the local state
      setFlashcards([newCard, ...flashcards])
    } catch (error) {
      console.error("Error creating flashcard:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const generateCardsFromChat = async (chatId: string): Promise<{ deck_id: string }> => {
    setIsLoading(true)
    try {
      // Call the real API endpoint to generate flashcards
      const result = await generateFlashcards(chatId)
      
      // Fetch the updated flashcards for this chat
      const updatedFlashcards = await getFlashcardsForChat(chatId)
      setFlashcards(updatedFlashcards)
      
      return result
    } catch (error) {
      console.error("Error generating flashcards:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const generateCardsFromMessage = async (chatId: string, messageId: string): Promise<{ deck_id: string }> => {
    setIsLoading(true)
    try {
      // Call the API endpoint to generate flashcards from a specific message
      const result = await generateFlashcardsFromMessage(chatId, messageId)
      
      // Fetch the updated flashcards for this chat
      const updatedFlashcards = await getFlashcardsForChat(chatId)
      setFlashcards(updatedFlashcards)
      
      return result
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
        decks,
        currentDeck,
        isLoading,
        fetchFlashcards,
        fetchDecks,
        fetchDeck,
        fetchFlashcardsForDeck,
        fetchFlashcardsForChat,
        updateCard,
        deleteCard,
        createCard,
        updateDeckTitle,
        deleteDeck: deleteDeckById,
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
