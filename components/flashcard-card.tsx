"use client"

import { Card } from "@/components/ui/card"
import type { Flashcard } from "@/types"
import { ArrowDownUp } from "lucide-react"

interface FlashcardCardProps {
  flashcard: Flashcard
  flipped: boolean
  onFlip: () => void
  className?: string
}

export function FlashcardCard({ flashcard, flipped, onFlip, className = "min-h-[280px]" }: FlashcardCardProps) {
  return (
    <div className={`card-flip w-full max-w-xl mb-6 ${className}`}>
      <Card
        className="card-shadow hover:shadow-md cursor-pointer h-full w-full rounded-xl border border-[hsl(var(--border))] overflow-hidden bg-white dark:bg-gray-800"
        onClick={onFlip}
      >
        <div className="p-6 h-full flex flex-col relative">
          {/* Flip indicator */}
          <div className="absolute top-3 right-3 p-1.5 rounded-full bg-[hsl(var(--gray-100))] dark:bg-[hsl(var(--gray-700))] text-gray-500">
            <ArrowDownUp className="h-4 w-4" />
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            {/* Question side */}
            <div
              className={flipped ? "hidden" : "block w-full"}
            >
              <div className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-md text-sm inline-block mb-4">
                Question
              </div>
              <div className="text-xl font-medium mb-4">{flashcard.question}</div>
              <div className="text-center text-xs text-gray-500 mt-6 absolute bottom-0 left-0 right-0">
                Tap to reveal answer
              </div>
            </div>
            
            {/* Answer side */}
            <div
              className={flipped ? "block w-full" : "hidden"}
            >
              <div className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-md text-sm inline-block mb-4">
                Answer
              </div>
              <div className="text-xl font-medium">{flashcard.answer}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
