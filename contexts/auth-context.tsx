"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, LoginCredentials, RegisterCredentials } from "@/types"
import {
  login as loginService,
  register as registerService,
  logout as logoutService,
  checkApiKey,
} from "@/services/auth-service"
import { useRouter } from "next/navigation"
import { ApiError } from "@/services/api"
import { useErrors } from "./error-context"

interface AuthContextType {
  user: User | null
  hasApiKey: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  setHasApiKey: (value: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Form IDs
export const LOGIN_FORM = "login-form";
export const REGISTER_FORM = "register-form";
export const API_KEY_FORM = "api-key-form";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [hasApiKey, setHasApiKey] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()
  const { setApiErrors } = useErrors()

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    const userData = localStorage.getItem("user")

    if (token && userData) {
      setUser(JSON.parse(userData))
      checkApiKey().then(setHasApiKey)
    }

    setIsLoading(false)
  }, [])

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const response = await loginService(credentials)
      localStorage.setItem("auth_token", response.token)
      localStorage.setItem("user", JSON.stringify(response.user))
      setUser(response.user)
      // Check if API key exists after login
      const hasKey = await checkApiKey()
      setHasApiKey(hasKey)
      router.push("/api-key")
    } catch (error) {
      // Handle API errors
      if (error instanceof ApiError) {
        setApiErrors(LOGIN_FORM, error)
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true)
    try {
      const response = await registerService(credentials)
      localStorage.setItem("auth_token", response.token)
      localStorage.setItem("user", JSON.stringify(response.user))
      setUser(response.user)
      // Check if API key exists after registration
      const hasKey = await checkApiKey()
      setHasApiKey(hasKey)
      router.push("/api-key")
    } catch (error) {
      // Handle API errors
      if (error instanceof ApiError) {
        setApiErrors(REGISTER_FORM, error)
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await logoutService()
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user")
      setUser(null)
      setHasApiKey(false)
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        hasApiKey,
        isLoading,
        login,
        register,
        logout,
        setHasApiKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
