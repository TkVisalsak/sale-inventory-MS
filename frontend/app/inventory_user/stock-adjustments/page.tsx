"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Loader2, Package, MoveHorizontal } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api as stockAdjustmentApi } from "@/lib/inventory-api/stock-adjustment-api"

interface StockAdjustment {
  id: number
  batch_id: number | null
  movement_type: string
  quantity: number
  reference?: string | null
  movement_date?: string
  note?: string | null
  batch?: {
    batch_id: number
    invoice_no?: string
    purchase_date?: string
    supplier?: {
      supplier_id: number
      name: string
    } | null
  } | null
}

export default function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAdjustments = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await stockAdjustmentApi.adjustments.getAll()
        setAdjustments(Array.isArray(data) ? data : [])
      } catch (err: any) {
        console.error("Error fetching stock adjustments:", err)
        setError(err.message || err.data?.message || "Failed to load stock adjustments")
      } finally {
        setLoading(false)
      }
    }

    fetchAdjustments()
  }, [])

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return adjustments.filter((a) => {
      const supplierName = a.batch?.supplier?.name?.toLowerCase() || ""
      const invoiceNo = a.batch?.invoice_no?.toLowerCase() || ""
      const note = a.note?.toLowerCase() || ""
      const ref = a.reference?.toLowerCase() || ""
      return (
        supplierName.includes(q) ||
        invoiceNo.includes(q) ||
        note.includes(q) ||
        ref.includes(q)
      )
    })
  }, [adjustments, searchQuery])

  const stats = useMemo(() => {
    const total = adjustments.length
    const positive = adjustments.filter((a) => a.quantity > 0).length
    const negative = adjustments.filter((a) => a.quantity < 0).length
    const net = adjustments.reduce((sum, a) => sum + a.quantity, 0)
    return { total, positive, negative, net }
  }, [adjustments])

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Stock Adjustments</h1>
          <p className="text-muted-foreground">
            Manual stock corrections recorded against batches.
          </p>
        </div>
        <Link href="/inventory_user/stock-adjustments/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Adjustment
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MoveHorizontal className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Total Adjustments</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Package className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Positive (Increase)</p>
              <p className="text-2xl font-bold">{stats.positive}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <Package className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Negative (Decrease)</p>
              <p className="text-2xl font-bold">{stats.negative}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <MoveHorizontal className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Net Quantity</p>
              <p className="text-2xl font-bold">{stats.net}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Stock Adjustments</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by supplier, invoice, note..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery
                ? "No stock adjustments found matching your search."
                : "No stock adjustments recorded yet."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Batch / Invoice</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{formatDate(a.movement_date)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {a.batch?.invoice_no || (a.batch_id ? `Batch #${a.batch_id}` : "-")}
                    </TableCell>
                    <TableCell>
                      {a.batch?.supplier?.name ? (
                        <Badge variant="outline">{a.batch.supplier.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.quantity >= 0 ? "secondary" : "destructive"}>
                        {a.quantity > 0 ? `+${a.quantity}` : a.quantity}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={a.reference || ""}>
                      {a.reference || "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={a.note || ""}>
                      {a.note || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
