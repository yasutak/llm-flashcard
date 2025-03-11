import type { Chat, Message } from "@/types"
import { fetchWithAuth } from "./api"

export async function getChats(): Promise<Chat[]> {
  return fetchWithAuth<Chat[]>("/chats")
}

export async function getChat(chatId: string): Promise<{ chat: Chat; messages: Message[] }> {
  return fetchWithAuth<{ chat: Chat; messages: Message[] }>(`/chats/${chatId}`)
}

export async function createChat(title = "New Chat"): Promise<Chat> {
  return fetchWithAuth<Chat>("/chats", {
    method: "POST",
    body: JSON.stringify({ title }),
  })
}

export async function deleteChat(chatId: string): Promise<void> {
  await fetchWithAuth(`/chats/${chatId}`, {
    method: "DELETE",
  })
}

export async function sendMessage(chatId: string, content: string): Promise<Message> {
  return fetchWithAuth<Message>(`/chats/${chatId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  })
}

