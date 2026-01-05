"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Package, Loader2, Eye, X, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { api as productApi } from "@/lib/inventory-api/product-api"
import { api as categoryApi } from "@/lib/inventory-api/category-api"
import { api as supplierApi } from "@/lib/inventory-api/supplier-api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface Product {
  id: number
  name: string
  barcode?: string
  category?: { id: number; name: string }
  supplier?: { id: number; name: string }
  unit?: string
  description?: string
  availability?: boolean
  totalQuantity?: number
  expirationStatus?: "expired" | "expiring_soon" | "good"
  earliestExpiryDate?: string
  lowStockStatus?: boolean
}

interface Category {
  id: number
  name: string
}

interface Supplier {
  id: number
  name: string
}

const LOW_STOCK_THRESHOLD = 10

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSupplier, setSelectedSupplier] = useState("all")

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const hasActiveFilters =
    selectedCategory !== "all" || selectedSupplier !== "all" || searchQuery.trim() !== ""

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setLoadingFilters(true)
        setError(null)

        const [productsData, categoriesData, suppliersData] = await Promise.all([
          productApi.products.getAll(),
          categoryApi.categories.getAll(),
          supplierApi.suppliers.getAll(),
        ])

        setProducts(
          Array.isArray(productsData)
            ? productsData.map((p: any) => ({
                id: p.id,
                name: p.name || "",
                barcode: p.barcode || "",
                category: p.category || null,
                supplier: p.supplier || null,
                unit: p.unit || "",
                description: p.description || "",
                availability: p.availability !== false,
                totalQuantity: p.totalQuantity ?? 0,
                expirationStatus: p.expirationStatus ?? "good",
                earliestExpiryDate: p.earliestExpiryDate ?? "",
                lowStockStatus: p.totalQuantity !== undefined && p.totalQuantity < LOW_STOCK_THRESHOLD,
              }))
            : []
        )

        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : [])
      } catch (err: any) {
        console.error(err)
        setError(err.message || "Failed to load data")
      } finally {
        setLoading(false)
        setLoadingFilters(false)
      }
    }

    fetchData()
  }, [])

  // Filtered products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.category && product.category.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.supplier && product.supplier.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory =
      selectedCategory === "all" || product.category?.id === Number(selectedCategory)

    const matchesSupplier =
      selectedSupplier === "all" || product.supplier?.id === Number(selectedSupplier)

    return matchesSearch && matchesCategory && matchesSupplier
  })

  // Badge helpers
  const getExpirationStatusBadge = (status: Product["expirationStatus"]) => {
    switch (status) {
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      case "expiring_soon":
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-600">
            Expiring Soon
          </Badge>
        )
      default:
        return null
    }
  }

  const getLowStockBadge = (lowStock: boolean) => {
    if (lowStock) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Low Stock
        </Badge>
      )
    }
    return null
  }

  // Delete handlers
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return
    try {
      setDeleting(true)
      await productApi.products.delete(productToDelete.id)
      setProducts(products.filter((p) => p.id !== productToDelete.id))
      setDeleteDialogOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedSupplier("all")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Inventory Overview</h1>
          <p className="text-muted-foreground">
            View product stock quantities, expiration status, and stock levels
          </p>
        </div>
        <Link href="/inventory_user/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
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
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="shrink-0">
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16">
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
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {hasActiveFilters ? "No products match your filters." : "No products found."}
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
                      <TableCell className="font-mono text-sm">{product.barcode || "N/A"}</TableCell>
                      <TableCell>{product.category?.name || "N/A"}</TableCell>
                      <TableCell>{product.supplier?.name || "N/A"}</TableCell>
                      <TableCell>
                        {product.totalQuantity}
                        {product.earliestExpiryDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Earliest expiry: {new Date(product.earliestExpiryDate).toLocaleDateString()}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="flex flex-col gap-1">
                        {getExpirationStatusBadge(product.expirationStatus!)}
                        {getLowStockBadge(product.lowStockStatus!)}
                        {product.totalQuantity === 0 && (
                          <Badge variant="outline" className="border-red-500 text-red-600">
                            Out of Stock
                          </Badge>
                        )}
                        {product.totalQuantity > 0 && !product.lowStockStatus && (
                          <Badge variant="secondary">In Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Link href={`/inventory_user/products/view?id=${product.id}`}>
                          <Button variant="ghost" size="icon-sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/inventory_user/products/edit?id=${product.id}`}>
                          <Button variant="ghost" size="icon-sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteClick(product)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{productToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
