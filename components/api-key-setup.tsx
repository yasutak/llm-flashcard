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
import { ApiError } from "@/services/api"

export function ApiKeySetup() {
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setHasApiKey } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

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
      if (error instanceof ApiError && error.isValidationError()) {
        const validationErrors = error.getValidationErrors();
        if (validationErrors && validationErrors.length > 0) {
          // Find the error for the api_key field or use the first error
          const apiKeyError = validationErrors.find(err => err.field === 'api_key') || validationErrors[0];
          setError(apiKeyError.message);
        } else {
          setError("Invalid API key format");
        }
        
        toast({
          title: "Validation Error",
          description: "Please provide a valid API key",
          variant: "destructive",
        });
      } else {
        let errorMessage = "Please check your API key and try again";
        
        if (error instanceof ApiError) {
          errorMessage = error.getDetailedMessage();
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Error saving API key",
          description: errorMessage,
          variant: "destructive",
        });
      }
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
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError(null); // Clear error when user types
                }}
                placeholder="sk-ant-..."
                required
                className={`border-blue-200 focus:border-blue-500 ${error ? 'border-red-500' : ''}`}
              />
              {error ? (
                <p className="text-xs text-red-500 mt-1">{error}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Your API key is stored securely and never shared.</p>
              )}
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
