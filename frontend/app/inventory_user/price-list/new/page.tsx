"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { api as priceListApi } from "@/lib/inventory-api/price-list-api"
import { api as productApi } from "@/lib/inventory-api/product-api"
import { api as batchApi } from "@/lib/inventory-api/batch-api"
import { api as categoryApi } from "@/lib/inventory-api/category-api"
import { api as supplierApi } from "@/lib/inventory-api/supplier-api"

interface Category { id: number; name: string }
interface Supplier { id: number; name: string }
interface Product {
  id: number
  name: string
  barcode?: string
  category?: Category
  supplier?: Supplier
}

export default function NewPriceListPage() {
  const router = useRouter()
const [formData, setFormData] = useState({
  category_id: "all",
  supplier_id: "all",
  product_id: "",
  price: "",
  old_price: "",
  batch_price: "",
  is_active: true,
})

  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch categories, suppliers, products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingCategories(true)
        setLoadingSuppliers(true)
        setLoadingProducts(true)

        // Also fetch existing price lists so we only show products without a price
        const [categoriesData, suppliersData, productsData, priceListsData] = await Promise.all([
          categoryApi.categories.getAll(),
          supplierApi.suppliers.getAll(),
          productApi.products.getAll(),
          priceListApi.priceLists.getAll(),
        ])

        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : [])

        const allProducts = Array.isArray(productsData) ? productsData : []
        const priceLists = Array.isArray(priceListsData) ? priceListsData : []

        // Filter out products that already have a price list entry
        const productsWithoutPrice = allProducts.filter(
          (p: any) => !priceLists.some((pl: any) => Number(pl.product_id) === Number(p.id))
        )

        setProducts(productsWithoutPrice)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load data")
      } finally {
        setLoadingCategories(false)
        setLoadingSuppliers(false)
        setLoadingProducts(false)
      }
    }
    fetchData()
  }, [])

  // Filter products by category and supplier
  useEffect(() => {
    let filtered = products

  if (formData.category_id !== "all") {
  filtered = filtered.filter(
    (p) => p.category?.id === Number(formData.category_id)
  )
}

if (formData.supplier_id !== "all") {
  filtered = filtered.filter(
    (p) => p.supplier?.id === Number(formData.supplier_id)
  )
}


    setFilteredProducts(filtered)

    if (formData.product_id) {
      const exists = filtered.some((p) => p.id === Number(formData.product_id))
      if (!exists) setFormData((prev) => ({ ...prev, product_id: "" }))
    }
  }, [formData.category_id, formData.supplier_id, products])

  // When a product is selected, auto-fill batch_price from the latest batch for that product
  useEffect(() => {
    const fillBatchPrice = async () => {
      if (!formData.product_id) return

      try {
        const productId = Number(formData.product_id)
        const batchesData = await batchApi.batches.getAll()
        if (!Array.isArray(batchesData)) return

        // Flatten batch items and include purchase_date for sorting
        const items: Array<any> = []
        batchesData.forEach((batch: any) => {
          if (!batch.items || !Array.isArray(batch.items)) return
          batch.items.forEach((bi: any) => {
            if (Number(bi.product_id) === productId) {
              items.push({
                unit_cost: bi.unit_cost,
                purchase_date: batch.purchase_date,
                batch_id: batch.batch_id,
              })
            }
          })
        })

        if (items.length === 0) return

        // Find latest by purchase_date (descending)
        items.sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())
        const latest = items[0]

        if (latest && latest.unit_cost !== undefined && latest.unit_cost !== null) {
          setFormData((prev) => ({ ...prev, batch_price: String(latest.unit_cost) }))
        }
      } catch (e) {
        console.error("Failed to auto-fill batch price:", e)
      }
    }

    fillBatchPrice()
  }, [formData.product_id])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!formData.product_id) {
      setError("Please select a product")
      setLoading(false)
      return
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      setError("Price is required and must be greater than 0")
      setLoading(false)
      return
    }

    const payload: any = {
      product_id: Number(formData.product_id),
      price,
      is_active: formData.is_active,
    }

    // Only include optional fields if they have values
    if (formData.old_price && formData.old_price.trim() !== "") {
      const oldPrice = parseFloat(formData.old_price)
      if (!isNaN(oldPrice) && oldPrice >= 0) {
        payload.old_price = oldPrice
      }
    }

    if (formData.batch_price && formData.batch_price.trim() !== "") {
      const batchPrice = parseFloat(formData.batch_price)
      if (!isNaN(batchPrice) && batchPrice >= 0) {
        payload.batch_price = batchPrice
      }
    }

    console.log("Sending payload:", payload)

    try {
      await priceListApi.priceLists.create(payload)
      router.push("/inventory_user/price-list")
    } catch (err: any) {
      console.error("Error creating price list:", err)
      console.error("Full error object:", JSON.stringify(err, null, 2))
      console.error("Error data:", err.data)
      console.error("Error status:", err.status)
      
      // Handle different error response structures
      let errorMessage = "Failed to create price list."
      
      if (err.data) {
        // Laravel validation errors (422) - errors object
        if (err.data.errors && typeof err.data.errors === 'object') {
          const errorMessages: string[] = []
          Object.values(err.data.errors).forEach((errorArray: any) => {
            if (Array.isArray(errorArray)) {
              errorMessages.push(...errorArray)
            } else {
              errorMessages.push(String(errorArray))
            }
          })
          errorMessage = errorMessages.length > 0 ? errorMessages.join(", ") : errorMessage
        }
        // Backend error response (500) - error field
        else if (err.data.error) {
          errorMessage = err.data.error
        }
        // Standard message
        else if (err.data.message) {
          errorMessage = err.data.message
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory_user/price-list">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-balance">Add New Price</h1>
          <p className="text-muted-foreground">Create a new price list entry</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Product Filter Card */}
          <Card>
            <CardHeader>
              <CardTitle>Filter & Select Product</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Category Filter */}
                <div className="space-y-2">
                  <Label htmlFor="category_id">Filter by Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(val) => handleChange("category_id", val)}
                    disabled={loadingCategories}
                  >
                    <SelectTrigger id="category_id">
                      <SelectValue placeholder={loadingCategories ? "Loading..." : "All Categories"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Supplier Filter */}
                <div className="space-y-2">
                  <Label htmlFor="supplier_id">Filter by Supplier</Label>
                  <Select
                    value={formData.supplier_id || ""}
                    onValueChange={(val) => handleChange("supplier_id", val)}
                    disabled={loadingSuppliers}
                  >
                    <SelectTrigger id="supplier_id">
                      <SelectValue placeholder={loadingSuppliers ? "Loading..." : "All Suppliers"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Suppliers</SelectItem>

                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Product Select */}
              <div className="space-y-2">
                <Label htmlFor="product_id">Select Product *</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(val) => handleChange("product_id", val)}
                  disabled={loadingProducts || filteredProducts.length === 0}
                >
                  <SelectTrigger id="product_id">
                    <SelectValue
                      placeholder={
                        loadingProducts
                          ? "Loading products..."
                          : filteredProducts.length === 0
                          ? "No products available"
                          : "Select a product"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} {p.barcode && `(${p.barcode})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Price Card */}
          <Card>
            <CardHeader>
              <CardTitle>Price Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="old_price">Old Price</Label>
                  <Input
                    id="old_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.old_price}
                    onChange={(e) => handleChange("old_price", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch_price">Batch Price</Label>
                  <Input
                    id="batch_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.batch_price}
                    onChange={(e) => handleChange("batch_price", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="is_active">Active</Label>
                  <p className="text-sm text-muted-foreground">Make this price active</p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(val) => handleChange("is_active", val)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {loading ? "Saving..." : "Save Price"}
              </Button>
              <Link href="/inventory_user/price-list">
                <Button type="button" variant="outline" className="w-full">Cancel</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
