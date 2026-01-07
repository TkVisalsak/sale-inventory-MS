import { apiRequest } from "@/lib/api"

export const api = {
  adjustments: {
    // GET all stock adjustments
    getAll: (query = "") => apiRequest(`/stock-adjustments${query ? `?${query}` : ""}`),

    // POST create stock adjustment
    create: (data) =>
      apiRequest("/stock-adjustments", {
        method: "POST",
        body: data,
      }),
  },
}


