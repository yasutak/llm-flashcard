"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import type { Chat, Message } from "@/types"
import { getChats, getChat, createChat, sendMessage } from "@/services/chat-service"
import { useAuth } from "./auth-context"

interface ChatContextType {
  chats: Chat[]
  currentChat: Chat | null
  messages: Message[]
  isLoading: boolean
  sendingMessage: boolean
  fetchChats: () => Promise<void>
  selectChat: (chatId: string) => Promise<void>
  startNewChat: () => Promise<void>
  sendChatMessage: (content: string) => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [sendingMessage, setSendingMessage] = useState<boolean>(false)

  useEffect(() => {
    if (user) {
      fetchChats()
    }
  }, [user])

  const fetchChats = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const fetchedChats = await getChats()
      setChats(fetchedChats)

      // If there's a current chat, refresh its data
      if (currentChat) {
        await selectChat(currentChat.id)
      }
    } catch (error) {
      console.error("Error fetching chats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectChat = async (chatId: string) => {
    setIsLoading(true)
    try {
      const { chat, messages: chatMessages } = await getChat(chatId)
      setCurrentChat(chat)
      setMessages(chatMessages)
    } catch (error) {
      console.error("Error selecting chat:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const startNewChat = async () => {
    setIsLoading(true)
    try {
      const newChat = await createChat()
      setChats([newChat, ...chats])
      setCurrentChat(newChat)
      setMessages([])
      return newChat
    } catch (error) {
      console.error("Error creating new chat:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const sendChatMessage = async (content: string) => {
    if (!currentChat) {
      const newChat = await startNewChat()
      if (!newChat) return
    }

    setSendingMessage(true)
    try {
      const chatId = currentChat?.id as string

      // Optimistically add user message to UI
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        chat_id: chatId,
        role: "user",
        content,
        created_at: Date.now(),
      }

      setMessages([...messages, tempUserMessage])

      // Send message to API
      const savedMessage = await sendMessage(chatId, content)

      // Replace temp message with saved message
      setMessages((prev) => prev.map((msg) => (msg.id === tempUserMessage.id ? savedMessage : msg)))

      // Wait for assistant response
      // In a real app, you might use polling or WebSockets here
      // For now, we'll simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Refresh messages to get assistant response
      const { messages: updatedMessages } = await getChat(chatId)
      setMessages(updatedMessages)
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChat,
        messages,
        isLoading,
        sendingMessage,
        fetchChats,
        selectChat,
        startNewChat,
        sendChatMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}

