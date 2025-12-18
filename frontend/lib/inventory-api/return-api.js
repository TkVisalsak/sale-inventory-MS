import { apiRequest } from "@/lib/api"

export const api = {
  returns: {
    // GET all returns
    getAll: () => apiRequest("/returns"),

    // GET single return
    getById: (id) => apiRequest(`/returns/${id}`),

    // POST create return
    create: (data) =>
      apiRequest("/returns", {
        method: "POST",
        body: data,
      }),

    // PUT update return
    update: (id, data) =>
      apiRequest(`/returns/${id}`, {
        method: "PUT",
        body: data,
      }),

    // DELETE return
    delete: (id) =>
      apiRequest(`/returns/${id}`, {
        method: "DELETE",
      }),
  },
}


