"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { MainNav } from "@/components/main-nav"

export default function ChatWithFlashcardsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <div className="flex-1 p-4">
        <div className="mb-4 flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chat panel skeleton */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-blue-50 border-b">
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className={`p-3 rounded-lg ${i % 2 === 0 ? "ml-8" : "mr-8"}`}>
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Flashcards panel skeleton */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-blue-50 border-b">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="p-4 flex flex-col items-center">
              <Skeleton className="h-64 w-full max-w-md mb-4" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
