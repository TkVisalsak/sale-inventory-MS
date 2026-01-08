"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Package, Loader2, Eye, X, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { api as productApi } from "@/lib/inventory-api/product-api"
import { api as categoryApi } from "@/lib/inventory-api/category-api"
import { api as supplierApi } from "@/lib/inventory-api/supplier-api"
import { api as batchApi } from "@/lib/inventory-api/batch-api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Product {
  id: number
  name: string
  barcode?: string
  category?: {
    id: number
    name: string
  }
  supplier?: {
    id: number
    name: string
  }
  unit?: string
  description?: string
  availability?: boolean
}

interface Category {
  id: number
  name: string
}

interface Supplier {
  id: number
  name: string
}

interface BatchItem {
  batch_item_id: number
  product_id: number
  quantity: number
  unit_cost: number
  expiry_date?: string
}

interface Batch {
  batch_id: number
  supplier_id: number
  invoice_no: string
  purchase_date: string
  total_cost: number
  status: string
  items?: BatchItem[]
}

interface ProductOverview extends Product {
  totalQuantity: number
  expirationStatus: 'expired' | 'expiring_soon' | 'good' | 'no_expiry'
  lowStockStatus: boolean
  earliestExpiryDate?: string
}

const LOW_STOCK_THRESHOLD = 10 // Default threshold for low stock

