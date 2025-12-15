"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Package, Loader2, Eye, X } from "lucide-react"
import Link from "next/link"
import { api as productApi } from "@/lib/inventory-api/product-api"
import { api as categoryApi } from "@/lib/inventory-api/category-api"
import { api as supplierApi } from "@/lib/inventory-api/supplier-api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setLoadingFilters(true)
        setError(null)

        // Fetch products, categories, and suppliers in parallel
        const [productsData, categoriesData, suppliersData] = await Promise.all([
          productApi.products.getAll(),
          categoryApi.categories.getAll(),
          supplierApi.suppliers.getAll(),
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

  const filteredProducts = products.filter((product) => {
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

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    try {
      setDeleting(true)
      await productApi.products.delete(productToDelete.id.toString())
      // Remove the product from the list
      setProducts(products.filter((prod) => prod.id !== productToDelete.id))
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    } catch (err: any) {
      console.error("Error deleting product:", err)
      setError(err.message || "Failed to delete product")
      setDeleteDialogOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (availability: boolean | undefined) => {
    if (availability !== false) {
      return <Badge variant="secondary">Available</Badge>
    }
    return <Badge variant="outline">Unavailable</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <Link href="/inventory_user/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
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
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                        <span className="text-muted-foreground">{product.unit || "N/A"}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(product.availability)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{productToDelete?.name}". 
              This action cannot be undone.
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
