"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Boxes, Loader2, Eye, X } from "lucide-react"
import Link from "next/link"
import { api as batchApi } from "@/lib/inventory-api/batch-api"
import { api as productApi } from "@/lib/inventory-api/product-api"
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

interface Batch {
  id: number
  product_id: number
  batch_number?: string
  expiration_date?: string
  buy_price?: number
  market_price?: number
  current_quantity: number
  warehouse_location?: string
  received_date?: string
  product?: {
    id: number
    name: string
  }
}

interface Product {
  id: number
  name: string
}

export default function BatchesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<string>("all")
  const [batches, setBatches] = useState<Batch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setLoadingFilters(true)
        setError(null)

        // Fetch batches and products in parallel
        const [batchesData, productsData] = await Promise.all([
          batchApi.batches.getAll(),
          productApi.products.getAll(),
        ])

        // Map batches
        const mappedBatches = Array.isArray(batchesData) ? batchesData.map((batch) => ({
          id: batch.id,
          product_id: batch.product_id,
          batch_number: batch.batch_number || "",
          expiration_date: batch.expiration_date || "",
          buy_price: batch.buy_price || 0,
          market_price: batch.market_price || 0,
          current_quantity: batch.current_quantity || 0,
          warehouse_location: batch.warehouse_location || "",
          received_date: batch.received_date || "",
          product: batch.product || null,
        })) : []
        setBatches(mappedBatches)

        // Map products
        setProducts(Array.isArray(productsData) ? productsData : [])
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

  const filteredBatches = batches.filter((batch) => {
    // Search filter
    const matchesSearch =
      batch.batch_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.warehouse_location?.toLowerCase().includes(searchQuery.toLowerCase())

    // Product filter
    const matchesProduct =
      selectedProduct === "all" || batch.product_id === Number(selectedProduct)

    return matchesSearch && matchesProduct
  })

  const hasActiveFilters = selectedProduct !== "all"

  const clearFilters = () => {
    setSelectedProduct("all")
  }

  const handleDeleteClick = (batch: Batch) => {
    setBatchToDelete(batch)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!batchToDelete) return

    try {
      setDeleting(true)
      await batchApi.batches.delete(batchToDelete.id.toString())
      // Remove the batch from the list
      setBatches(batches.filter((b) => b.id !== batchToDelete.id))
      setDeleteDialogOpen(false)
      setBatchToDelete(null)
    } catch (err: any) {
      console.error("Error deleting batch:", err)
      setError(err.message || "Failed to delete batch")
      setDeleteDialogOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const }
    if (quantity < 10) return { label: "Low Stock", variant: "outline" as const }
    return { label: "In Stock", variant: "secondary" as const }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Batches</h1>
          <p className="text-muted-foreground">Manage product batches and inventory</p>
        </div>
        <Link href="/inventory_user/batches/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Batch
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>All Batches</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search batches..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Select
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                  disabled={loadingFilters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingFilters ? "Loading..." : "Filter by Product"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
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
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Buy Price</TableHead>
                  <TableHead>Market Price</TableHead>
                  <TableHead>Expiration Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      {searchQuery || hasActiveFilters
                        ? "No batches found matching your filters."
                        : "No batches found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map((batch) => {
                    const stockStatus = getStockStatus(batch.current_quantity)
                    return (
                      <TableRow key={batch.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Boxes className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-medium">{batch.product?.name || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {batch.batch_number || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{batch.current_quantity}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(batch.buy_price || 0)}</TableCell>
                        <TableCell>{formatCurrency(batch.market_price || 0)}</TableCell>
                        <TableCell>{formatDate(batch.expiration_date)}</TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {batch.warehouse_location || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/inventory_user/batches/edit?id=${batch.id}`}>
                              <Button variant="ghost" size="icon-sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDeleteClick(batch)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/inventory_user/batches/view?id=${batch.id}`}>
                            <Button variant="ghost" size="icon-sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })
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
              This will permanently delete the batch "{batchToDelete?.batch_number || batchToDelete?.product?.name}". 
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

