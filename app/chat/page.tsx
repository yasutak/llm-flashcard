"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ApiKeySetup } from "@/components/api-key-setup"
import { Send, Bot, UserIcon, Lightbulb, Plus, MessageSquare } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useChat } from "@/contexts/chat-context"
import { useFlashcards } from "@/contexts/flashcard-context"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ChatPage() {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { hasApiKey } = useAuth()
  const { currentChat, messages, sendingMessage, sendChatMessage, startNewChat, chats, selectChat } = useChat()
  const { generateCardsFromChat } = useFlashcards()
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || sendingMessage) return

    try {
      await sendChatMessage(input)
      setInput("")
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Failed to send your message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleGenerateFlashcards = async () => {
    if (!currentChat) return

    try {
      await generateCardsFromChat(currentChat.id)
      toast({
        title: "Flashcards generated",
        description: "Flashcards have been created from this conversation",
      })
    } catch (error) {
      toast({
        title: "Error generating flashcards",
        description: "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!hasApiKey) {
    return (
      <div className="flex min-h-screen flex-col">
        <MainNav />
        <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
          <ApiKeySetup />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Chat sidebar */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800">
          <div className="p-4">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 mb-4" onClick={startNewChat}>
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>

            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="space-y-2">
                {chats.map((chat) => (
                  <Button
                    key={chat.id}
                    variant="ghost"
                    className={`w-full justify-start text-left truncate ${
                      currentChat?.id === chat.id ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : ""
                    }`}
                    onClick={() => selectChat(chat.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{chat.title}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-blue-50 to-white">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl space-y-4 pb-20">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-700 mb-2">Welcome to LLM Flashcard Chat</h2>
                  <p className="text-gray-500 mb-6">
                    Start a conversation with Claude to generate flashcards automatically
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Bot className="h-5 w-5" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === "user" ? "bg-blue-600 text-white" : "bg-white border border-blue-200"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <div className={`text-xs mt-1 ${message.role === "user" ? "text-blue-100" : "text-gray-400"}`}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    {message.role === "user" && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                        <UserIcon className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {sendingMessage && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="rounded-lg bg-white border border-blue-200 px-4 py-2">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></div>
                      <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse delay-150"></div>
                      <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse delay-300"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t p-4">
            <div className="mx-auto max-w-3xl flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0 border-blue-200 text-blue-600"
                    disabled={!currentChat || messages.length === 0}
                  >
                    <Lightbulb className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleGenerateFlashcards}>
                    Generate flashcards from this chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Claude..."
                className="min-h-[50px] resize-none border-blue-200 focus:border-blue-500"
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || sendingMessage}
                className="flex-shrink-0 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

