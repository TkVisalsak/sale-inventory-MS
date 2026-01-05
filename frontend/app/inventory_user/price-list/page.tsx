"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Package, Loader2, Eye, X } from "lucide-react"
import Link from "next/link"
import { api as priceListApi } from "@/lib/inventory-api/price-list-api"
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

interface PriceList {
  id: number
  product_id: number
  supplier_id?: number
  category_id?: number
  price: number
  old_price?: number
  batch_price?: number
  is_active: boolean
  product?: {
    id: number
    name: string
    barcode?: string
    unit?: string
    category?: {
      id: number
      name: string
    }
    supplier?: {
      id: number
      name: string
    }
  }
  supplier?: {
    id: number
    name: string
  }
  category?: {
    id: number
    name: string
  }
  created_at?: string
}

interface Category {
  id: number
  name: string
}

interface Supplier {
  id: number
  name: string
}

export default function PriceListPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all")
  const [priceLists, setPriceLists] = useState<PriceList[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [priceListToDelete, setPriceListToDelete] = useState<PriceList | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setLoadingFilters(true)
        setError(null)

        // Fetch price lists, categories, and suppliers in parallel
        const [priceListsData, categoriesData, suppliersData] = await Promise.all([
          priceListApi.priceLists.getAll(),
          categoryApi.categories.getAll(),
          supplierApi.suppliers.getAll(),
        ])

        // Map price lists
        const mappedPriceLists = Array.isArray(priceListsData) ? priceListsData : []
        setPriceLists(mappedPriceLists)

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

  const filteredPriceLists = priceLists.filter((priceList) => {
    const product = priceList.product
    const category = priceList.category || product?.category
    const supplier = priceList.supplier || product?.supplier

    // Search filter
    const matchesSearch =
      product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product?.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (category && category.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (supplier && supplier.name.toLowerCase().includes(searchQuery.toLowerCase()))

    // Category filter
    const matchesCategory =
      selectedCategory === "all" || category?.id === Number(selectedCategory)

    // Supplier filter
    const matchesSupplier =
      selectedSupplier === "all" || supplier?.id === Number(selectedSupplier)

    return matchesSearch && matchesCategory && matchesSupplier
  })

  const hasActiveFilters = selectedCategory !== "all" || selectedSupplier !== "all"

  const clearFilters = () => {
    setSelectedCategory("all")
    setSelectedSupplier("all")
  }

  const handleDeleteClick = (priceList: PriceList) => {
    setPriceListToDelete(priceList)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!priceListToDelete) return

    try {
      setDeleting(true)
      await priceListApi.priceLists.delete(priceListToDelete.id.toString())
      // Remove the price list from the list
      setPriceLists(priceLists.filter((pl) => pl.id !== priceListToDelete.id))
      setDeleteDialogOpen(false)
      setPriceListToDelete(null)
    } catch (err: any) {
      console.error("Error deleting price list:", err)
      setError(err.message || "Failed to delete price list")
      setDeleteDialogOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (isActive: boolean | undefined) => {
    if (isActive !== false) {
      return <Badge variant="secondary">Active</Badge>
    }
    return <Badge variant="outline">Inactive</Badge>
  }

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return "N/A"
    return `$${Number(price).toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Price Lists</h1>
          <p className="text-muted-foreground">Product prices</p>
        </div>
        <Link href="/inventory_user/price-list/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Price
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>All Price Lists</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search price lists..."
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
                  <TableHead>Current Price</TableHead>
                  <TableHead>Old Price</TableHead>
                  <TableHead>Batch Price</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPriceLists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      {searchQuery || hasActiveFilters
                        ? "No price lists found matching your filters."
                        : "No price lists found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPriceLists.map((priceList) => (
                    <TableRow key={priceList.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium">{priceList.product?.name || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {priceList.product?.barcode || "N/A"}
                      </TableCell>
                      <TableCell>
                        {(priceList.category || priceList.product?.category) ? (
                          <Badge variant="outline">
                            {priceList.category?.name || priceList.product?.category?.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="truncate text-muted-foreground">
                          {(priceList.supplier || priceList.product?.supplier)?.name || "N/A"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{formatPrice(priceList.price)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{formatPrice(priceList.old_price)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{formatPrice(priceList.batch_price)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{priceList.product?.unit || "N/A"}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(priceList.is_active)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/inventory_user/price-list/edit?id=${priceList.id}`}>
                            <Button variant="ghost" size="icon-sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon-sm"
                            onClick={() => handleDeleteClick(priceList)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
              This will permanently delete the price list for "{priceListToDelete?.product?.name}". 
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
