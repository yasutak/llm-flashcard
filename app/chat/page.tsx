"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { useChat } from "@/contexts/chat-context"
import { useRouter } from "next/navigation"
import { ResponsiveSidebar } from "@/components/responsive-sidebar"
import { ChatMessages } from "@/components/chat-messages"
import { Edit, Save, BookOpen, Layout } from "lucide-react"
import { GenerateFlashcardsButton } from "@/components/generate-flashcards-button"

export default function ChatPage() {
  const [editedTitle, setEditedTitle] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const { hasApiKey } = useAuth()
  const { currentChat, messages, selectChat, autoGenerateFlashcards, setAutoGenerateFlashcards } = useChat()
  const router = useRouter()

  useEffect(() => {
    if (!hasApiKey) {
      router.push("/api-key")
    }
  }, [hasApiKey, router])

  if (!hasApiKey) {
    return null // Return null while redirecting
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Use the responsive sidebar component */}
        <ResponsiveSidebar currentChatId={currentChat?.id} />

        {/* Main chat area */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-blue-50 to-white overflow-hidden">
          {/* Chat header with title */}
          {currentChat && (
            <div className="bg-white border-b border-[hsl(var(--border))] p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center justify-between w-full">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-xl font-semibold text-gray-800 bg-transparent border-b border-gray-300 focus:outline-none focus:border-[hsl(var(--primary))]"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingTitle(false)
                        setEditedTitle(currentChat.title)
                      }}
                      className="text-gray-500 hover:text-[hsl(var(--primary))]"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement title update
                        setIsEditingTitle(false)
                      }}
                      className="text-gray-500 hover:text-[hsl(var(--primary))]"
                    >
                      <Save className="h-4 w-4 mr-1.5" />
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <h1 className="text-xl font-semibold text-gray-800">{currentChat.title}</h1>
                    <div className="flex items-center gap-3">
                      {/* Auto-generate flashcards toggle */}
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-600 whitespace-nowrap">
                          Auto-generate
                          <span className="hidden sm:inline"> flashcards</span>
                        </div>
                        <Switch
                          checked={autoGenerateFlashcards}
                          onCheckedChange={setAutoGenerateFlashcards}
                          aria-label="Auto-generate flashcards"
                        />
                      </div>
                      <GenerateFlashcardsButton chatId={currentChat.id} />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditingTitle(true)
                          setEditedTitle(currentChat.title)
                        }}
                        className="text-gray-500 hover:text-[hsl(var(--primary))]"
                      >
                        <Edit className="h-4 w-4 mr-1.5" />
                        Rename
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat messages */}
          <div className="flex-1 overflow-hidden">
            <ChatMessages messages={messages} />
          </div>
        </div>
      </div>
    </div>
  )
}
