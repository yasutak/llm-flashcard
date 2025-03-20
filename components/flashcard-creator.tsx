"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"

interface FlashcardCreatorProps {
  deckId: string
  onSave: (newFlashcard: { question: string; answer: string; deck_id: string }) => Promise<void>
  onCancel: () => void
}

export function FlashcardCreator({ deckId, onSave, onCancel }: FlashcardCreatorProps) {
  const [newCard, setNewCard] = useState({
    question: "",
    answer: "",
    deck_id: deckId
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(newCard)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="mb-6 p-4">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Question:</label>
          <Textarea
            value={newCard.question}
            onChange={(e) => setNewCard({ ...newCard, question: e.target.value })}
            className="mt-1 border-blue-200"
            placeholder="Enter your question here"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Answer:</label>
          <Textarea
            value={newCard.answer}
            onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
            className="mt-1 border-blue-200"
            placeholder="Enter the answer here"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-blue-500 hover:bg-blue-600"
            disabled={isSaving || !newCard.question.trim() || !newCard.answer.trim()}
          >
            {isSaving ? "Saving..." : "Create Card"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
