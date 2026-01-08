import { apiRequest } from "@/lib/api"

// Sale-user specific API wrapper for customers.
// Uses same backend controller endpoints but kept separate for isolation.
export const api = {
  customers: {
    getAll: () => apiRequest("/customers"),
    getById: (id) => apiRequest(`/customers/${id}`),
    create: (data) =>
      apiRequest("/customers", {
        method: "POST",
        body: data,
      }),
    update: (id, data) =>
      apiRequest(`/customers/${id}`, {
        method: "PUT",
        body: data,
      }),
    delete: (id) =>
      apiRequest(`/customers/${id}`, {
        method: "DELETE",
      }),
  },
}
