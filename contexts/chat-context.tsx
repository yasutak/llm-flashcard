"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import type { Chat, Message } from "@/types"
import { getChats, getChat, createChat, sendMessage } from "@/services/chat-service"
import { generateFlashcardsFromMessage } from "@/services/flashcard-service"
import { useAuth } from "./auth-context"
import { useToast } from "@/hooks/use-toast"

interface ChatContextType {
  chats: Chat[]
  currentChat: Chat | null
  messages: Message[]
  isLoading: boolean
  sendingMessage: boolean
  autoGenerateFlashcards: boolean
  setAutoGenerateFlashcards: (value: boolean) => void
  fetchChats: () => Promise<void>
  selectChat: (chatId: string) => Promise<void>
  startNewChat: () => Promise<Chat | undefined>
  sendChatMessage: (content: string) => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [sendingMessage, setSendingMessage] = useState<boolean>(false)
  const [autoGenerateFlashcards, setAutoGenerateFlashcards] = useState<boolean>(false)

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
    // Ensure we have a valid chat to send the message to
    let chatId: string;
    
    if (!currentChat) {
      try {
        // Create a new chat and get its ID
        const newChat = await startNewChat();
        if (!newChat) return;
        chatId = newChat.id;
      } catch (error) {
        console.error("Failed to create new chat:", error);
        throw error;
      }
    } else {
      chatId = currentChat.id;
    }

    setSendingMessage(true);
    try {
      // Optimistically add user message to UI
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        chat_id: chatId,
        role: "user",
        content,
        created_at: Date.now(),
      };

      setMessages([...messages, tempUserMessage]);

      // Send message to API
      const savedMessage = await sendMessage(chatId, content);

      // Replace temp message with saved message
      setMessages((prev) => prev.map((msg) => (msg.id === tempUserMessage.id ? savedMessage : msg)));

      // Wait for assistant response
      // In a real app, you might use polling or WebSockets here
      // For now, we'll simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Refresh messages to get assistant response
      const { messages: updatedMessages } = await getChat(chatId);
      setMessages(updatedMessages);
      
      // If auto-generate flashcards is enabled, generate flashcards from the assistant's response
      if (autoGenerateFlashcards) {
        try {
          // Find the latest assistant message
          const assistantMessage = updatedMessages.find(msg => msg.role === 'assistant');
          if (assistantMessage) {
            await generateFlashcardsFromMessage(chatId, assistantMessage.id);
            toast({
              title: "Flashcards generated",
              description: "Flashcards have been automatically created from the assistant's response",
            });
          }
        } catch (error) {
          console.error("Error auto-generating flashcards:", error);
          toast({
            title: "Error generating flashcards",
            description: "Failed to automatically generate flashcards",
            variant: "destructive",
          });
        }
      }
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
        autoGenerateFlashcards,
        setAutoGenerateFlashcards,
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
