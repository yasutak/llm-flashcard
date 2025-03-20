"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import { useFlashcards } from "@/contexts/flashcard-context"
import { useToast } from "@/hooks/use-toast"
import { ApiError } from "@/services/api"

interface GenerateFlashcardsButtonProps {
  chatId: string
}

export function GenerateFlashcardsButton({ chatId }: GenerateFlashcardsButtonProps) {
  const [generating, setGenerating] = useState(false)
  const { generateCardsFromChat } = useFlashcards()
  const { toast } = useToast()
  
  // Use useRef to track if the button is already clicked to prevent duplicate requests
  const isProcessingRef = useRef(false)
  
  const handleGenerateFlashcards = async () => {
    // If already processing, don't do anything
    if (isProcessingRef.current || generating) return
    
    // Set both state and ref to prevent duplicate clicks
    setGenerating(true)
    isProcessingRef.current = true
    
    try {
      await generateCardsFromChat(chatId)
      toast({
        title: "Flashcards generated",
        description: "Flashcards have been created from this chat",
      })
    } catch (error) {
      let errorMessage = "Failed to generate flashcards. Please try again."
      let errorDetails = ""
      
      if (error instanceof ApiError) {
        errorMessage = error.getDetailedMessage()
        
        // Check if this is a validation error
        if (error.isValidationError()) {
          const validationErrors = error.getValidationErrors()
          if (validationErrors) {
            // Format validation errors for display
            errorDetails = validationErrors.map(err => `${err.field}: ${err.message}`).join('\n')
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error generating flashcards",
        description: errorDetails || errorMessage,
        variant: "destructive",
      })
      
      // Log the full error for debugging
      console.error("Flashcard generation error:", error)
    } finally {
      setGenerating(false)
      // Reset the processing flag after a short delay to prevent rapid re-clicks
      setTimeout(() => {
        isProcessingRef.current = false
      }, 1000)
    }
  }
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerateFlashcards}
      disabled={generating}
      className="text-gray-500 hover:text-[hsl(var(--primary))] hover:bg-gray-50"
    >
      {generating ? (
        <div className="h-4 w-4 mr-1.5 border-2 border-t-gray-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
      ) : (
        <BookOpen className="h-4 w-4 mr-1.5" />
      )}
      Generate Flashcards
    </Button>
  )
} 