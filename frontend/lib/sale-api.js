import { apiRequest } from "./api";

export const api = {
  sales: {
    getAll: () => apiRequest("/sales"),
    getById: (id) => apiRequest(`/sales/${id}`),
    create: (data) => apiRequest("/sales", { method: "POST", body: data }),
    update: (id, data) =>
      apiRequest(`/sales/${id}`, { method: "PUT", body: data }),
    delete: (id) => apiRequest(`/sales/${id}`, { method: "DELETE" }),
    // Invoice generation endpoint (returns invoice data or URL)
    // Accepts optional payload, e.g. { fulfill: true }
    generateInvoice: (id, data) => apiRequest(`/sales/${id}/invoice`, { method: "POST", body: data }),
  },
  stockReservations: {
    // list or filtered by ?status=pending
    getAll: (query = "") =>
      apiRequest(`/stock-reservations${query ? `?${query}` : ""}`),
    update: (id, data) =>
      apiRequest(`/stock-reservations/${id}`, { method: "PUT", body: data }),
  },
}
