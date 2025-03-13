"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import type { Flashcard } from "@/types"

interface FlashcardEditorProps {
  flashcard: Flashcard
  onSave: (updatedFlashcard: { question: string; answer: string }) => Promise<void>
  onCancel: () => void
}

export function FlashcardEditor({ flashcard, onSave, onCancel }: FlashcardEditorProps) {
  const [editedCard, setEditedCard] = useState({
    question: flashcard.question,
    answer: flashcard.answer
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        question: editedCard.question,
        answer: editedCard.answer
      })
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
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
