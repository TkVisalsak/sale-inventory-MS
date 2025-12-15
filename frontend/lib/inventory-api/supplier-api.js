import { apiRequest } from "@/lib/api"

export const api = {
  suppliers: {
    // GET all suppliers
    getAll: () => apiRequest("/supplier-index"),

    // GET single supplier
    getById: (id) => apiRequest(`/supplier-edit/${id}`),

    // POST create supplier
    create: (data) =>
      apiRequest("/supplier-store", {
        method: "POST",
        body: data,
      }),

    // PUT update supplier
    update: (id, data) =>
      apiRequest(`/supplier-update/${id}`, {
        method: "PUT",
        body: data,
      }),

    // DELETE supplier
    delete: (id) =>
      apiRequest(`/supplier-delete/${id}`, {
        method: "DELETE",
      }),
  },
}
