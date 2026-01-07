"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Boxes, Loader2, Eye, X, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { api as batchApi } from "@/lib/inventory-api/batch-api"
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

interface BatchItem {
  batch_item_id: number
  product_id: number
  quantity: number
  unit_cost: number
  expiry_date?: string
  product?: {
    id: number
    name: string
  }
}

interface Batch {
  batch_id: number
  supplier_id: number
  invoice_no: string
  purchase_date: string
  total_cost: number
  status: string
  supplier?: {
    supplier_id: number
    name: string
  }
  items?: BatchItem[]
}

interface Supplier {
  id: number
  name: string
}

export default function BatchesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all")
  const [batches, setBatches] = useState<Batch[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [expandedBatches, setExpandedBatches] = useState<Set<number>>(new Set())

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setLoadingFilters(true)
        setError(null)

        // Fetch batches and suppliers in parallel
        const [batchesData, suppliersData] = await Promise.all([
          batchApi.batches.getAll(),
          supplierApi.suppliers.getAll(),
        ])

        // Map batches
        const mappedBatches = Array.isArray(batchesData) ? batchesData.map((batch: any) => ({
          batch_id: batch.batch_id || batch.id,
          supplier_id: batch.supplier_id,
          invoice_no: batch.invoice_no || "",
          purchase_date: batch.purchase_date || "",
          total_cost: batch.total_cost || 0,
          status: batch.status || "draft",
          supplier: batch.supplier || null,
          items: batch.items || [],
        })) : []
        setBatches(mappedBatches)

        // Map suppliers
        const mappedSuppliers = Array.isArray(suppliersData) 
          ? suppliersData.map((s: any) => ({
              id: s.supplier_id || s.id,
              name: s.name || s.supplier_name || "",
            }))
          : []
        setSuppliers(mappedSuppliers)
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
      batch.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase())

    // Supplier filter
    const matchesSupplier =
      selectedSupplier === "all" || batch.supplier_id === Number(selectedSupplier)

    return matchesSearch && matchesSupplier
  })

  const hasActiveFilters = selectedSupplier !== "all"

  const clearFilters = () => {
    setSelectedSupplier("all")
  }

  const handleDeleteClick = (batch: Batch) => {
    setBatchToDelete(batch)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!batchToDelete) return

    try {
      setDeleting(true)
      await batchApi.batches.delete(batchToDelete.batch_id.toString())
      // Remove the batch from the list
      setBatches(batches.filter((b) => b.batch_id !== batchToDelete.batch_id))
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

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "secondary" as const
      case "received":
        return "default" as const
      case "draft":
      default:
        return "outline" as const
    }
  }

  const toggleBatchExpansion = (batchId: number) => {
    const newExpanded = new Set(expandedBatches)
    if (newExpanded.has(batchId)) {
      newExpanded.delete(batchId)
    } else {
      newExpanded.add(batchId)
    }
    setExpandedBatches(newExpanded)
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
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchQuery || hasActiveFilters
                        ? "No batches found matching your filters."
                        : "No batches found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map((batch) => {
                    const isExpanded = expandedBatches.has(batch.batch_id)
                    const itemsCount = batch.items?.length || 0
                    return (
                      <>
                        <TableRow key={batch.batch_id}>
                          <TableCell>
                            {itemsCount > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleBatchExpansion(batch.batch_id)}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm font-medium">
                            {batch.invoice_no || "N/A"}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{batch.supplier?.name || "N/A"}</span>
                          </TableCell>
                          <TableCell>{formatDate(batch.purchase_date)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(batch.total_cost)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{itemsCount} item{itemsCount !== 1 ? "s" : ""}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(batch.status)}>
                              {batch.status || "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Link href={`/inventory_user/batches/edit?id=${batch.batch_id}`}>
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
                        </TableRow>
                        {isExpanded && itemsCount > 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-muted/50">
                              <div className="py-4">
                                <h4 className="font-semibold mb-3">Batch Items</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Product</TableHead>
                                      <TableHead>Quantity</TableHead>
                                      <TableHead>Unit Cost</TableHead>
                                      <TableHead>Subtotal</TableHead>
                                      <TableHead>Expiry Date</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {batch.items?.map((item) => (
                                      <TableRow key={item.batch_item_id}>
                                        <TableCell>
                                          <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                              <Boxes className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="font-medium">{item.product?.name || "N/A"}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline">{item.quantity}</Badge>
                                        </TableCell>
                                        <TableCell>{formatCurrency(item.unit_cost)}</TableCell>
                                        <TableCell className="font-medium">
                                          {formatCurrency(item.quantity * item.unit_cost)}
                                        </TableCell>
                                        <TableCell>{formatDate(item.expiry_date)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
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
              This will permanently delete the batch with invoice number "{batchToDelete?.invoice_no}". 
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
