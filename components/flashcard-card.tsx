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

export function FlashcardCard({ flashcard, flipped, onFlip, className = "min-h-[320px] sm:min-h-[280px] md:min-h-[300px]" }: FlashcardCardProps) {
  return (
    <div className={`card-flip w-full max-w-[95%] mx-auto sm:max-w-xl mb-3 sm:mb-6 ${className}`}>
      <Card
        className="card-shadow hover:shadow-md cursor-pointer h-full w-full rounded-lg sm:rounded-xl border border-[hsl(var(--border))] overflow-hidden bg-white dark:bg-gray-800"
        onClick={onFlip}
      >
        <div className="p-4 sm:p-6 h-full flex flex-col relative">
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
              <div className="text-xl sm:text-2xl font-medium mb-6 break-words">{flashcard.question}</div>
              <div className="text-center text-sm text-gray-500 mt-6 absolute bottom-4 left-0 right-0 bg-gray-50 dark:bg-gray-700/50 py-2 mx-4 rounded-md">
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
              <div className="text-xl sm:text-2xl font-medium break-words">{flashcard.answer}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
