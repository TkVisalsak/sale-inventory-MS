import { apiRequest } from "@/lib/api"

export const api = {
  adjustments: {
    // GET all stock adjustments
    getAll: () => apiRequest("/stock-adjustments"),

    // POST create stock adjustment
    create: (data) =>
      apiRequest("/stock-adjustments", {
        method: "POST",
        body: data,
      }),
  },
}


