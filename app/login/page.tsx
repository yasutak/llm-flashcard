"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrainCircuit } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { ApiError } from "@/services/api"

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { login, register, isLoading } = useAuth()
  const { toast } = useToast()

  // Client-side validation function
  const validateForm = (isRegister = false): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate username
    if (!username) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (username.length > 50) {
      newErrors.username = "Username must be less than 50 characters";
    }
    
    // Validate password
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    // Validate confirm password (only for registration)
    if (isRegister && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      await login({ username, password })
    } catch (error) {
      if (error instanceof ApiError && error.isValidationError()) {
        const validationErrors = error.getValidationErrors();
        if (validationErrors) {
          const fieldErrors: Record<string, string> = {};
          validationErrors.forEach(err => {
            fieldErrors[err.field] = err.message;
          });
          setErrors(fieldErrors);
        }
        
        toast({
          title: "Validation Error",
          description: "Please correct the errors in the form",
          variant: "destructive",
        });
      } else {
        let errorMessage = "Please check your credentials and try again";
        
        if (error instanceof ApiError) {
          errorMessage = error.getDetailedMessage();
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    // Validate form before submission
    if (!validateForm(true)) {
      return;
    }

    try {
      await register({ username, password, confirmPassword })
    } catch (error) {
      if (error instanceof ApiError && error.isValidationError()) {
        const validationErrors = error.getValidationErrors();
        if (validationErrors) {
          const fieldErrors: Record<string, string> = {};
          validationErrors.forEach(err => {
            fieldErrors[err.field] = err.message;
          });
          setErrors(fieldErrors);
        }
        
        toast({
          title: "Validation Error",
          description: "Please correct the errors in the form",
          variant: "destructive",
        });
      } else {
        let errorMessage = "Please try again with a different username";
        
        if (error instanceof ApiError) {
          errorMessage = error.getDetailedMessage();
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Registration failed",
          description: errorMessage,
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
                  <div className="grid gap-2">
                    <label htmlFor="username" className="text-sm font-medium">
                      Username
                    </label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        // Clear error when user types
                        if (errors.username) {
                          setErrors({...errors, username: ""});
                        }
                      }}
                      required
                      className={`border-blue-200 focus:border-blue-500 ${errors.username || errors['0'] ? 'border-red-500' : ''}`}
                    />
                    {(errors.username || errors['0']) && (
                      <p className="text-xs text-red-500 mt-1">{errors.username || errors['0']}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        // Clear error when user types
                        if (errors.password) {
                          setErrors({...errors, password: ""});
                        }
                      }}
                      required
                      className={`border-blue-200 focus:border-blue-500 ${errors.password || errors['1'] ? 'border-red-500' : ''}`}
                    />
                    {(errors.password || errors['1']) && (
                      <p className="text-xs text-red-500 mt-1">{errors.password || errors['1']}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-2" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Log in"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="register-username" className="text-sm font-medium">
                      Username
                    </label>
                    <Input
                      id="register-username"
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        // Clear error when user types
                        if (errors.username) {
                          setErrors({...errors, username: ""});
                        }
                      }}
                      required
                      className={`border-blue-200 focus:border-blue-500 ${errors.username || errors['0'] ? 'border-red-500' : ''}`}
                    />
                    {(errors.username || errors['0']) && (
                      <p className="text-xs text-red-500 mt-1">{errors.username || errors['0']}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="register-password" className="text-sm font-medium">
                      Password
                    </label>
                    <Input
                      id="register-password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        // Clear error when user types
                        if (errors.password) {
                          setErrors({...errors, password: ""});
                        }
                      }}
                      required
                      className={`border-blue-200 focus:border-blue-500 ${errors.password || errors['1'] ? 'border-red-500' : ''}`}
                    />
                    {(errors.password || errors['1']) && (
                      <p className="text-xs text-red-500 mt-1">{errors.password || errors['1']}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="confirm-password" className="text-sm font-medium">
                      Confirm Password
                    </label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        // Clear error when user types
                        if (errors.confirmPassword) {
                          setErrors({...errors, confirmPassword: ""});
                        }
                      }}
                      required
                      className={`border-blue-200 focus:border-blue-500 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
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
