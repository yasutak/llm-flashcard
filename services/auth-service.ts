import type { AuthResponse, LoginCredentials, RegisterCredentials } from "@/types"
import { fetchWithAuth } from "./api"

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  return fetchWithAuth<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  })
}

export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  return fetchWithAuth<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials),
  })
}

export async function logout(): Promise<void> {
  await fetchWithAuth("/auth/logout", {
    method: "POST",
  })
  localStorage.removeItem("auth_token")
}

export async function storeApiKey(apiKey: string): Promise<void> {
  await fetchWithAuth("/user/apikey", {
    method: "POST",
    body: JSON.stringify({ api_key: apiKey }),
  })
}

export async function checkApiKey(): Promise<boolean> {
  try {
    const response = await fetchWithAuth<{ exists: boolean }>("/user/apikey")
    return response.exists
  } catch (error) {
    return false
  }
}

