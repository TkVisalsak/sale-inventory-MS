"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api as productApi } from "@/lib/inventory-api/product-api"
import { api as categoryApi } from "@/lib/inventory-api/category-api"
import { api as supplierApi } from "@/lib/inventory-api/supplier-api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"

export default function NewProductPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    category_id: "",
    unit: "",
    description: "",
    availability: true,
    supplier_id: "",
  })
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const data = await categoryApi.categories.getAll()
        setCategories(Array.isArray(data) ? data : [])
      } catch (err: any) {
        console.error("Error fetching categories:", err)
      } finally {
        setLoadingCategories(false)
      }
    }

    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true)
        const data = await supplierApi.suppliers.getAll()
        setSuppliers(Array.isArray(data) ? data : [])
      } catch (err: any) {
        console.error("Error fetching suppliers:", err)
      } finally {
        setLoadingSuppliers(false)
      }
    }

    fetchCategories()
    fetchSuppliers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const productData = {
        name: formData.name.trim(),
        barcode: formData.barcode.trim() || null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        unit: formData.unit.trim() || null,
        description: formData.description.trim() || null,
        availability: formData.availability,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
      }

      if (!productData.name) {
        setError("Product name is required")
        setLoading(false)
        return
      }

      if (!productData.category_id) {
        setError("Category is required")
        setLoading(false)
        return
      }

      await productApi.products.create(productData)
      router.push("/inventory_user/products")
    } catch (err: any) {
      console.error("Error creating product:", err)
      
      // Handle validation errors
      if (err.data?.errors) {
        const errorMessages = Object.values(err.data.errors).flat()
        setError(errorMessages.join(", ") || "Validation failed")
      } else {
        setError(err.message || err.data?.message || "Failed to create product. Please try again.")
      }
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory_user/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-balance">Add New Product</h1>
          <p className="text-muted-foreground">Create a new product in your inventory</p>
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
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter product name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category_id">Category *</Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(value) => handleChange("category_id", value)}
                      disabled={loadingCategories}
                    >
                      <SelectTrigger id="category_id">
                        <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length === 0 && !loadingCategories ? (
                          <SelectItem value="no-categories" disabled>No categories available</SelectItem>
                        ) : (
                          categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier_id">Supplier</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={formData.supplier_id || undefined} 
                        onValueChange={(value) => handleChange("supplier_id", value)}
                        disabled={loadingSuppliers}
                        className="flex-1"
                      >
                        <SelectTrigger id="supplier_id">
                          <SelectValue placeholder={loadingSuppliers ? "Loading suppliers..." : "Select supplier (optional)"} />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.length === 0 && !loadingSuppliers ? (
                            <SelectItem value="no-suppliers" disabled>No suppliers available</SelectItem>
                          ) : (
                            suppliers.map((supplier: any) => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {formData.supplier_id && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleChange("supplier_id", "")}
                          className="shrink-0"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    placeholder="Enter barcode"
                    value={formData.barcode}
                    onChange={(e) => handleChange("barcode", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    placeholder="e.g., pcs, kg, box"
                    value={formData.unit}
                    onChange={(e) => handleChange("unit", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Unit of measurement (optional)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter product description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="availability">Availability</Label>
                    <p className="text-sm text-muted-foreground">Make this product available for sale</p>
                  </div>
                  <Switch
                    id="availability"
                    checked={formData.availability}
                    onCheckedChange={(checked) => handleChange("availability", checked)}
                  />
                </div>
              </CardContent>
            </Card>

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
                      Save Product
                    </>
                  )}
                </Button>
                <Link href="/inventory_user/products" className="block">
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
