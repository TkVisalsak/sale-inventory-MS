
import { apiRequest } from "@/lib/api"

export const api = {
  categories: {
    getAll: () => apiRequest("/category-index"),                   // GET all categories
    getById: (id) => apiRequest(`/category-edit/${id}`),           // GET single category
    create: (data) => apiRequest("/category-store", {             // POST create category
      method: "POST",
      body: data 
    }),
    update: (id, data) => apiRequest(`/category-update/${id}`, {  // PUT update category
      method: "PUT",
      body: data
    }),
    delete: (id) => apiRequest(`/category-delete/${id}`, {        // DELETE category
      method: "DELETE"
    }),
},

};
