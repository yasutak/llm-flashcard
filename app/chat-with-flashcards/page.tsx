"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { useChat } from "@/contexts/chat-context"
import { useFlashcards } from "@/contexts/flashcard-context"
import { ChatSidebar } from "@/components/chat-sidebar"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ApiError } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, RefreshCw, Send, MessageSquare } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MarkdownView } from "./markdown-view"
import { FlashcardCard } from "@/components/flashcard-card"
import { FlashcardNavigation } from "@/components/flashcard-navigation"

export default function ChatWithFlashcardsPage() {
  const { hasApiKey } = useAuth()
  const { currentChat, messages, selectChat, sendChatMessage, sendingMessage } = useChat()
  const { flashcards, decks, fetchFlashcardsForDeck, fetchDecks, generateCardsFromChat, isLoading } = useFlashcards()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Chat input state
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Flashcard review state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  
  // Get chatId from URL query parameters
  const chatId = searchParams.get('chatId')
  
  // Use refs to track loading state
  const loadedChatRef = useRef<string | null>(null)
  const isLoadingDecksRef = useRef(false)
  
  useEffect(() => {
    if (!hasApiKey) {
      router.push("/api-key")
      return
    }
    
    // Load chat data
    if (chatId) {
      selectChat(chatId)
    }
  }, [chatId, hasApiKey, router, selectChat])
  
  // Fetch decks for the selected chat
  useEffect(() => {
    if (!chatId || !hasApiKey || isLoadingDecksRef.current) return
    
    if (loadedChatRef.current !== chatId) {
      isLoadingDecksRef.current = true
      loadedChatRef.current = chatId
      
      // Fetch decks
      fetchDecks()
        .finally(() => {
          isLoadingDecksRef.current = false
        })
    }
  }, [chatId, hasApiKey, fetchDecks])
  
  // Find the corresponding deck and load flashcards when decks are loaded
  useEffect(() => {
    if (!chatId || decks.length === 0) return
    
    // Find the deck associated with this chat
    const deck = decks.find(d => d.chat_id === chatId)
    if (deck) {
      // Always update the selected deck ID when we find a matching deck
      setSelectedDeckId(deck.id)
      fetchFlashcardsForDeck(deck.id)
    }
  }, [chatId, decks, fetchFlashcardsForDeck])
  
  // Scroll to bottom only when new messages are added
  const prevMessagesLengthRef = useRef(0);
  
  useEffect(() => {
    // Only scroll when messages are added, not on initial load
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    
    // Update the previous length reference
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || sendingMessage || !chatId) return
    
    try {
      await sendChatMessage(input)
      setInput("")
    } catch (error) {
      let errorMessage = "Failed to send message"
      
      if (error instanceof ApiError) {
        errorMessage = error.getDetailedMessage()
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }
  
  // Handle key press in the textarea
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  const handlePrevious = () => {
    setFlipped(false)
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1))
  }

  const handleNext = () => {
    setFlipped(false)
    setCurrentIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0))
  }

  const handleFlip = () => {
    setFlipped((prev) => !prev)
  }
  
  // Generate flashcards from chat
  const handleGenerateFlashcards = async () => {
    if (!chatId) return
    
    try {
      const result = await generateCardsFromChat(chatId)
      if (result && result.deck_id) {
        setSelectedDeckId(result.deck_id)
        fetchFlashcardsForDeck(result.deck_id)
        toast({
          title: "Flashcards generated",
          description: "Your flashcards have been created successfully",
        })
      }
    } catch (error) {
      let errorMessage = "Failed to generate flashcards"
      
      if (error instanceof ApiError) {
        errorMessage = error.getDetailedMessage()
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }
  
  if (!hasApiKey) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }
  
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
  
  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Chat sidebar */}
        <ChatSidebar currentChatId={chatId || undefined} />
        
        {/* Main content area */}
        <div className="flex-1 p-6 bg-gradient-to-b from-blue-50 to-white">
          <div className="container-max">
            <div className="mb-6 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">Chat with Flashcards</h1>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/chat?chatId=${chatId}`)}
                  className="bg-white shadow-sm hover-lift"
                >
                  <MessageSquare className="h-4 w-4 mr-2 text-[hsl(var(--primary))]" />
                  Chat View
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/flashcards?chatId=${chatId}`)}
                  className="bg-white shadow-sm hover-lift"
                >
                  <BookOpen className="h-4 w-4 mr-2 text-[hsl(var(--primary))]" />
                  Flashcards View
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chat panel */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[hsl(var(--border))]">
                <div className="p-4 bg-[hsl(var(--primary-light))] border-b border-[hsl(var(--border))]">
                  <h2 className="text-lg font-semibold text-[hsl(var(--primary))]">{currentChat.title}</h2>
                </div>
                <div className="flex flex-col h-[calc(100vh-20rem)]">
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                      {messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`p-4 rounded-xl ${
                            message.role === "user" 
                              ? "bg-[hsl(var(--primary-light))] ml-8 border border-[hsl(var(--primary-light))]" 
                              : "bg-white mr-8 border border-[hsl(var(--border))]"
                          }`}
                        >
                          <div className="text-sm font-medium mb-2 text-[hsl(var(--primary))]">
                            {message.role === "user" ? "You" : "Claude"}
                          </div>
                          <div className="whitespace-pre-wrap">
                            {message.role === "assistant" ? (
                              <MarkdownView content={message.content} />
                            ) : (
                              message.content
                            )}
                          </div>
                        </div>
                      ))}
                      {sendingMessage && (
                        <div className="p-4 rounded-xl bg-white mr-8 border border-[hsl(var(--border))]">
                          <div className="text-sm font-medium mb-2 text-[hsl(var(--primary))]">Claude</div>
                          <div className="flex space-x-3">
                            <div className="h-2.5 w-2.5 rounded-full bg-gray-400 animate-pulse"></div>
                            <div className="h-2.5 w-2.5 rounded-full bg-gray-400 animate-pulse delay-150"></div>
                            <div className="h-2.5 w-2.5 rounded-full bg-gray-400 animate-pulse delay-300"></div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  
                  {/* Chat input */}
                  <div className="p-4 border-t border-[hsl(var(--border))]">
                    <div className="flex gap-2">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message Claude..."
                        className="min-h-[50px] resize-none border-[hsl(var(--border))] focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))] rounded-lg"
                        rows={1}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || sendingMessage}
                        className="flex-shrink-0 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-hover))] rounded-lg shadow-sm hover-lift"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Flashcards panel */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[hsl(var(--border))]">
                <div className="p-4 bg-gray-100 border-b border-[hsl(var(--border))]">
                  <h2 className="text-lg font-semibold text-gray-700">Flashcards</h2>
                </div>
                <div className="p-5 flex flex-col items-center h-[calc(100vh-20rem)]">
                  {!selectedDeckId ? (
                    <div className="text-center py-16 flex flex-col items-center justify-center h-full">
                      <div className="inline-flex p-4 rounded-full bg-gray-100 mb-6">
                        <BookOpen className="h-8 w-8 text-gray-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">No deck selected</h3>
                      <p className="text-gray-500 mb-6">
                        Generate flashcards from this conversation to review the material
                      </p>
                      <Button 
                        className="bg-gray-800 hover:bg-gray-700 text-white shadow-sm hover-lift"
                        onClick={handleGenerateFlashcards}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="h-4 w-4 mr-2 border-2 border-t-gray-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Generate Flashcards
                          </>
                        )}
                      </Button>
                    </div>
                  ) : flashcards.length > 0 ? (
                    <div className="flex flex-col items-center w-full h-full justify-center">
                      {/* Using our new FlashcardCard component */}
                      {flashcards.length > 0 && currentIndex < flashcards.length && (
                        <FlashcardCard
                          flashcard={flashcards[currentIndex]}
                          flipped={flipped}
                          onFlip={handleFlip}
                        />
                      )}

                      {/* Using our new FlashcardNavigation component */}
                      <FlashcardNavigation
                        currentIndex={currentIndex}
                        totalCards={flashcards.length}
                        onPrevious={handlePrevious}
                        onNext={handleNext}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-16 flex flex-col items-center justify-center h-full">
                      <div className="inline-flex p-4 rounded-full bg-gray-100 mb-6">
                        <RefreshCw className="h-8 w-8 text-gray-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">No flashcards yet</h3>
                      <p className="text-gray-500 mb-6">
                        Generate flashcards from this conversation
                      </p>
                      <Button 
                        className="bg-gray-800 hover:bg-gray-700 text-white shadow-sm hover-lift"
                        onClick={handleGenerateFlashcards}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="h-4 w-4 mr-2 border-2 border-t-gray-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Generate Flashcards
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
