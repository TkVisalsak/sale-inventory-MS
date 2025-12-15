import { apiRequest } from "@/lib/api"

export const api = {
  batches: {
    // GET all batches
    getAll: () => apiRequest("/batches"),

    // GET single batch
    getById: (id) => apiRequest(`/batches/${id}`),

    // POST create batch
    create: (data) =>
      apiRequest("/batches", {
        method: "POST",
        body: data,
      }),

    // PUT update batch
    update: (id, data) =>
      apiRequest(`/batches/${id}`, {
        method: "PUT",
        body: data,
      }),

    // DELETE batch
    delete: (id) =>
      apiRequest(`/batches/${id}`, {
        method: "DELETE",
      }),
  },
}

