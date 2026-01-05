import { apiRequest } from "@/lib/api"

export const api = {
  auth: {
    // POST login with username, password, and role
    login: (data) =>
      apiRequest("/login", {
        method: "POST",
        body: data,
        credentials: "include", // Include cookies for session
      }),

    // GET current user
    me: () => apiRequest("/me"),

    // POST logout
    logout: () =>
      apiRequest("/logout", {
        method: "POST",
        credentials: "include",
      }),
  },
}

