"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface FlashcardNavigationProps {
  currentIndex: number
  totalCards: number
  onPrevious: () => void
  onNext: () => void
  className?: string
}

export function FlashcardNavigation({ 
  currentIndex, 
  totalCards, 
  onPrevious, 
  onNext,
  className = "" 
}: FlashcardNavigationProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onPrevious} 
        className="border-blue-200"
        disabled={totalCards === 0}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <span className="text-sm text-gray-500">
        {totalCards > 0 ? `${currentIndex + 1} of ${totalCards}` : "No cards"}
      </span>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onNext} 
        className="border-blue-200"
        disabled={totalCards === 0}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}
