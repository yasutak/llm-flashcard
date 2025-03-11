"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Key } from "lucide-react"
import { storeApiKey } from "@/services/auth-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function ApiKeySetup() {
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { setHasApiKey } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await storeApiKey(apiKey)
      setHasApiKey(true)
      toast({
        title: "API key saved",
        description: "Your Anthropic API key has been securely stored",
      })
      // Redirect to chat page after successful API key setup
      router.push("/chat")
    } catch (error) {
      toast({
        title: "Error saving API key",
        description: error instanceof Error ? error.message : "Please check your API key and try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-2">
          <Key className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-bold text-center">Connect to Claude</CardTitle>
        <CardDescription className="text-center">
          Enter your Anthropic API key to start chatting with Claude 3.7 Sonnet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="apiKey" className="text-sm font-medium">
                Anthropic API Key
              </label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                required
                className="border-blue-200 focus:border-blue-500"
              />
              <p className="text-xs text-muted-foreground">Your API key is stored securely and never shared.</p>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSubmit} disabled={isLoading || !apiKey}>
          {isLoading ? "Connecting..." : "Connect"}
        </Button>
      </CardFooter>
    </Card>
  )
}
