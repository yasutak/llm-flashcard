import type { Flashcard, Deck } from "@/types"
import { fetchWithAuth } from "./api"

// Deck functions
export async function getDecks(): Promise<Deck[]> {
  return fetchWithAuth<Deck[]>("/decks")
}

export async function getDeck(deckId: string): Promise<{ deck: Deck; flashcards: Flashcard[] }> {
  return fetchWithAuth<{ deck: Deck; flashcards: Flashcard[] }>(`/decks/${deckId}`)
}

export async function updateDeck(deckId: string, title: string): Promise<Deck> {
  return fetchWithAuth<Deck>(`/decks/${deckId}`, {
    method: "PUT",
    body: JSON.stringify({ title }),
  })
}

export async function deleteDeck(deckId: string): Promise<void> {
  await fetchWithAuth(`/decks/${deckId}`, {
    method: "DELETE",
  })
}

// Flashcard functions
export async function getFlashcards(): Promise<Flashcard[]> {
  return fetchWithAuth<Flashcard[]>("/flashcards")
}

export async function getFlashcardsForDeck(deckId: string): Promise<Flashcard[]> {
  return fetchWithAuth<Flashcard[]>(`/decks/${deckId}/flashcards`)
}

export async function createFlashcard(
  flashcard: Omit<Flashcard, "id" | "user_id" | "created_at" | "updated_at">,
): Promise<Flashcard> {
  return fetchWithAuth<Flashcard>("/flashcards", {
    method: "POST",
    body: JSON.stringify(flashcard),
  })
}

export async function updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard> {
  return fetchWithAuth<Flashcard>(`/flashcards/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  })
}

export async function deleteFlashcard(id: string): Promise<void> {
  await fetchWithAuth(`/flashcards/${id}`, {
    method: "DELETE",
  })
}

// For backward compatibility
export async function getFlashcardsForChat(chatId: string): Promise<Flashcard[]> {
  // First, try to get the deck for this chat
  try {
    // Use the direct endpoint to get flashcards for a chat
    return fetchWithAuth<Flashcard[]>(`/flashcards/chat/${chatId}`)
  } catch (error) {
    console.error("Error fetching flashcards for chat:", error)
    // If there's an error, return an empty array
    return []
  }
}

// Flashcard generation functions
export async function generateFlashcards(chatId: string): Promise<{ deck_id: string }> {
  const response = await fetchWithAuth<{ success: boolean; count: number; deck_id: string }>(`/chats/${chatId}/generate-flashcards`, {
    method: "POST",
  })
  return { deck_id: response.deck_id }
}

export async function generateFlashcardsFromMessage(chatId: string, messageId: string): Promise<{ deck_id: string }> {
  const response = await fetchWithAuth<{ success: boolean; count: number; deck_id: string }>(`/chats/${chatId}/messages/${messageId}/generate-flashcards`, {
    method: "POST",
  })
  return { deck_id: response.deck_id }
}
