"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { api as batchApi } from "@/lib/inventory-api/batch-api"
import { api as productApi } from "@/lib/inventory-api/product-api"
import { api as supplierApi } from "@/lib/inventory-api/supplier-api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Product {
  id: number
  name: string
  supplier_id?: number
  supplier?: {
    id: number
    name: string
  }
}

interface Supplier {
  id: number
  name: string
}

interface BatchItem {
  product_id: string
  quantity: string
  unit_cost: string
  expiry_date: string
}

export default function EditBatchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const batchId = searchParams.get("id")

  const [formData, setFormData] = useState({
    supplier_id: "",
    invoice_no: "",
    purchase_date: "",
    status: "draft",
  })
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingBatch, setLoadingBatch] = useState(true)
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
              id: s.supplier_id || s.id,
              name: s.name || s.supplier_name || "",
            }))
          : []
        setSuppliers(mappedSuppliers)
      } catch (err: any) {
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
      } catch (err: any) {
        console.error("Error fetching products:", err)
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchSuppliers()
    fetchProducts()
  }, [])

  // Filter products by selected supplier
  useEffect(() => {
    if (formData.supplier_id) {
      const supplierId = Number(formData.supplier_id)
      const filtered = products.filter(
        (p) => (p.supplier_id || p.supplier?.id) === supplierId
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts([])
    }
  }, [formData.supplier_id, products])

  useEffect(() => {
    const fetchBatch = async () => {
      if (!batchId) {
        setError("Batch ID is required")
        setLoadingBatch(false)
        return
      }

      try {
        setLoadingBatch(true)
        setError(null)
        const data = await batchApi.batches.getById(batchId)

        // Format dates for input fields (YYYY-MM-DD)
        const formatDate = (dateString: string | null | undefined) => {
          if (!dateString) return ""
          return new Date(dateString).toISOString().split("T")[0]
        }

        setFormData({
          supplier_id: (data.supplier_id || data.supplier?.id || data.supplier?.supplier_id)?.toString() || "",
          invoice_no: data.invoice_no || "",
          purchase_date: formatDate(data.purchase_date),
          status: data.status || "draft",
        })

        // Map batch items
        if (data.items && Array.isArray(data.items)) {
          const mappedItems = data.items.map((item: any) => ({
            product_id: item.product_id?.toString() || "",
            quantity: item.quantity?.toString() || "1",
            unit_cost: item.unit_cost?.toString() || "0",
            expiry_date: formatDate(item.expiry_date),
          }))
          setBatchItems(mappedItems)
        }
      } catch (err: any) {
        console.error("Error fetching batch:", err)
        setError(err.message || "Failed to load batch")
      } finally {
        setLoadingBatch(false)
      }
    }

    fetchBatch()
  }, [batchId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!formData.supplier_id) {
        setError("Supplier is required")
        setLoading(false)
        return
      }

      if (batchItems.length === 0) {
        setError("At least one product is required")
        setLoading(false)
        return
      }

      // Validate all items
      for (let i = 0; i < batchItems.length; i++) {
        const item = batchItems[i]
        if (!item.product_id || !item.quantity || !item.unit_cost) {
          setError(`Item ${i + 1} is incomplete. Product, quantity, and unit cost are required.`)
          setLoading(false)
          return
        }
        if (Number(item.quantity) < 1) {
          setError(`Item ${i + 1}: Quantity must be at least 1`)
          setLoading(false)
          return
        }
        if (Number(item.unit_cost) < 0) {
          setError(`Item ${i + 1}: Unit cost must be 0 or greater`)
          setLoading(false)
          return
        }
      }

      const batchData = {
        supplier_id: Number(formData.supplier_id),
        invoice_no: formData.invoice_no.trim() || "",
        purchase_date: formData.purchase_date || new Date().toISOString().split("T")[0],
        status: formData.status || "draft",
        items: batchItems.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          unit_cost: Number(item.unit_cost),
          expiry_date: item.expiry_date || null,
        })),
      }

      await batchApi.batches.update(batchId!, batchData)
      router.push("/inventory_user/batches")
    } catch (err: any) {
      console.error("Error updating batch:", err)

      // Handle validation errors
      if (err.data?.errors) {
        const errorMessages = Object.values(err.data.errors).flat()
        setError(errorMessages.join(", ") || "Validation failed")
      } else {
        setError(err.message || err.data?.message || "Failed to update batch. Please try again.")
      }
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddItem = () => {
    if (!formData.supplier_id) {
      setError("Please select a supplier first")
      return
    }
    setBatchItems([
      ...batchItems,
      {
        product_id: "",
        quantity: "1",
        unit_cost: "0",
        expiry_date: "",
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    setBatchItems(batchItems.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof BatchItem, value: string) => {
    const updated = [...batchItems]
    updated[index] = { ...updated[index], [field]: value }
    setBatchItems(updated)
  }

  const calculateTotal = () => {
    return batchItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0
      const unitCost = Number(item.unit_cost) || 0
      return sum + quantity * unitCost
    }, 0)
  }

  if (loadingBatch) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/inventory_user/batches">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-balance">Edit Batch</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory_user/batches">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-balance">Edit Batch</h1>
          <p className="text-muted-foreground">Update batch information</p>
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
                <CardTitle>Batch Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="supplier_id">Supplier *</Label>
                    <Select
                      value={formData.supplier_id}
                      onValueChange={(value) => {
                        handleChange("supplier_id", value)
                        // Filter products when supplier changes
                      }}
                      disabled={loadingSuppliers}
                    >
                      <SelectTrigger id="supplier_id">
                        <SelectValue placeholder={loadingSuppliers ? "Loading suppliers..." : "Select supplier"} />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.length === 0 && !loadingSuppliers ? (
                          <SelectItem value="no-suppliers" disabled>No suppliers available</SelectItem>
                        ) : (
                          suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice_no">Invoice Number *</Label>
                    <Input
                      id="invoice_no"
                      placeholder="Enter invoice number"
                      value={formData.invoice_no}
                      onChange={(e) => handleChange("invoice_no", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">Purchase Date *</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => handleChange("purchase_date", e.target.value)}
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
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Batch Items</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddItem}
                    disabled={!formData.supplier_id || loadingProducts}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {batchItems.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    {formData.supplier_id
                      ? "No products added yet. Click 'Add Product' to add items to this batch."
                      : "Please select a supplier first to add products."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Cost</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead className="w-[70px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Select
                                value={item.product_id}
                                onValueChange={(value) => handleItemChange(index, "product_id", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredProducts.map((product) => (
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
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unit_cost}
                                onChange={(e) => handleItemChange(index, "unit_cost", e.target.value)}
                                className="w-32"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={item.expiry_date}
                                onChange={(e) => handleItemChange(index, "expiry_date", e.target.value)}
                                className="w-40"
                              />
                            </TableCell>
                            <TableCell>
                              {(
                                (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0)
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
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-end pt-4 border-t">
                      <div className="text-lg font-semibold">
                        Total Cost: ${calculateTotal().toFixed(2)}
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
                      Save Changes
                    </>
                  )}
                </Button>
                <Link href="/inventory_user/batches" className="block">
                  <Button type="button" variant="outline" className="w-full bg-transparent" disabled={loading}>
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
