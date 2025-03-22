"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useChat } from "@/contexts/chat-context"

interface ResponsiveSidebarProps {
  currentChatId?: string
}

export function ResponsiveSidebar({ currentChatId }: ResponsiveSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { chats, startNewChat } = useChat()

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <>
      {/* Mobile sidebar toggle button */}
      <div className="md:hidden fixed top-16 left-4 z-50">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleSidebar}
          className="bg-white shadow-sm"
        >
          {sidebarOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`w-full md:w-64 lg:w-80 flex-shrink-0 bg-white border-r border-[hsl(var(--border))] fixed md:static top-0 bottom-0 left-0 z-40 transition-transform duration-300 ease-in-out md:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } pt-16 md:pt-0`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-[hsl(var(--border))]">
            <Button
              className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-hover))]"
              onClick={startNewChat}
            >
              New Chat
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {chats.map((chat) => (
              <Link
                href={`/chat?id=${chat.id}`}
                key={chat.id}
                className={`block p-3 rounded-lg my-1 hover:bg-gray-100 transition-colors ${
                  chat.id === currentChatId
                    ? "bg-[hsl(var(--primary-light))] text-[hsl(var(--primary))] font-medium"
                    : "text-gray-700"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="truncate">{chat.title || "New conversation"}</div>
                  {/* Delete button removed since deleteChat is not available in the context */}
                </div>
              </Link>
            ))}
          </div>
          
          <div className="p-3 border-t border-[hsl(var(--border))]">
            <Link
              href="/flashcards"
              className="block p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              My Flashcards
            </Link>
            <Link
              href="/api-key"
              className="block p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              API Key Settings
            </Link>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" 
          onClick={toggleSidebar}
        />
      )}
    </>
  )
}
