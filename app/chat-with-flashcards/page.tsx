"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { useChat } from "@/contexts/chat-context"
import { useFlashcards } from "@/contexts/flashcard-context"
import { ResponsiveSidebar } from "@/components/responsive-sidebar"
import { MobileRedirect } from "./mobile-redirect"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ApiError } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { BookOpen, RefreshCw, MessageSquare } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FlashcardCard } from "@/components/flashcard-card"
import { FlashcardNavigation } from "@/components/flashcard-navigation"
import { ChatMessages } from "@/components/chat-messages"

export default function ChatWithFlashcardsPage() {
  const { hasApiKey } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatId = searchParams.get('chatId')
  const { currentChat, messages, selectChat } = useChat()
  const { flashcards, fetchFlashcardsForChat } = useFlashcards()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"chat" | "flashcards">("chat")
  const [autoGenerateFlashcards, setAutoGenerateFlashcards] = useState(true)
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0)

  useEffect(() => {
    if (!hasApiKey) {
      router.push("/api-key")
    }
  }, [hasApiKey, router])

  useEffect(() => {
    if (chatId) {
      selectChat(chatId)
    }
  }, [chatId, selectChat])

  useEffect(() => {
    if (currentChat) {
      fetchFlashcardsForChat(currentChat.id)
    }
  }, [currentChat, fetchFlashcardsForChat])

  // If no chat is selected, show a message to select a chat
  if (!currentChat) {
    return (
      <div className="flex min-h-screen flex-col">
        <MainNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">No Chat Selected</h2>
            <p className="text-gray-600 mb-6">
              Please select a chat from the chat page or start a new chat to use the side-by-side view.
            </p>
            <Button 
              onClick={() => router.push('/chat')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Chat Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const renderChatPanel = () => (
    <div className="bg-white rounded-xl shadow-sm border border-[hsl(var(--border))] overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b">
        <MessageSquare className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Chat</h2>
      </div>
      <div className="h-[calc(100vh-20rem)]">
        <ChatMessages messages={messages} />
      </div>
    </div>
  )

  const renderFlashcardsPanel = () => (
    <div className="bg-white rounded-xl shadow-sm border border-[hsl(var(--border))] overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b">
        <BookOpen className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Flashcards</h2>
      </div>
      <div className="h-[calc(100vh-20rem)]">
        {flashcards.length > 0 ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-4">
              <FlashcardCard
                flashcard={flashcards[currentFlashcardIndex]}
                onFlip={() => {}}
                flipped={false}
              />
            </div>
            <div className="p-4 border-t">
              <FlashcardNavigation
                currentIndex={currentFlashcardIndex}
                totalCards={flashcards.length}
                onPrevious={() => setCurrentFlashcardIndex(prev => Math.max(0, prev - 1))}
                onNext={() => setCurrentFlashcardIndex(prev => Math.min(flashcards.length - 1, prev + 1))}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No flashcards available yet</p>
              <Button
                variant="outline"
                onClick={() => fetchFlashcardsForChat(currentChat.id)}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <MobileRedirect />
      <MainNav />
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Use the new ResponsiveSidebar component */}
        <ResponsiveSidebar currentChatId={chatId || undefined} />
        
        {/* Main content area */}
        <div className="flex-1 p-2 sm:p-3 md:p-4 bg-gradient-to-b from-blue-50 to-white">
          <div className="container-max">
            <div className="mb-6 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">Chat with Flashcards</h1>
              
              {/* Desktop navigation buttons - only visible on larger screens */}
              <div className="hidden md:flex items-center gap-3">
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
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/chat?chatId=${chatId}`)}
                  className="hidden md:flex bg-white shadow-sm hover-lift items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4 text-[hsl(var(--primary))]" />
                  Chat View
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/flashcards?chatId=${chatId}`)}
                  className="hidden md:flex bg-white shadow-sm hover-lift items-center gap-2"
                >
                  <BookOpen className="h-4 w-4 text-[hsl(var(--primary))]" />
                  Flashcards View
                </Button>
              </div>
              
              {/* Mobile toggle buttons - only visible on mobile */}
              <div className="flex md:hidden">
                <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={`px-3 py-2 rounded-lg flex items-center gap-1 text-sm ${
                      activeTab === "chat" 
                        ? "bg-[hsl(var(--primary))] text-white" 
                        : "text-gray-600"
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </button>
                  <button
                    onClick={() => setActiveTab("flashcards")}
                    className={`px-3 py-2 rounded-lg flex items-center gap-1 text-sm ${
                      activeTab === "flashcards" 
                        ? "bg-[hsl(var(--primary))] text-white" 
                        : "text-gray-600"
                    }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    Flashcards
                  </button>
                </div>
              </div>
            </div>
            
            {/* Mobile view - show only active tab */}
            <div className="block md:hidden">
              {activeTab === "chat" ? renderChatPanel() : renderFlashcardsPanel()}
              
              {/* Mobile auto-generate toggle */}
              <div className="mt-4 flex items-center justify-center bg-white p-3 rounded-xl shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-600">
                    Auto-generate flashcards
                  </div>
                  <Switch
                    checked={autoGenerateFlashcards}
                    onCheckedChange={setAutoGenerateFlashcards}
                    aria-label="Auto-generate flashcards"
                  />
                </div>
              </div>
            </div>
            
            {/* Desktop view - show grid layout for larger screens */}
            <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chat panel */}
              {renderChatPanel()}
              
              {/* Flashcards panel */}
              {renderFlashcardsPanel()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
