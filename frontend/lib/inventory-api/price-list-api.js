import { apiRequest } from "@/lib/api"

export const api = {
  priceLists: {
    // GET all price lists
    getAll: () => apiRequest("/price-lists"),

    // GET single price list
    getById: (id) => apiRequest(`/price-lists/${id}`),

    // POST create price list
    create: (data) =>
      apiRequest("/price-lists", {
        method: "POST",
        body: data,
      }),

    // PUT update price list
    update: (id, data) =>
      apiRequest(`/price-lists/${id}`, {
        method: "PUT",
        body: data,
      }),

    // DELETE price list
    delete: (id) =>
      apiRequest(`/price-lists/${id}`, {
        method: "DELETE",
      }),
  },
}







