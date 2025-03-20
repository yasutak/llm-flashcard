"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrainCircuit } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { ApiError } from "@/services/api"
import { FormField } from "@/components/form-field"
import { useErrors } from "@/contexts/error-context"
import { ValidationRules } from "@/types/validation"

// Form IDs
const LOGIN_FORM = "login-form";
const REGISTER_FORM = "register-form";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const { login, register, isLoading } = useAuth()
  const { toast } = useToast()
  const { clearErrors, setApiErrors } = useErrors()
  
  // Clear form errors when switching tabs
  useEffect(() => {
    clearErrors(LOGIN_FORM);
    clearErrors(REGISTER_FORM);
  }, [activeTab, clearErrors]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await login({ username, password })
    } catch (error) {
      if (error instanceof ApiError) {
        // Set the API errors in the form
        if (error.isValidationError()) {
          setApiErrors(LOGIN_FORM, error);
        } else {
          // For non-validation errors, still show a toast
          toast({
            title: "Login failed",
            description: error.getDetailedMessage(),
            variant: "destructive",
          });
        }
      } else if (error instanceof Error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await register({ username, password, confirmPassword })
    } catch (error) {
      if (error instanceof ApiError) {
        // Set the API errors in the form
        if (error.isValidationError()) {
          setApiErrors(REGISTER_FORM, error);
        } else {
          // For non-validation errors, still show a toast
          toast({
            title: "Registration failed",
            description: error.getDetailedMessage(),
            variant: "destructive",
          });
        }
      } else if (error instanceof Error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <BrainCircuit className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">LLM Flashcard Chat</CardTitle>
          <CardDescription className="text-center">
            Chat with Claude and generate flashcards automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <div className="grid gap-4">
                  <FormField
                    formId={LOGIN_FORM}
                    name="username"
                    label="Username"
                    value={username}
                    onChange={setUsername}
                    required
                    rules={[
                      ValidationRules.required(),
                      ValidationRules.minLength(3),
                      ValidationRules.maxLength(50)
                    ]}
                  />
                  <FormField
                    formId={LOGIN_FORM}
                    name="password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    required
                    autoComplete="current-password"
                    rules={[
                      ValidationRules.required(),
                      ValidationRules.minLength(6)
                    ]}
                  />
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-2" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Log in"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <div className="grid gap-4">
                  <FormField
                    formId={REGISTER_FORM}
                    name="username"
                    label="Username"
                    value={username}
                    onChange={setUsername}
                    required
                    autoComplete="username"
                    rules={[
                      ValidationRules.required(),
                      ValidationRules.minLength(3),
                      ValidationRules.maxLength(50)
                    ]}
                  />
                  <FormField
                    formId={REGISTER_FORM}
                    name="password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    required
                    autoComplete="new-password"
                    rules={[
                      ValidationRules.required(),
                      ValidationRules.minLength(6)
                    ]}
                  />
                  <FormField
                    formId={REGISTER_FORM}
                    name="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    required
                    autoComplete="new-password"
                    rules={[
                      ValidationRules.required(),
                      ValidationRules.match(() => password, "Passwords don't match")
                    ]}
                  />
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-2" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
