"use client"

import type React from "react"
import { MainNav } from "@/components/main-nav"
import { ApiKeySetup } from "@/components/api-key-setup"
import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ApiKeyPage() {
  const { hasApiKey } = useAuth()
  const router = useRouter()

  // If user already has an API key, redirect to chat
  useEffect(() => {
    if (hasApiKey) {
      router.push("/chat")
    }
  }, [hasApiKey, router])

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <ApiKeySetup />
      </div>
    </div>
  )
}
