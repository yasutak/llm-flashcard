import type { Flashcard } from "@/types"
import { fetchWithAuth } from "./api"

export async function getFlashcards(): Promise<Flashcard[]> {
  return fetchWithAuth<Flashcard[]>("/flashcards")
}

export async function getFlashcardsForChat(chatId: string): Promise<Flashcard[]> {
  return fetchWithAuth<Flashcard[]>(`/flashcards/chat/${chatId}`)
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

export async function generateFlashcards(chatId: string): Promise<void> {
  await fetchWithAuth(`/chats/${chatId}/generate-flashcards`, {
    method: "POST",
  })
}

