"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { Flashcard } from "@/types"

interface FlashcardCardProps {
  flashcard: Flashcard
  flipped: boolean
  onFlip: () => void
  className?: string
}

export function FlashcardCard({ flashcard, flipped, onFlip, className = "h-64" }: FlashcardCardProps) {
  return (
    <Card
      className={`${className} cursor-pointer w-full max-w-xl mb-4`}
      onClick={onFlip}
    >
      <CardContent className="p-6 h-full flex items-center justify-center relative">
        {/* Question side */}
        <div
          className={`w-full transition-all duration-500 ${
            flipped ? "opacity-0 absolute" : "opacity-100"
          }`}
        >
          <h3 className="text-xl font-semibold text-center mb-2">Question:</h3>
          <p className="text-center text-lg">{flashcard.question}</p>
          <p className="text-center text-xs text-gray-500 mt-4">(Click to reveal answer)</p>
        </div>
        
        {/* Answer side */}
        <div
          className={`w-full transition-all duration-500 ${
            flipped ? "opacity-100" : "opacity-0 absolute pointer-events-none"
          }`}
        >
          <h3 className="text-xl font-semibold text-center mb-2">Answer:</h3>
          <p className="text-center text-lg">{flashcard.answer}</p>
        </div>
      </CardContent>
    </Card>
  )
}
