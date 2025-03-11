"use client"

import { useState, useEffect } from "react"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Edit, Trash2, Search, Calendar, MessageSquare } from "lucide-react"
import { useFlashcards } from "@/contexts/flashcard-context"
import { useChat } from "@/contexts/chat-context"
import { useToast } from "@/hooks/use-toast"
import type { Flashcard } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/services/api"

export default function FlashcardsPage() {
  const { flashcards, isLoading, fetchFlashcards, updateCard, deleteCard } = useFlashcards()
  const { chats } = useChat()
  const { toast } = useToast()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [editedCard, setEditedCard] = useState<Flashcard | null>(null)

  // Track if we've already fetched flashcards to prevent infinite loops
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    // Only fetch if we haven't already fetched and we're not currently loading
    if (!hasFetched && !isLoading) {
      fetchFlashcards()
      setHasFetched(true)
    }
  }, [fetchFlashcards, hasFetched, isLoading])

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

  const handleEdit = (card: Flashcard) => {
    setEditMode(true)
    setEditedCard({ ...card })
  }

  const handleSaveEdit = async () => {
    if (!editedCard) return

    try {
      await updateCard(editedCard.id, {
        question: editedCard.question,
        answer: editedCard.answer,
      })
      setEditMode(false)
      setEditedCard(null)
      toast({
        title: "Flashcard updated",
        description: "Your changes have been saved",
      })
    } catch (error) {
      let errorMessage = "Failed to update the flashcard. Please try again.";
      
      if (error instanceof ApiError) {
        errorMessage = error.getDetailedMessage();
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error updating flashcard",
        description: errorMessage,
        variant: "destructive",
      })
    }
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
      
      if (error instanceof ApiError) {
        errorMessage = error.getDetailedMessage();
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error deleting flashcard",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const getChatTitle = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId)
    return chat?.title || "Unknown chat"
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <div className="flex-1 bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Flashcards</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search flashcards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-500"
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
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="review" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Review Cards
                </TabsTrigger>
                <TabsTrigger value="manage" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Manage Cards
                </TabsTrigger>
              </TabsList>

              <TabsContent value="review" className="mt-0">
                {filteredCards.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-xl mb-4">
                      <Card
                        className={`h-64 cursor-pointer transition-all duration-500 transform ${
                          flipped ? "rotate-y-180" : ""
                        }`}
                        onClick={handleFlip}
                      >
                        <CardContent className="p-6 h-full flex items-center justify-center">
                          <div
                            className={`w-full transition-opacity duration-300 ${flipped ? "opacity-0" : "opacity-100"}`}
                          >
                            <h3 className="text-xl font-semibold text-center mb-2">Question:</h3>
                            <p className="text-center text-lg">{filteredCards[currentIndex]?.question}</p>
                            <p className="text-center text-xs text-gray-500 mt-4">(Click to reveal answer)</p>
                          </div>
                          <div
                            className={`w-full absolute inset-0 p-6 flex items-center justify-center transition-opacity duration-300 ${
                              flipped ? "opacity-100" : "opacity-0 pointer-events-none"
                            }`}
                          >
                            <div>
                              <h3 className="text-xl font-semibold text-center mb-2">Answer:</h3>
                              <p className="text-center text-lg">{filteredCards[currentIndex]?.answer}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="icon" onClick={handlePrevious} className="border-blue-200">
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <span className="text-sm text-gray-500">
                        {currentIndex + 1} of {filteredCards.length}
                      </span>
                      <Button variant="outline" size="icon" onClick={handleNext} className="border-blue-200">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No flashcards found. Start chatting to generate some!</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="manage" className="mt-0">
                {editMode && editedCard ? (
                  <Card className="mb-6 p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Question:</label>
                        <Textarea
                          value={editedCard.question}
                          onChange={(e) => setEditedCard({ ...editedCard, question: e.target.value })}
                          className="mt-1 border-blue-200"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Answer:</label>
                        <Textarea
                          value={editedCard.answer}
                          onChange={(e) => setEditedCard({ ...editedCard, answer: e.target.value })}
                          className="mt-1 border-blue-200"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditMode(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    <div className="space-y-4">
                      {filteredCards.length > 0 ? (
                        filteredCards.map((card) => (
                          <Card key={card.id} className="p-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="mb-2">
                                  <h3 className="font-medium">Question:</h3>
                                  <p>{card.question}</p>
                                </div>
                                <div>
                                  <h3 className="font-medium">Answer:</h3>
                                  <p>{card.answer}</p>
                                </div>
                                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(card.created_at).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    {getChatTitle(card.chat_id)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(card)}
                                  className="h-8 w-8 text-gray-500 hover:text-blue-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(card.id)}
                                  className="h-8 w-8 text-gray-500 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-gray-500">No flashcards found. Start chatting to generate some!</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}
