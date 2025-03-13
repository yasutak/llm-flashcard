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
    <div className={`flex items-center justify-between mt-6 ${className}`}>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onPrevious} 
        className="bg-white dark:bg-gray-800 border-[hsl(var(--border))] hover:bg-[hsl(var(--primary-light))] hover:text-[hsl(var(--primary))] dark:hover:bg-[hsl(var(--primary-light)/20)] shadow-sm"
        disabled={totalCards === 0}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <div className="px-4 py-2 rounded-full bg-[hsl(var(--primary-light))] dark:bg-[hsl(var(--primary-light)/20)] text-[hsl(var(--primary))] dark:text-[hsl(var(--primary))] font-medium text-sm">
        {totalCards > 0 ? `${currentIndex + 1} of ${totalCards}` : "No cards"}
      </div>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onNext} 
        className="bg-white dark:bg-gray-800 border-[hsl(var(--border))] hover:bg-[hsl(var(--primary-light))] hover:text-[hsl(var(--primary))] dark:hover:bg-[hsl(var(--primary-light)/20)] shadow-sm"
        disabled={totalCards === 0}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}
