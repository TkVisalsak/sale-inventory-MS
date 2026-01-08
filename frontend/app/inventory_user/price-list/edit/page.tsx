"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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
import { api as categoryApi } from "@/lib/inventory-api/category-api"
import { api as supplierApi } from "@/lib/inventory-api/supplier-api"
import { api as batchApi } from "@/lib/inventory-api/batch-api"

interface Category { id: number; name: string }
interface Supplier { id: number; name: string }
interface Product { id: number; name: string; barcode?: string; category?: Category; supplier?: Supplier }

export default function EditPriceListPage() {
  const router = useRouter()
  const search = useSearchParams()
  const id = search.get('id') || ''

  const [formData, setFormData] = useState({
    product_id: '',
    price: '',
    old_price: '',
    batch_price: '',
    is_active: true,
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setLoadingMeta(true)
        const [categoriesData, suppliersData, productsData] = await Promise.all([
          categoryApi.categories.getAll(),
          supplierApi.suppliers.getAll(),
          productApi.products.getAll(),
        ])

        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : [])
        setProducts(Array.isArray(productsData) ? productsData : [])
        setFilteredProducts(Array.isArray(productsData) ? productsData : [])
      } catch (e) {
        console.error(e)
        setError('Failed to load metadata')
      } finally {
        setLoadingMeta(false)
      }
    }

    fetchMeta()
  }, [])

  useEffect(() => {
    const fetchPrice = async () => {
      if (!id) return
      try {
        const data: any = await priceListApi.priceLists.getById(id)
        if (data) {
          setFormData({
            product_id: String(data.product_id || ''),
            price: data.price !== undefined && data.price !== null ? String(data.price) : '',
            old_price: data.old_price !== undefined && data.old_price !== null ? String(data.old_price) : '',
            batch_price: data.batch_price !== undefined && data.batch_price !== null ? String(data.batch_price) : '',
            is_active: data.is_active !== false,
          })
        }
      } catch (e) {
        console.error('Failed to load price list', e)
        setError('Failed to load price list')
      }
    }

    fetchPrice()
  }, [id])

  // Auto-fill batch_price when product changes
  useEffect(() => {
    const fillBatchPrice = async () => {
      if (!formData.product_id) return
      try {
        const productId = Number(formData.product_id)
        const batchesData = await batchApi.batches.getAll()
        if (!Array.isArray(batchesData)) return

        const items: Array<any> = []
        batchesData.forEach((batch: any) => {
          if (!batch.items || !Array.isArray(batch.items)) return
          batch.items.forEach((bi: any) => {
            if (Number(bi.product_id) === productId) {
              items.push({ unit_cost: bi.unit_cost, purchase_date: batch.purchase_date })
            }
          })
        })

        if (items.length === 0) return
        items.sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())
        const latest = items[0]
        if (latest && latest.unit_cost !== undefined && latest.unit_cost !== null) {
          setFormData((prev) => ({ ...prev, batch_price: String(latest.unit_cost) }))
        }
      } catch (e) {
        console.error('Failed to auto-fill batch price:', e)
      }
    }
    fillBatchPrice()
  }, [formData.product_id])

  useEffect(() => {
    // keep filtered products in sync with products list
    setFilteredProducts(products)
  }, [products])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!formData.product_id) {
      setError('Please select a product')
      setLoading(false)
      return
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      setError('Price is required and must be greater than 0')
      setLoading(false)
      return
    }

    const payload: any = {
      product_id: Number(formData.product_id),
      price,
      is_active: formData.is_active,
    }

    if (formData.old_price && formData.old_price.trim() !== "") {
      const oldPrice = parseFloat(formData.old_price)
      if (!isNaN(oldPrice) && oldPrice >= 0) payload.old_price = oldPrice
    }

    if (formData.batch_price && formData.batch_price.trim() !== "") {
      const batchPrice = parseFloat(formData.batch_price)
      if (!isNaN(batchPrice) && batchPrice >= 0) payload.batch_price = batchPrice
    }

    try {
      await priceListApi.priceLists.update(id, payload)
      router.push('/inventory_user/price-list')
    } catch (err: any) {
      console.error('Error updating price list:', err)
      setError(err?.data?.message || err?.message || 'Failed to update price list')
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
          <h1 className="text-3xl font-bold text-balance">Edit Price</h1>
          <p className="text-muted-foreground">Update price list entry</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="product_id">Select Product *</Label>
                <Select value={formData.product_id} onValueChange={(val) => handleChange('product_id', val)}>
                  <SelectTrigger id="product_id">
                    <SelectValue placeholder={loadingMeta ? 'Loading products...' : 'Select a product'} />
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

          <Card>
            <CardHeader>
              <CardTitle>Price Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input id="price" type="number" step="0.01" min="0" value={formData.price} onChange={(e) => handleChange('price', e.target.value)} required />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="old_price">Old Price</Label>
                  <Input id="old_price" type="number" step="0.01" min="0" value={formData.old_price} onChange={(e) => handleChange('old_price', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch_price">Batch Price</Label>
                  <Input id="batch_price" type="number" step="0.01" min="0" value={formData.batch_price} onChange={(e) => handleChange('batch_price', e.target.value)} />
                </div>
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
                <div>
                  <Label htmlFor="is_active">Active</Label>
                  <p className="text-sm text-muted-foreground">Make this price active</p>
                </div>
                <Switch id="is_active" checked={formData.is_active} onCheckedChange={(val) => handleChange('is_active', val)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {loading ? 'Saving...' : 'Save Price'}
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
