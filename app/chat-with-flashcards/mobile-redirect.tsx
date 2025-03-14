"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function MobileRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    const checkAndRedirect = () => {
      // Check if this is a mobile device (less than 768px)
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        // Redirect to the chat page, preserving any query parameters
        const searchParams = new URLSearchParams(window.location.search)
        const chatId = searchParams.get('chatId')
        
        if (chatId) {
          router.replace(`/chat?chatId=${chatId}`)
        } else {
          router.replace('/chat')
        }
      }
    }
    
    // Check immediately on mount
    checkAndRedirect()
    
    // Also check when window is resized (e.g., orientation change)
    window.addEventListener('resize', checkAndRedirect)
    
    return () => {
      window.removeEventListener('resize', checkAndRedirect)
    }
  }, [router])
  
  // This component doesn't render anything
  return null
}
