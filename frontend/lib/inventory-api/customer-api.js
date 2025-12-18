import { apiRequest } from "@/lib/api"

export const api = {
  customers: {
    // GET all customers
    getAll: () => apiRequest("/customers"),

    // GET single customer (for view/edit)
    getById: (id) => apiRequest(`/customers/${id}`),

    // POST create customer
    create: (data) =>
      apiRequest("/customers", {
        method: "POST",
        body: data,
      }),

    // PUT update customer
    update: (id, data) =>
      apiRequest(`/customers/${id}`, {
        method: "PUT",
        body: data,
      }),

    // DELETE customer
    delete: (id) =>
      apiRequest(`/customers/${id}`, {
        method: "DELETE",
      }),
  },
}


