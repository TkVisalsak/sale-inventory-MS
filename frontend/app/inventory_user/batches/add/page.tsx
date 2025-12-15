"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api as batchApi } from "@/lib/inventory-api/batch-api"
import { api as productApi } from "@/lib/inventory-api/product-api"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Product {
  id: number
  name: string
}

export default function NewBatchPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    product_id: "",
    batch_number: "",
    expiration_date: "",
    buy_price: "",
    market_price: "",
    current_quantity: "",
    warehouse_location: "",
    received_date: "",
  })
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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

    fetchProducts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const batchData = {
        product_id: formData.product_id ? parseInt(formData.product_id) : null,
        batch_number: formData.batch_number.trim() || null,
        expiration_date: formData.expiration_date || null,
        buy_price: formData.buy_price ? parseFloat(formData.buy_price) : null,
        market_price: formData.market_price ? parseFloat(formData.market_price) : null,
        current_quantity: formData.current_quantity ? parseInt(formData.current_quantity) : 0,
        warehouse_location: formData.warehouse_location.trim() || null,
        received_date: formData.received_date || null,
      }

      if (!batchData.product_id) {
        setError("Product is required")
        setLoading(false)
        return
      }

      if (batchData.current_quantity < 0) {
        setError("Quantity must be 0 or greater")
        setLoading(false)
        return
      }

      await batchApi.batches.create(batchData)
      router.push("/inventory_user/batches")
    } catch (err: any) {
      console.error("Error creating batch:", err)

      // Handle validation errors
      if (err.data?.errors) {
        const errorMessages = Object.values(err.data.errors).flat()
        setError(errorMessages.join(", ") || "Validation failed")
      } else {
        setError(err.message || err.data?.message || "Failed to create batch. Please try again.")
      }
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Set default received_date to today
  useEffect(() => {
    if (!formData.received_date) {
      const today = new Date().toISOString().split("T")[0]
      setFormData((prev) => ({ ...prev, received_date: today }))
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory_user/batches">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-balance">Add New Batch</h1>
          <p className="text-muted-foreground">Create a new product batch</p>
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
                <div className="space-y-2">
                  <Label htmlFor="product_id">Product *</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => handleChange("product_id", value)}
                    disabled={loadingProducts}
                  >
                    <SelectTrigger id="product_id">
                      <SelectValue placeholder={loadingProducts ? "Loading products..." : "Select product"} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.length === 0 && !loadingProducts ? (
                        <SelectItem value="no-products" disabled>No products available</SelectItem>
                      ) : (
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="batch_number">Batch Number</Label>
                    <Input
                      id="batch_number"
                      placeholder="Enter batch number"
                      value={formData.batch_number}
                      onChange={(e) => handleChange("batch_number", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_quantity">Quantity *</Label>
                    <Input
                      id="current_quantity"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.current_quantity}
                      onChange={(e) => handleChange("current_quantity", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="buy_price">Buy Price</Label>
                    <Input
                      id="buy_price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.buy_price}
                      onChange={(e) => handleChange("buy_price", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="market_price">Market Price</Label>
                    <Input
                      id="market_price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.market_price}
                      onChange={(e) => handleChange("market_price", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="received_date">Received Date</Label>
                    <Input
                      id="received_date"
                      type="date"
                      value={formData.received_date}
                      onChange={(e) => handleChange("received_date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiration_date">Expiration Date</Label>
                    <Input
                      id="expiration_date"
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => handleChange("expiration_date", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warehouse_location">Warehouse Location</Label>
                  <Input
                    id="warehouse_location"
                    placeholder="Enter warehouse location"
                    value={formData.warehouse_location}
                    onChange={(e) => handleChange("warehouse_location", e.target.value)}
                  />
                </div>
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
                      Save Batch
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
