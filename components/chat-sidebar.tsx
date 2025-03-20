"use client"

import { useChat } from "@/contexts/chat-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, MessageSquare, BookOpen, Layout, Loader2 } from "lucide-react"
import { useState } from "react"

interface ChatSidebarProps {
  currentChatId?: string
  showFlashcardLinks?: boolean
}

export function ChatSidebar({ currentChatId, showFlashcardLinks = true }: ChatSidebarProps) {
  const { chats, startNewChat, selectChat, selectingChat } = useChat()
  const router = useRouter()
  const [navigating, setNavigating] = useState(false)

  const handleChatSelect = async (chatId: string) => {
    if (selectingChat || navigating) return

    try {
      setNavigating(true)
      if (window.location.pathname.includes('/chat')) {
        await selectChat(chatId)
      } else {
        router.push(`/chat?chatId=${chatId}`)
      }
    } finally {
      setNavigating(false)
    }
  }

  const handleNewChat = async () => {
    if (navigating) return
    setNavigating(true)
    try {
      await startNewChat()
      router.push('/chat')
    } finally {
      setNavigating(false)
    }
  }

  const handleFlashcardNavigation = (path: string) => {
    if (navigating || !currentChatId) return
    setNavigating(true)
    router.push(`${path}?chatId=${currentChatId}`)
    setNavigating(false)
  }

  return (
    <aside className="w-full md:w-72 bg-[hsl(var(--primary-light))] border-r border-[hsl(var(--border))] dark:bg-[hsl(var(--primary-light))] h-full flex flex-col shadow-sm">
      <div className="p-5 h-full flex flex-col">
        <Button 
          className="w-full btn-primary mb-5 py-5 shadow-sm hover-lift" 
          onClick={handleNewChat}
          disabled={navigating}
        >
          {navigating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          New Chat
        </Button>

        <div className="mb-3">
          <h3 className="text-sm font-medium text-gray-500 px-1.5 mb-2">Recent Chats</h3>
        </div>

        <ScrollArea className="flex-1 pr-2 h-[calc(100vh-16rem)]">
          <div className="space-y-1.5">
            {chats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                disabled={selectingChat || navigating}
                className={`w-full justify-start text-left truncate ${
                  currentChatId === chat.id 
                    ? "bg-[hsl(var(--primary))] text-white dark:bg-[hsl(var(--primary))] dark:text-white font-medium" 
                    : "hover:bg-[hsl(var(--primary))/10] dark:hover:bg-[hsl(var(--primary))/20]"
                }`}
                onClick={() => handleChatSelect(chat.id)}
              >
                {selectingChat && currentChatId === chat.id ? (
                  <Loader2 className="h-4 w-4 mr-2.5 animate-spin flex-shrink-0" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2.5 flex-shrink-0" />
                )}
                <span className="truncate">{chat.title}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
        
        {/* Flashcard navigation buttons */}
        {showFlashcardLinks && currentChatId && (
          <div className="mt-4 border-t border-[hsl(var(--border))] pt-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-500 px-1.5 mb-2">Tools</h3>
            
            <Button
              variant="outline"
              size="sm"
              disabled={navigating}
              className="w-full justify-start bg-white/70 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800"
              onClick={() => handleFlashcardNavigation('/flashcards')}
            >
              <BookOpen className="h-4 w-4 mr-2.5 text-[hsl(var(--primary))]" />
              View Flashcards
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              disabled={navigating}
              className="w-full justify-start bg-white/70 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800"
              onClick={() => handleFlashcardNavigation('/chat-with-flashcards')}
            >
              <Layout className="h-4 w-4 mr-2.5 text-[hsl(var(--primary))]" />
              Side-by-side View
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}
