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
    <div className="flex h-16 items-center border-b bg-white px-4 dark:bg-gray-950">
      <div className="flex items-center gap-2 font-semibold text-lg text-blue-700">
        <BrainCircuit className="h-6 w-6" />
        <span className="hidden md:inline">LLM Flashcard Chat</span>
      </div>

      <nav className="flex flex-1 items-center justify-center space-x-1 md:space-x-4">
        <Link href="/chat">
          <Button
            variant={pathname === "/chat" ? "default" : "ghost"}
            className={pathname === "/chat" ? "bg-blue-600 hover:bg-blue-700" : ""}
            size="sm"
          >
            <MessageSquare className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Chat</span>
          </Button>
        </Link>
        <Link href={currentChat ? `/flashcards?chatId=${currentChat.id}` : "/flashcards"}>
          <Button
            variant={pathname === "/flashcards" ? "default" : "ghost"}
            className={pathname === "/flashcards" ? "bg-blue-600 hover:bg-blue-700" : ""}
            size="sm"
          >
            <BookOpen className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Flashcards</span>
          </Button>
        </Link>
        <Link href={currentChat ? `/chat-with-flashcards?chatId=${currentChat.id}` : "/chat-with-flashcards"}>
          <Button
            variant={pathname === "/chat-with-flashcards" ? "default" : "ghost"}
            className={pathname === "/chat-with-flashcards" ? "bg-blue-600 hover:bg-blue-700" : ""}
            size="sm"
          >
            <LayoutPanelLeft className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Side-by-side</span>
          </Button>
        </Link>
      </nav>

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
  )
}