export default function OverviewPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all")
  const [products, setProducts] = useState<Product[]>([])
  const [productOverviews, setProductOverviews] = useState<ProductOverview[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setLoadingFilters(true)
        setError(null)

        // Fetch products, categories, suppliers, and batches in parallel
        const [productsData, categoriesData, suppliersData, batchesData] = await Promise.all([
          productApi.products.getAll(),
          categoryApi.categories.getAll(),
          supplierApi.suppliers.getAll(),
          batchApi.batches.getAll(),
        ])

        // Map products
        const mappedProducts = Array.isArray(productsData) ? productsData.map((product) => ({
          id: product.id,
          name: product.name || "",
          barcode: product.barcode || "",
          category: product.category || null,
          supplier: product.supplier || null,
          unit: product.unit || "",
          description: product.description || "",
          availability: product.availability !== false,
        })) : []
        setProducts(mappedProducts)

        // Map categories
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])

        // Map suppliers
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : [])

        // Map batches
        const mappedBatches: Batch[] = Array.isArray(batchesData) ? batchesData.map((batch: any) => ({
          batch_id: batch.batch_id || batch.id,
          supplier_id: batch.supplier_id,
          invoice_no: batch.invoice_no || "",
          purchase_date: batch.purchase_date || "",
          total_cost: batch.total_cost || 0,
          status: batch.status || "draft",
          items: batch.items || [],
        })) : []

        // Aggregate batch items by product
        const productQuantityMap = new Map<number, number>()
        const productExpiryMap = new Map<number, string[]>()

        mappedBatches.forEach((batch) => {
          if (batch.items && Array.isArray(batch.items)) {
            batch.items.forEach((item: BatchItem) => {
              const productId = item.product_id
              const quantity = item.quantity || 0
              
              // Aggregate quantities
              const currentQuantity = productQuantityMap.get(productId) || 0
              productQuantityMap.set(productId, currentQuantity + quantity)

              // Collect expiry dates
              if (item.expiry_date) {
                const expiryDates = productExpiryMap.get(productId) || []
                expiryDates.push(item.expiry_date)
                productExpiryMap.set(productId, expiryDates)
              }
            })
          }
        })

        // Calculate expiration status and low stock status for each product
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const thirtyDaysFromNow = new Date(today)
        thirtyDaysFromNow.setDate(today.getDate() + 30)

        const overviews: ProductOverview[] = mappedProducts.map((product) => {
          const totalQuantity = productQuantityMap.get(product.id) || 0
          const expiryDates = productExpiryMap.get(product.id) || []
          
          // Find earliest expiry date
          let earliestExpiryDate: string | undefined
          let expirationStatus: 'expired' | 'expiring_soon' | 'good' | 'no_expiry' = 'no_expiry'

          if (expiryDates.length > 0) {
            const sortedDates = expiryDates
              .map(date => new Date(date))
              .filter(date => !isNaN(date.getTime()))
              .sort((a, b) => a.getTime() - b.getTime())
            
            if (sortedDates.length > 0) {
              earliestExpiryDate = sortedDates[0].toISOString().split('T')[0]
              const earliestDate = sortedDates[0]
              
              if (earliestDate < today) {
                expirationStatus = 'expired'
              } else if (earliestDate <= thirtyDaysFromNow) {
                expirationStatus = 'expiring_soon'
              } else {
                expirationStatus = 'good'
              }
            }
          }

          // Check low stock status
          const lowStockStatus = totalQuantity > 0 && totalQuantity < LOW_STOCK_THRESHOLD

          return {
            ...product,
            totalQuantity,
            expirationStatus,
            lowStockStatus,
            earliestExpiryDate,
          }
        })

        setProductOverviews(overviews)
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load data")
      } finally {
        setLoading(false)
        setLoadingFilters(false)
      }
    }

    fetchData()
  }, [])

  const filteredProducts = productOverviews.filter((product) => {
    // Search filter
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.category && product.category.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.supplier && product.supplier.name.toLowerCase().includes(searchQuery.toLowerCase()))

    // Category filter
    const matchesCategory =
      selectedCategory === "all" || product.category?.id === Number(selectedCategory)

    // Supplier filter
    const matchesSupplier =
      selectedSupplier === "all" || product.supplier?.id === Number(selectedSupplier)

    return matchesSearch && matchesCategory && matchesSupplier
  })

  const hasActiveFilters = selectedCategory !== "all" || selectedSupplier !== "all"

  const clearFilters = () => {
    setSelectedCategory("all")
    setSelectedSupplier("all")
  }

  const getExpirationStatusBadge = (status: ProductOverview['expirationStatus']) => {
    switch (status) {
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>
      case 'expiring_soon':
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Expiring Soon</Badge>
      case 'good':
        return <Badge variant="secondary">Good</Badge>
      case 'no_expiry':
        return <Badge variant="outline">No Expiry</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getLowStockBadge = (lowStock: boolean) => {
    if (lowStock) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Low Stock
      </Badge>
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Overview</h1>
          <p className="text-muted-foreground">View product stock quantities, expiration status, and stock levels</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>All Products</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  disabled={loadingFilters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingFilters ? "Loading..." : "Filter by Category"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <Select
                  value={selectedSupplier}
                  onValueChange={setSelectedSupplier}
                  disabled={loadingFilters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingFilters ? "Loading..." : "Filter by Supplier"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="shrink-0"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Total Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Expiration Status</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead>View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {searchQuery || hasActiveFilters
                        ? "No products found matching your filters."
                        : "No products found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.barcode || "N/A"}
                      </TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="outline">{product.category.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="truncate text-muted-foreground">
                          {product.supplier?.name || "N/A"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{product.totalQuantity}</span>
                        {product.earliestExpiryDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Earliest expiry: {new Date(product.earliestExpiryDate).toLocaleDateString()}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{product.unit || "N/A"}</span>
                      </TableCell>
                      <TableCell>
                        {getExpirationStatusBadge(product.expirationStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getLowStockBadge(product.lowStockStatus)}
                          {product.totalQuantity === 0 && (
                            <Badge variant="outline" className="border-red-500 text-red-600">
                              Out of Stock
                            </Badge>
                          )}
                          {product.totalQuantity > 0 && !product.lowStockStatus && (
                            <Badge variant="secondary">In Stock</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/inventory_user/products/view?id=${product.id}`}>
                          <Button variant="ghost" size="icon-sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
