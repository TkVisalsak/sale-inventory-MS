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
    // Accepts optional body, e.g. { fulfill: true } to deduct stock immediately
    generateInvoice: (id, body = {}) =>
      apiRequest(`/sales/${id}/invoice`, { method: "POST", body }),
  },
  stockReservations: {
    // list or filtered by ?status=pending
    getAll: (query = "") =>
      apiRequest(`/stock-reservations${query ? `?${query}` : ""}`),
    update: (id, data) =>
      apiRequest(`/stock-reservations/${id}`, { method: "PUT", body: data }),
  },
};
