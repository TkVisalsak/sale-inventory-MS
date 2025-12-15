import { apiRequest } from "@/lib/api"

export const api = {
  products: {
    // GET all products
    getAll: () => apiRequest("/products"),

    // GET single product
    getById: (id) => apiRequest(`/products/${id}`),

    // POST create product
    create: (data) =>
      apiRequest("/products", {
        method: "POST",
        body: data,
      }),

    // PUT update product
    update: (id, data) =>
      apiRequest(`/products/${id}`, {
        method: "PUT",
        body: data,
      }),

    // DELETE product
    delete: (id) =>
      apiRequest(`/products/${id}`, {
        method: "DELETE",
      }),
  },
}

