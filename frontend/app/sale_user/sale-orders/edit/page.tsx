"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { api as productApi } from "@/lib/inventory-api/product-api"
import { api as priceListApi } from "@/lib/inventory-api/price-list-api"
import { api as customerApi } from "@/lib/sale-api/customer-api"
import { api as supplierApi } from "@/lib/inventory-api/supplier-api"
import { api as categoryApi } from "@/lib/inventory-api/category-api"
import { api as saleApi } from "@/lib/sale-api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

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
  supplier_filter?: string
  category_filter?: string
  product_search?: string
}

export default function EditSalePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const toast = useToast()

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
  const [supplierFilter, setSupplierFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [productSearch, setProductSearch] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [loadingSale, setLoadingSale] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLists = async () => {
      try {
        setLoadingProducts(true)
        const p = await productApi.products.getAll()
        setProducts(Array.isArray(p) ? p : [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingProducts(false)
      }

      try {
        setLoadingCustomers(true)
        const c = await customerApi.customers.getAll()
        setCustomers(Array.isArray(c) ? c : [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingCustomers(false)
      }

      try {
        const s = await supplierApi.suppliers.getAll()
        setSuppliers(Array.isArray(s) ? s : [])
      } catch (err) {
        console.error("Error fetching suppliers:", err)
      }

      try {
        const cats = await categoryApi.categories.getAll()
        setCategories(Array.isArray(cats) ? cats : [])
      } catch (err) {
        console.error("Error fetching categories:", err)
      }
    }

    fetchLists()
  }, [])

  useEffect(() => {
    const fetchSale = async () => {
      if (!id) {
        setError("Sale ID is required")
        setLoadingSale(false)
        return
      }
      try {
        setLoadingSale(true)
        const data = await saleApi.sales.getById(id)
        setFormData({
          invoice_number: data.invoice_number || "",
          user_id: data.user?.id ? String(data.user.id) : "",
          customer_id: data.customer?.id ? String(data.customer.id) : "0",
          order_status: data.order_status || "draft",
          payment_status: data.payment_status || "unpaid",
          note: data.note || "",
        })
        if (Array.isArray(data.items)) {
          setItems(
            data.items.map((it: any) => ({
              product_id: String(it.product_id || ""),
              batch_id: it.batch_id ? String(it.batch_id) : "",
              quantity: String(it.quantity || "1"),
              unit_price: String(it.unit_price || "0"),
              discount: String(it.discount || "0"),
            }))
          )
        }
      } catch (err: any) {
        console.error(err)
        setError(err?.message || "Failed to load sale")
      } finally {
        setLoadingSale(false)
      }
    }

    fetchSale()
  }, [id])

  const isEditable = formData.order_status === "draft"

  const handleChange = (field: string, value: string) => setFormData((p) => ({ ...p, [field]: value }))

  const handleAddItem = () => {
    setItems([
      ...items,
      { product_id: "", batch_id: "", quantity: "1", unit_price: "0", discount: "0", supplier_filter: 'all', category_filter: 'all', product_search: '' },
    ])
  }

  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const handleItemChange = (index: number, field: keyof SaleItem, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }

    if (field === "product_id" && value) {
      ;(async () => {
        try {
          const lists = await priceListApi.priceLists.getAll()
          if (Array.isArray(lists)) {
            const entries: any[] = []
            for (const pl of lists) {
              if (pl.items && Array.isArray(pl.items)) {
                for (const it of pl.items) {
                  entries.push({
                    price: it.price ?? it.unit_price ?? it.sale_price,
                    product_id: it.product_id ?? it.product?.id,
                    active: pl.is_active ?? pl.active ?? pl.status === "active",
                    created_at: pl.created_at ?? pl.createdAt,
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
              candidates = entries.filter((e) => Number(e.product_id) === pid)
            }
            if (candidates.length > 0) {
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
        setItems(updated)
      })()
      return
    }

    setItems(updated)
  }

  const calculateSubtotal = () =>
    items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0) - (Number(item.discount) || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setError(null)
    setLoading(true)
    try {
      // confirm when changing status to submitted
      if (formData.order_status === "submitted") {
        const ok = typeof window !== "undefined" ? window.confirm("Submit this order? Once submitted it will be locked for editing.") : true
        if (!ok) {
          setLoading(false)
          return
        }
      }
      const payload: any = {}
      if (formData.order_status) payload.order_status = formData.order_status
      if (formData.payment_status) payload.payment_status = formData.payment_status
      await saleApi.sales.update(id, payload)
      router.push("/sale_user/sale-orders")
    } catch (err: any) {
      console.error(err)
      setError(err?.message || "Failed to update sale")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!id) return
    setLoading(true)
    const t = toast.toast({ title: "Cancelling order..." })
    try {
      await saleApi.sales.update(id, { order_status: "cancelled" })
      toast.update(t.id, { title: "Order cancelled" })
      router.push("/sale_user/sale-orders")
    } catch (err: any) {
      toast.update(t.id, { title: "Cancel failed", description: err?.message || "Failed to cancel" })
    } finally {
      setLoading(false)
    }
  }

  if (loadingSale) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/sale_user/sale-orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-balance">Edit Sale Order</h1>
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
        <Link href="/sale_user/sale-orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-balance">Edit Sale Order</h1>
          <p className="text-muted-foreground">{isEditable ? "You can edit this draft." : "Order submitted — editing disabled."}</p>
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
                    <Input id="invoice_number" placeholder="INV-..." value={formData.invoice_number} onChange={(e) => handleChange("invoice_number", e.target.value)} disabled={!isEditable} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user_id">Created By (User ID) *</Label>
                    <Input id="user_id" type="number" min="1" placeholder="Enter your user ID" value={formData.user_id} onChange={(e) => handleChange("user_id", e.target.value)} disabled={!isEditable} required />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customer_id">Customer</Label>
                    <Select value={formData.customer_id} onValueChange={(v) => handleChange("customer_id", v)} disabled={!isEditable}>
                      <SelectTrigger id="customer_id">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Walk-in</SelectItem>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order_status">Order Status</Label>
                    <Select value={formData.order_status} onValueChange={(v) => handleChange("order_status", v)} disabled={!isEditable}>
                      <SelectTrigger id="order_status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Note</Label>
                  <Input id="note" placeholder="Add an optional note" value={formData.note} onChange={(e) => handleChange("note", e.target.value)} disabled={!isEditable} />
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <CardTitle>Items</CardTitle>
                      <Button type="button" variant="outline" onClick={handleAddItem} disabled={!isEditable || loadingProducts}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-48">
                        <Label>Supplier</Label>
                        <Select value={supplierFilter} onValueChange={(v)=>setSupplierFilter(v)} disabled={!isEditable}>
                          <SelectTrigger>
                            <SelectValue placeholder="All suppliers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {suppliers.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-48">
                        <Label>Category</Label>
                        <Select value={categoryFilter} onValueChange={(v)=>setCategoryFilter(v)} disabled={!isEditable}>
                          <SelectTrigger>
                            <SelectValue placeholder="All categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label>Search product</Label>
                        <Input placeholder="Type name or SKU" value={productSearch} onChange={(e)=>setProductSearch(e.target.value)} disabled={!isEditable} />
                      </div>
                    </div>
                  </div>
                </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No items added yet.</div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
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
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-36">
                                    <Select value={item.supplier_filter || 'all'} onValueChange={(v) => handleItemChange(index, 'supplier_filter', v)} disabled={!isEditable}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Supplier" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {suppliers.map((s) => (
                                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="w-36">
                                    <Select value={item.category_filter || 'all'} onValueChange={(v) => handleItemChange(index, 'category_filter', v)} disabled={!isEditable}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Category" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {categories.map((c) => (
                                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Input placeholder="Search name or SKU" value={item.product_search || ''} onChange={(e) => handleItemChange(index, 'product_search', e.target.value)} disabled={!isEditable} />
                                </div>

                                <Select value={item.product_id} onValueChange={(v) => handleItemChange(index, 'product_id', v)} disabled={!isEditable || loadingProducts}>
                                  <SelectTrigger>
                                    <SelectValue placeholder={loadingProducts ? 'Loading...' : 'Select product'} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products
                                      .filter(p => {
                                        if (item.supplier_filter && item.supplier_filter !== 'all' && Number(p.supplier_id) !== Number(item.supplier_filter)) return false
                                        if (item.category_filter && item.category_filter !== 'all' && Number(p.category_id) !== Number(item.category_filter)) return false
                                        if (item.product_search) {
                                          const q = (item.product_search || '').toLowerCase()
                                          return (p.name || '').toLowerCase().includes(q) || (String(p.sku || '')).toLowerCase().includes(q)
                                        }
                                        return true
                                      })
                                      .map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <div className="text-sm text-muted-foreground mt-1">SKU: {(() => {
                                  const prod = products.find(pp => String(pp.id) === item.product_id)
                                  return prod?.sku || '-'
                                })()}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value)} className="w-20" disabled={!isEditable} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" step="0.01" min="0" value={item.unit_price} className="w-32" readOnly disabled={!isEditable} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" step="0.01" min="0" value={item.discount} onChange={(e) => handleItemChange(index, "discount", e.target.value)} className="w-32" disabled={!isEditable} />
                            </TableCell>
                            <TableCell>
                              {(((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)) - (Number(item.discount) || 0)).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} disabled={!isEditable}>
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
                {isEditable ? (
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
                ) : (
                  <Button type="button" variant="destructive" className="w-full" onClick={handleCancelOrder} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      "Cancel Order"
                    )}
                  </Button>
                )}

                <Link href="/sale_user/sale-orders" className="block">
                  <Button type="button" variant="outline" className="w-full bg-transparent" disabled={loading}>
                    Back
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
