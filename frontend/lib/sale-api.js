import { apiRequest } from "./api"

export const api = {
  sales: {
    getAll: () => apiRequest("/sales"),
    getById: (id) => apiRequest(`/sales/${id}`),
    create: (data) => apiRequest("/sales", { method: "POST", body: data }),
    update: (id, data) => apiRequest(`/sales/${id}`, { method: "PUT", body: data }),
    delete: (id) => apiRequest(`/sales/${id}`, { method: "DELETE" }),
    // Invoice generation endpoint (returns invoice data or URL)
    generateInvoice: (id) => apiRequest(`/sales/${id}/invoice`, { method: "POST" }),
    getUnpaid: () => apiRequest('/sales/unpaid'),
    getPaid: () => apiRequest('/sales/paid'),
  },
  stockReservations: {
    // list or filtered by ?status=pending
    getAll: (query = "") => apiRequest(`/stock-reservations${query ? `?${query}` : ""}`),
    update: (id, data) => apiRequest(`/stock-reservations/${id}`, { method: "PUT", body: data }),
  },
  payments: {
    getAll: () => apiRequest('/payments'),
    createForSale: (saleId, data) => apiRequest(`/sales/${saleId}/payments`, { method: 'POST', body: data }),
    byCustomer: (customerId) => apiRequest(`/customers/${customerId}/payments`),
    customerBalance: (customerId) => apiRequest(`/customers/${customerId}/balance`),
  },
}
