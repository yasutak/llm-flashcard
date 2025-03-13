"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Calendar, Folder } from "lucide-react"
import { FlashcardEditor } from "@/components/flashcard-editor"
import type { Flashcard } from "@/types"
import type { Deck } from "@/types"

interface FlashcardListProps {
  flashcards: Flashcard[]
  decks: Deck[]
  onEditCard: (id: string, data: { question: string; answer: string }) => Promise<void>
  onDeleteCard: (id: string) => Promise<void>
}

export function FlashcardList({ 
  flashcards, 
  decks, 
  onEditCard, 
  onDeleteCard 
}: FlashcardListProps) {
  const [editMode, setEditMode] = useState(false)
  const [editedCard, setEditedCard] = useState<Flashcard | null>(null)

  const handleEdit = (card: Flashcard) => {
    setEditMode(true)
    setEditedCard({ ...card })
  }

  const handleSave = async (data: { question: string; answer: string }) => {
    if (!editedCard) return

    await onEditCard(editedCard.id, data)
    setEditMode(false)
    setEditedCard(null)
  }

  return (
    <>
      {editMode && editedCard ? (
        <FlashcardEditor
          flashcard={editedCard}
          onSave={handleSave}
          onCancel={() => {
            setEditMode(false)
            setEditedCard(null)
          }}
        />
      ) : (
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="space-y-4">
            {flashcards.length > 0 ? (
              flashcards.map((card) => (
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
                          <Folder className="h-3 w-3" />
                          {decks.find(d => d.id === card.deck_id)?.title || "Unknown deck"}
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
                        onClick={() => onDeleteCard(card.id)}
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
    </>
  )
}
