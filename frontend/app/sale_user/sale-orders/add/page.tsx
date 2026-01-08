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
import { api as priceListApi } from "@/lib/inventory-api/price-list-api"
import { api as customerApi } from "@/lib/sale-api/customer-api"
import { api as supplierApi } from "@/lib/inventory-api/supplier-api"
import { api as categoryApi } from "@/lib/inventory-api/category-api"
import { api as saleApi } from "@/lib/sale-api"

interface Product {
  id: number
  name: string
}

interface Customer {
  id: number
  name: string
}

interface SaleItem {
  product_id: string
  batch_id?: string
  quantity: string
  unit_price: string
  discount?: string
}

export default function NewSaleOrderPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    invoice_number: "",
    user_id: "",
    customer_id: "",
    order_status: "draft",
    payment_status: "unpaid",
    note: "",
  })

  const [items, setItems] = useState<SaleItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [supplierFilter, setSupplierFilter] = useState<string>("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [productSearch, setProductSearch] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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

    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true)
        const data = await customerApi.customers.getAll()
        setCustomers(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error fetching customers:", err)
      } finally {
        setLoadingCustomers(false)
      }
    }

    fetchProducts()
    fetchCustomers()
    const fetchSuppliers = async () => {
      try {
        const s = await supplierApi.suppliers.getAll()
        setSuppliers(Array.isArray(s) ? s : [])
      } catch (err) {
        console.error("Error fetching suppliers:", err)
      }
    }

    const fetchCategories = async () => {
      try {
        const c = await categoryApi.categories.getAll()
        setCategories(Array.isArray(c) ? c : [])
      } catch (err) {
        console.error("Error fetching categories:", err)
      }
    }

    fetchSuppliers()
    fetchCategories()
  }, [])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        product_id: "",
        batch_id: "",
        quantity: "1",
        unit_price: "0",
        discount: "0",
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof SaleItem, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }

    // when product is selected, attempt to auto-fill unit_price from latest active price list
    if (field === "product_id" && value) {
      (async () => {
        try {
          const lists = await priceListApi.priceLists.getAll()
          if (Array.isArray(lists)) {
            // normalize to a flat array of entries
            const entries: any[] = []
            for (const pl of lists) {
              if (pl.items && Array.isArray(pl.items)) {
                for (const it of pl.items) {
                  entries.push({
                    price: it.price ?? it.unit_price ?? it.sale_price,
                    product_id: it.product_id ?? it.product?.id,
                    active: pl.is_active ?? pl.active ?? pl.status === "active",
                    created_at: pl.created_at ?? pl.createdAt ?? pl.created_at,
                    list_id: pl.id,
                  })
                }
              } else if (pl.product_id) {
                entries.push({
                  price: pl.price ?? pl.unit_price ?? pl.sale_price,
                  product_id: pl.product_id,
                  active: pl.is_active ?? pl.active ?? pl.status === "active",
                  created_at: pl.created_at ?? pl.createdAt,
                  list_id: pl.id,
                })
              }
            }

            const pid = Number(value)
            let candidates = entries.filter((e) => Number(e.product_id) === pid && (e.active === true || e.active === "1" || e.active === 1))
            if (candidates.length === 0) {
              // fallback: any entries for product
              candidates = entries.filter((e) => Number(e.product_id) === pid)
            }
            if (candidates.length > 0) {
              // pick latest by created_at or list_id
              candidates.sort((a, b) => {
                const ta = a.created_at ? new Date(a.created_at).getTime() : (a.list_id || 0)
                const tb = b.created_at ? new Date(b.created_at).getTime() : (b.list_id || 0)
                return tb - ta
              })
              const price = candidates[0].price ?? 0
              updated[index].unit_price = String(price)
              setItems(updated)
              return
            }
          }
        } catch (err) {
          console.error("Error fetching price lists:", err)
        }
        // if no price found, still set the product selection
        setItems(updated)
      })()
      return
    }

    setItems(updated)
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0
      const price = Number(item.unit_price) || 0
      const discount = Number(item.discount) || 0
      return sum + qty * price - discount
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.invoice_number) {
      setError("Invoice number is required")
      return
    }
    if (!formData.user_id) {
      setError("User ID is required")
      return
    }
    if (items.length === 0) {
      setError("Add at least one item")
      return
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it.product_id || Number(it.quantity) < 1) {
        setError(`Item ${i + 1}: product and quantity are required`)
        return
      }
    }

    const subtotal = calculateSubtotal()
    const payload = {
      invoice_number: formData.invoice_number,
      customer_id: formData.customer_id && formData.customer_id !== "0" ? Number(formData.customer_id) : null,
      user_id: Number(formData.user_id),
      sale_date: new Date().toISOString().slice(0, 10),
      subtotal: subtotal,
      discount: 0,
      tax: 0,
      grand_total: subtotal,
      order_status: formData.order_status || "draft",
      payment_status: formData.payment_status || "unpaid",
      sale_type: "walk-in",
      items: items.map((it) => ({
        product_id: Number(it.product_id),
        batch_id: it.batch_id ? Number(it.batch_id) : null,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        discount: Number(it.discount) || 0,
        subtotal: (Number(it.quantity) || 0) * (Number(it.unit_price) || 0) - (Number(it.discount) || 0),
      })),
    }

    try {
      setLoading(true)
      await saleApi.sales.create(payload)
      router.push("/sale_user/sale-orders")
    } catch (err: any) {
      console.error("Error creating sale:", err)
      setError(err?.message || "Failed to create sale")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sale_user/sale-orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-balance">Add Sale Order</h1>
          <p className="text-muted-foreground">Quick draft-friendly sale order form.</p>
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
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_number">Invoice Number *</Label>
                    <Input
                      id="invoice_number"
                      placeholder="INV-2026-001"
                      value={formData.invoice_number}
                      onChange={(e) => handleChange("invoice_number", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user_id">Created By (User ID) *</Label>
                    <Input
                      id="user_id"
                      type="number"
                      min="1"
                      placeholder="Enter your user ID"
                      value={formData.user_id}
                      onChange={(e) => handleChange("user_id", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customer_id">Customer</Label>
                    <Select
                      value={formData.customer_id}
                      onValueChange={(value) => handleChange("customer_id", value)}
                    >
                      <SelectTrigger id="customer_id">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Walk-in</SelectItem>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order_status">Order Status</Label>
                    <Select
                      value={formData.order_status}
                      onValueChange={(value) => handleChange("order_status", value)}
                    >
                      <SelectTrigger id="order_status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
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
                  <CardTitle>Items</CardTitle>
                  <Button type="button" variant="outline" onClick={handleAddItem} disabled={loadingProducts}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No items added yet. Click "Add Item" to add a product.</div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Batch (optional)</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead className="w-[70px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Select value={item.product_id} onValueChange={(v) => handleItemChange(index, "product_id", v)} disabled={loadingProducts}>
                                <SelectTrigger>
                                  <SelectValue placeholder={loadingProducts ? "Loading..." : "Select product"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input value={item.batch_id} onChange={(e) => handleItemChange(index, "batch_id", e.target.value)} className="w-32" />
                            </TableCell>
                            <TableCell>
                              <Input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value)} className="w-20" />
                            </TableCell>
                            <TableCell>
                              <Input type="number" step="0.01" min="0" value={item.unit_price} className="w-32" readOnly />
                            </TableCell>
                            <TableCell>
                              <Input type="number" step="0.01" min="0" value={item.discount} onChange={(e) => handleItemChange(index, "discount", e.target.value)} className="w-32" />
                            </TableCell>
                            <TableCell>
                              {(((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)) - (Number(item.discount) || 0)).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-end pt-4 border-t">
                      <div className="text-lg font-semibold">Subtotal: ${calculateSubtotal().toFixed(2)}</div>
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
                      Save Order
                    </>
                  )}
                </Button>
                <Link href="/sale_user/sale-orders" className="block">
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

