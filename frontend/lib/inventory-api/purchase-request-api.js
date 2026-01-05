import { apiRequest } from "@/lib/api"

export const api = {
  purchaseRequests: {
    // GET all purchase requests
    getAll: () => apiRequest("/purchase-requests"),

    // GET single purchase request by id
    getById: (id) => apiRequest(`/purchase-requests/${id}`),

    // POST create purchase request
    create: (data) =>
      apiRequest("/purchase-requests", {
        method: "POST",
        body: data,
      }),
  },
}


