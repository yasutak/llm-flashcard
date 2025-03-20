import type { AuthResponse, LoginCredentials, RegisterCredentials } from "@/types";
import { fetchWithAuth } from "./api";

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    console.log("Login credentials:", {
      username: credentials.username,
      password: credentials.password ? "[REDACTED]" : undefined
    });
    
    return await fetchWithAuth<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  try {
    // Extract only the fields expected by the backend (username and password)
    const { username, password } = credentials;
    const backendCredentials = { username, password };
    
    console.log("Register credentials (sending to backend):", {
      username,
      password: "[REDACTED]",
      // Log what we're actually sending to verify confirmPassword is excluded
      actualPayload: JSON.stringify(backendCredentials)
    });
    
    return await fetchWithAuth<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(backendCredentials),
    });
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
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
    console.error("API key check error:", error);
    return false;
  }
}
