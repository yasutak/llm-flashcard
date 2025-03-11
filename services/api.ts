const API_BASE_URL = "/api"

// Define error data interface
export interface ApiErrorData {
  message?: string;
  error?: string;
  details?: string;
  errors?: Array<{
    path: string;
    message: string;
    code: string;
  }>;
  [key: string]: unknown;
}

// Custom API Error class with detailed information
export class ApiError extends Error {
  status: number;
  statusText: string;
  url: string;
  data?: ApiErrorData;
  
  constructor(
    message: string,
    status: number,
    statusText: string,
    url: string,
    data?: ApiErrorData
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.data = data;
    
    // Ensures proper instanceof checks work in TypeScript
    Object.setPrototypeOf(this, ApiError.prototype);
  }
  
  // Helper method to get a user-friendly error message
  getDetailedMessage(): string {
    let details = `${this.message} (${this.status} ${this.statusText})`;
    
    if (this.data?.error) {
      details += `: ${this.data.error}`;
    }
    
    if (this.data?.details) {
      details += ` - ${this.data.details}`;
    }
    
    return details;
  }
  
  // Helper method to get validation errors
  getValidationErrors(): Array<{field: string; message: string}> | null {
    if (!this.data?.errors || !Array.isArray(this.data.errors)) {
      return null;
    }
    
    return this.data.errors.map(err => ({
      field: err.path,
      message: err.message
    }));
  }
  
  // Helper method to check if this is a validation error
  isValidationError(): boolean {
    return this.status === 400 && 
           this.data?.message === 'Validation Error' && 
           Array.isArray(this.data?.errors);
  }
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    try {
      const errorData = await response.json() as ApiErrorData;
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries([...response.headers.entries()]),
        data: errorData
      });
      
      throw new ApiError(
        errorData.message || "An error occurred",
        response.status,
        response.statusText,
        response.url,
        errorData
      );
    } catch (jsonError) {
      if (jsonError instanceof ApiError) {
        throw jsonError;
      }
      
      console.error("Failed to parse error response:", jsonError);
      throw new ApiError(
        `HTTP error: ${response.status} ${response.statusText}`,
        response.status,
        response.statusText,
        response.url
      );
    }
  }
  
  try {
    const data = await response.json();
    console.log("API Success Response:", {
      status: response.status,
      url: response.url,
      data: data
    });
    return data as T;
  } catch (jsonError) {
    console.error("Failed to parse success response:", jsonError);
    throw new Error("Failed to parse response");
  }
}

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token")
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  }
}

// Generic fetch function with auth
export async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  }

  try {
    const requestBody = options.body ? JSON.parse(options.body as string) : undefined;
    
    console.log(`API Request: ${endpoint}`, {
      method: options.method || 'GET',
      url: `${API_BASE_URL}${endpoint}`,
      headers: headers,
      body: requestBody
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    return handleResponse<T>(response);
  } catch (error) {
    console.error(`API Request Failed: ${endpoint}`, error);
    throw error;
  }
}

// Function to check if the user is authenticated
export function isAuthenticated(): boolean {
  return !!localStorage.getItem("auth_token")
}
