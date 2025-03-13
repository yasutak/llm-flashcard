"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { ChatSidebar } from "@/components/chat-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, MessageSquare, BookOpen } from "lucide-react"
import { useFlashcards } from "@/contexts/flashcard-context"
import { useToast } from "@/hooks/use-toast"
import { useErrors } from "@/contexts/error-context"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/services/api"
import { FlashcardCard } from "@/components/flashcard-card"
import { FlashcardNavigation } from "@/components/flashcard-navigation"
import { FlashcardList } from "@/components/flashcard-list"
import type { Flashcard } from "@/types"

export default function FlashcardsPage() {
  const router = useRouter()
  const { 
    flashcards, 
    decks, 
    isLoading, 
    fetchFlashcards, 
    fetchDecks,
    fetchFlashcardsForDeck,
    updateCard, 
    deleteCard
  } = useFlashcards()
  const { toast } = useToast()
  const { setApiErrors } = useErrors()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)

  // Track if we've already fetched data to prevent infinite loops
  const [hasFetched, setHasFetched] = useState(false)

  // Check for chatId in URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chatId = params.get('chatId');
    
    if (chatId && decks.length > 0) {
      // Find the deck associated with this chat
      const deck = decks.find(d => d.chat_id === chatId);
      if (deck) {
        setSelectedDeckId(deck.id);
      }
    }
  }, [decks]);

  useEffect(() => {
    // Only fetch if we haven't already fetched and we're not currently loading
    if (!hasFetched && !isLoading) {
      fetchDecks()
      // Only fetch all flashcards if no deck is selected
      if (!selectedDeckId) {
        fetchFlashcards()
      }
      setHasFetched(true)
    }
  }, [fetchFlashcards, fetchDecks, hasFetched, isLoading, selectedDeckId])

  // When a deck is selected, fetch its flashcards
  useEffect(() => {
    if (selectedDeckId) {
      fetchFlashcardsForDeck(selectedDeckId)
    }
  }, [selectedDeckId, fetchFlashcardsForDeck])

  const filteredCards = flashcards.filter(
    (card) =>
      card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.answer.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handlePrevious = () => {
    setFlipped(false)
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredCards.length - 1))
  }

  const handleNext = () => {
    setFlipped(false)
    setCurrentIndex((prev) => (prev < filteredCards.length - 1 ? prev + 1 : 0))
  }

  const handleFlip = () => {
    setFlipped((prev) => !prev)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCard(id)
      if (currentIndex >= filteredCards.length - 1) {
        setCurrentIndex(Math.max(0, filteredCards.length - 2))
      }
      toast({
        title: "Flashcard deleted",
        description: "The flashcard has been removed",
      })
    } catch (error) {
      let errorMessage = "Failed to delete the flashcard. Please try again.";
      let errorDetails = "";
      
      if (error instanceof ApiError) {
        errorMessage = error.getDetailedMessage();
        
        // Check if this is a validation error
        if (error.isValidationError()) {
          const validationErrors = error.getValidationErrors();
          if (validationErrors) {
            // Format validation errors for display
            errorDetails = validationErrors.map(err => `${err.field}: ${err.message}`).join('\n');
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error deleting flashcard",
        description: errorDetails || errorMessage,
        variant: "destructive",
      })
      
      // Log the full error for debugging
      console.error("Flashcard delete error:", error);
    }
  }

  // Get the current chat ID if available from URL
  const getChatIdFromDeck = () => {
    if (selectedDeckId) {
      const deck = decks.find(d => d.id === selectedDeckId);
      return deck?.chat_id || undefined;
    }
    return undefined;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Chat sidebar */}
        <ChatSidebar currentChatId={getChatIdFromDeck()} />

        {/* Main content area */}
        <div className="flex-1 bg-gradient-to-b from-blue-50 to-white p-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Your Flashcards</h1>
                
                {/* Side-by-side view button */}
                {selectedDeckId && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Find the chat ID for this deck
                      const deck = decks.find(d => d.id === selectedDeckId);
                      if (deck && deck.chat_id) {
                        router.push(`/chat-with-flashcards?chatId=${deck.chat_id}`);
                      }
                    }}
                    className="flex items-center gap-2 bg-white shadow-sm hover-lift"
                  >
                    <MessageSquare className="h-4 w-4 text-[hsl(var(--primary))]" />
                    Side-by-side View
                  </Button>
                )}
              </div>
              
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search flashcards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 border-[hsl(var(--border))] focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))] py-6 rounded-xl shadow-sm"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-64 w-full" />
                <div className="flex justify-center gap-4">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>
            ) : (
              <Tabs defaultValue="review" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 rounded-xl overflow-hidden shadow-sm p-1 bg-white">
                  <TabsTrigger 
                    value="review" 
                    className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white rounded-lg py-3"
                  >
                    Review Cards
                  </TabsTrigger>
                  <TabsTrigger 
                    value="manage" 
                    className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white rounded-lg py-3"
                  >
                    Manage Cards
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="review" className="mt-0">
                  {filteredCards.length > 0 ? (
                    <div className="flex flex-col items-center">
                      {/* Using our new FlashcardCard component */}
                      {filteredCards.length > 0 && currentIndex < filteredCards.length && (
                        <FlashcardCard
                          flashcard={filteredCards[currentIndex]}
                          flipped={flipped}
                          onFlip={handleFlip}
                        />
                      )}

                      {/* Using our new FlashcardNavigation component */}
                      <FlashcardNavigation
                        currentIndex={currentIndex}
                        totalCards={filteredCards.length}
                        onPrevious={handlePrevious}
                        onNext={handleNext}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-16 max-w-md mx-auto">
                      <div className="inline-flex p-4 rounded-full bg-[hsl(var(--primary-light))] mb-6">
                        <BookOpen className="h-8 w-8 text-[hsl(var(--primary))]" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-3">No flashcards yet</h2>
                      <p className="text-gray-500 mb-6 text-lg">
                        Start chatting with Claude to generate some flashcards
                      </p>
                      <Button
                        className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-hover))] shadow-sm hover-lift"
                        onClick={() => router.push('/chat')}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Start Chatting
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="manage" className="mt-0">
                  {/* Using our new FlashcardList component */}
                  <FlashcardList
                    flashcards={filteredCards}
                    decks={decks}
                    onEditCard={(id, data) => updateCard(id, data)}
                    onDeleteCard={handleDelete}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
