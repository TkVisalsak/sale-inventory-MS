"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api as productApi } from "@/lib/inventory-api/product-api"
import { api as supplierApi } from "@/lib/inventory-api/supplier-api"
import { api as purchaseRequestApi } from "@/lib/inventory-api/purchase-request-api"

interface Product {
  id: number
  name: string
  supplier_id?: number | null
  supplier?: {
    id: number
    name: string
  } | null
}

interface Supplier {
  id: number
  name: string
}

interface RequestItem {
  supplier_id: string
  product_id: string
  requested_qty: string
  estimated_price: string
}

export default function NewPurchaseRequestPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    requested_by: "",
    status: "draft",
    note: "",
  })

  const [items, setItems] = useState<RequestItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true)
        const data = await supplierApi.suppliers.getAll()
        const mappedSuppliers = Array.isArray(data)
          ? data.map((s: any) => ({
              id: s.id ?? s.supplier_id,
              name: s.name ?? s.supplier_name ?? "",
            }))
          : []
        setSuppliers(mappedSuppliers)
      } catch (err) {
        console.error("Error fetching suppliers:", err)
      } finally {
        setLoadingSuppliers(false)
      }
    }

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const data = await productApi.products.getAll()
        setProducts(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error fetching products:", err)
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchSuppliers()
    fetchProducts()
  }, [])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        supplier_id: "",
        product_id: "",
        requested_qty: "1",
        estimated_price: "0",
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof RequestItem, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }

    if (field === "supplier_id") {
      updated[index].product_id = ""
    }

    setItems(updated)
  }

  const getSupplierProducts = (supplierId: string) => {
    if (!supplierId) return []
    const sid = Number(supplierId)
    return products.filter(
      (p) => p.supplier_id === sid || p.supplier?.id === sid
    )
  }

  const calculateTotalEstimated = () => {
    return items.reduce((sum, item) => {
      const qty = Number(item.requested_qty) || 0
      const price = Number(item.estimated_price) || 0
      return sum + qty * price
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.requested_by) {
      setError("Requested By (User ID) is required")
      return
    }

    if (items.length === 0) {
      setError("At least one item is required")
      return
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.supplier_id || !item.product_id || !item.requested_qty) {
        setError(
          `Item ${i + 1} is incomplete. Supplier, product, and requested quantity are required.`
        )
        return
      }

      if (Number(item.requested_qty) < 1) {
        setError(`Item ${i + 1}: Requested quantity must be at least 1`)
        return
      }

      if (Number(item.estimated_price) < 0) {
        setError(`Item ${i + 1}: Estimated price must be 0 or greater`)
        return
      }
    }

    const payload = {
      requested_by: Number(formData.requested_by),
      status: formData.status || "draft",
      note: formData.note.trim() || null,
      items: items.map((item) => ({
        supplier_id: Number(item.supplier_id),
        product_id: Number(item.product_id),
        requested_qty: Number(item.requested_qty),
        estimated_price: item.estimated_price ? Number(item.estimated_price) : null,
      })),
    }

    try {
      setLoading(true)
      await purchaseRequestApi.purchaseRequests.create(payload)
      router.push("/inventory_user/purchase-requests")
    } catch (err: any) {
      console.error("Error creating purchase request:", err)
      if (err?.errors) {
        const messages = Object.values(err.errors as any).flat()
        setError(String(messages.join(", ")))
      } else {
        setError(err?.message || "Failed to create purchase request. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory_user/purchase-requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-balance">Add Purchase Request</h1>
          <p className="text-muted-foreground">
            Create a new purchase request with one or more requested items.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Request Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="requested_by">Requested By (User ID) *</Label>
                    <Input
                      id="requested_by"
                      type="number"
                      min="1"
                      placeholder="Enter user ID"
                      value={formData.requested_by}
                      onChange={(e) => handleChange("requested_by", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleChange("status", value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Note</Label>
                  <Input
                    id="note"
                    placeholder="Add an optional note"
                    value={formData.note}
                    onChange={(e) => handleChange("note", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Requested Items</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddItem}
                    disabled={loadingProducts || loadingSuppliers}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No items added yet. Click &quot;Add Item&quot; to add a requested product.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Requested Qty</TableHead>
                          <TableHead>Estimated Price</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead className="w-[70px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => {
                          const supplierProducts = getSupplierProducts(item.supplier_id)

                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <Select
                                  value={item.supplier_id}
                                  onValueChange={(value) =>
                                    handleItemChange(index, "supplier_id", value)
                                  }
                                  disabled={loadingSuppliers}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={loadingSuppliers ? "Loading..." : "Select supplier"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {suppliers.map((supplier) => (
                                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                        {supplier.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={item.product_id}
                                  onValueChange={(value) =>
                                    handleItemChange(index, "product_id", value)
                                  }
                                  disabled={!item.supplier_id || loadingProducts}
                                >
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={
                                        item.supplier_id
                                          ? loadingProducts
                                            ? "Loading products..."
                                            : "Select product"
                                          : "Select supplier first"
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {supplierProducts.map((product) => (
                                      <SelectItem key={product.id} value={product.id.toString()}>
                                        {product.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.requested_qty}
                                  onChange={(e) =>
                                    handleItemChange(index, "requested_qty", e.target.value)
                                  }
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.estimated_price}
                                  onChange={(e) =>
                                    handleItemChange(index, "estimated_price", e.target.value)
                                  }
                                  className="w-32"
                                />
                              </TableCell>
                              <TableCell>
                                {(
                                  (Number(item.requested_qty) || 0) *
                                  (Number(item.estimated_price) || 0)
                                ).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveItem(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                    <div className="flex justify-end pt-4 border-t">
                      <div className="text-lg font-semibold">
                        Total Estimated: ${calculateTotalEstimated().toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Request
                    </>
                  )}
                </Button>
                <Link href="/inventory_user/purchase-requests" className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-transparent"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

