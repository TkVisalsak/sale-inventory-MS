const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

async function handleResponse(response) {
  const contentType = response.headers.get("content-type")
  const isJson = contentType && contentType.includes("application/json")
  const data = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message = data?.message || data?.error || `HTTP error! status: ${response.status}`
    throw new ApiError(message, response.status, data)
  }

  return data
}

export async function apiRequest(endpoint, options = {}) {
  const { method = "GET", body, headers = {}, ...customConfig } = options

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    credentials: options.credentials || "include", // Include cookies for session
    ...customConfig,
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    return await handleResponse(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(error.message || "Network error occurred", 0, null)
  }
}

