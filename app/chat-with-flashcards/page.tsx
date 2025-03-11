"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { useChat } from "@/contexts/chat-context"
import { useFlashcards } from "@/contexts/flashcard-context"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ApiError } from "@/services/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, BookOpen, RefreshCw, Send } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    
    // Only fetch decks once per chat
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
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
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
      <div className="flex-1 p-4">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Chat with Flashcards</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push(`/chat?chatId=${chatId}`)}
            >
              Chat View
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/flashcards?chatId=${chatId}`)}
            >
              Flashcards View
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chat panel */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-blue-50 border-b">
              <h2 className="text-lg font-semibold">{currentChat.title}</h2>
            </div>
            <div className="flex flex-col h-[calc(100vh-16rem)]">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`p-3 rounded-lg ${
                        message.role === "user" 
                          ? "bg-blue-100 ml-8" 
                          : "bg-gray-100 mr-8"
                      }`}
                    >
                      <div className="text-sm font-semibold mb-1">
                        {message.role === "user" ? "You" : "Claude"}
                      </div>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  ))}
                  {sendingMessage && (
                    <div className="p-3 rounded-lg bg-gray-100 mr-8">
                      <div className="text-sm font-semibold mb-1">Claude</div>
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></div>
                        <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse delay-150"></div>
                        <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse delay-300"></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Chat input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
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
          
          {/* Flashcards panel */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-blue-50 border-b">
              <h2 className="text-lg font-semibold">Flashcards</h2>
            </div>
            <div className="p-4 flex flex-col items-center">
              {!selectedDeckId ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No deck selected for this chat.</p>
                  <Button 
                    className="mt-4"
                    onClick={handleGenerateFlashcards}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
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
                <>
                  <Card
                    className="h-64 w-full max-w-md mb-4 cursor-pointer"
                    onClick={handleFlip}
                  >
                    <CardContent className="p-6 h-full flex items-center justify-center relative">
                      {/* Question side */}
                      <div
                        className={`w-full transition-all duration-500 ${
                          flipped ? "opacity-0 absolute" : "opacity-100"
                        }`}
                      >
                        <h3 className="text-xl font-semibold text-center mb-2">Question:</h3>
                        <p className="text-center text-lg">{flashcards[currentIndex]?.question}</p>
                        <p className="text-center text-xs text-gray-500 mt-4">(Click to reveal answer)</p>
                      </div>
                      
                      {/* Answer side */}
                      <div
                        className={`w-full transition-all duration-500 ${
                          flipped ? "opacity-100" : "opacity-0 absolute pointer-events-none"
                        }`}
                      >
                        <h3 className="text-xl font-semibold text-center mb-2">Answer:</h3>
                        <p className="text-center text-lg">{flashcards[currentIndex]?.answer}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={handlePrevious}>
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-sm text-gray-500">
                      {currentIndex + 1} of {flashcards.length}
                    </span>
                    <Button variant="outline" size="icon" onClick={handleNext}>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No flashcards found for this chat.</p>
                  <Button 
                    className="mt-4"
                    onClick={handleGenerateFlashcards}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
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
  )
}
