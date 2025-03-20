"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatSidebar } from "@/components/chat-sidebar"

interface ResponsiveSidebarProps {
  currentChatId?: string
}

export function ResponsiveSidebar({ currentChatId }: ResponsiveSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Close sidebar when screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (isOpen && target.closest('.sidebar-container') === null && target.closest('.sidebar-toggle') === null) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])
  
  return (
    <>
      {/* Desktop sidebar - always visible on md and up */}
      <div className="hidden md:block">
        <ChatSidebar currentChatId={currentChatId} />
      </div>
      
      {/* Mobile toggle button - only visible on small screens, positioned at bottom right */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed right-4 bottom-20 z-50 bg-white shadow-md rounded-full sidebar-toggle"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      {/* Mobile sidebar - slide in from right */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/20" aria-hidden="true" />
      )}
      
      <div 
        className={`fixed top-0 bottom-16 right-0 z-50 w-64 bg-white shadow-lg transform transition-transform sidebar-container md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-start p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <ChatSidebar currentChatId={currentChatId} />
      </div>
    </>
  )
}
