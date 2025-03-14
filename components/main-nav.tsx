"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BrainCircuit, MessageSquare, BookOpen, User, LogOut, LayoutPanelLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useChat } from "@/contexts/chat-context"

export function MainNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { currentChat } = useChat()

  return (
    <>
      {/* Top navigation bar */}
      <div className="flex h-16 items-center border-b bg-white px-4 dark:bg-gray-950">
        <div className="flex items-center gap-2 font-semibold text-lg text-blue-700">
          <BrainCircuit className="h-6 w-6" />
          <span className="hidden md:inline">LLM Flashcard Chat</span>
        </div>

        {/* Desktop navigation - center */}
        <nav className="hidden md:flex flex-1 items-center justify-center space-x-4">
          <Link href="/chat">
            <Button
              variant={pathname === "/chat" ? "default" : "ghost"}
              className={pathname === "/chat" ? "bg-blue-600 hover:bg-blue-700" : ""}
              size="sm"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              <span>Chat</span>
            </Button>
          </Link>
          <Link href={currentChat ? `/flashcards?chatId=${currentChat.id}` : "/flashcards"}>
            <Button
              variant={pathname === "/flashcards" ? "default" : "ghost"}
              className={pathname === "/flashcards" ? "bg-blue-600 hover:bg-blue-700" : ""}
              size="sm"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              <span>Flashcards</span>
            </Button>
          </Link>
          <Link href={currentChat ? `/chat-with-flashcards?chatId=${currentChat.id}` : "/chat-with-flashcards"}>
            <Button
              variant={pathname === "/chat-with-flashcards" ? "default" : "ghost"}
              className={pathname === "/chat-with-flashcards" ? "bg-blue-600 hover:bg-blue-700" : ""}
              size="sm"
            >
              <LayoutPanelLeft className="h-5 w-5 mr-2" />
              <span>Side-by-side</span>
            </Button>
          </Link>
        </nav>

        {/* Mobile: Center title */}
        <div className="flex-1 md:hidden flex justify-center">
          <span className="text-md font-semibold">
            {pathname === "/chat" ? "Chat" : 
             pathname === "/flashcards" ? "Flashcards" : 
             pathname === "/chat-with-flashcards" ? "Side-by-side" : 
             "LLM Flashcard"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">{user?.username || "User"}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bottom mobile navigation - removed side-by-side option for mobile */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 z-50 flex justify-around items-center h-16 px-1">
        <Link href="/chat" className="flex-1">
          <div className={`flex flex-col items-center py-2 ${pathname === "/chat" ? "text-blue-600" : "text-gray-500"}`}>
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs mt-1">Chat</span>
          </div>
        </Link>
        <Link href={currentChat ? `/flashcards?chatId=${currentChat.id}` : "/flashcards"} className="flex-1">
          <div className={`flex flex-col items-center py-2 ${pathname === "/flashcards" ? "text-blue-600" : "text-gray-500"}`}>
            <BookOpen className="h-5 w-5" />
            <span className="text-xs mt-1">Cards</span>
          </div>
        </Link>
      </div>
      
      {/* Add padding at the bottom for mobile to account for bottom navigation */}
      <div className="h-20 md:hidden"></div>
    </>
  )
}
