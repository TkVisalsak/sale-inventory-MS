"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Loader2, MoveRight, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api as stockApi } from "@/lib/inventory-api/stock-adjustment-api"

interface StockMovement {
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
    supplier?: { supplier_id: number; name: string } | null
  } | null
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        if (searchQuery) params.set("q", searchQuery)
        if (typeFilter) params.set("type", typeFilter)
        if (fromDate) params.set("from", fromDate)
        if (toDate) params.set("to", toDate)

        const data = await stockApi.adjustments.getAll(params.toString())
        setMovements(Array.isArray(data) ? data : [])
      } catch (err: any) {
        console.error("Error fetching stock movements:", err)
        setError(err.message || err.data?.message || "Failed to load stock movements")
      } finally {
        setLoading(false)
      }
    }

    const t = setTimeout(() => fetchMovements(), 250)
    return () => clearTimeout(t)
  }, [searchQuery, typeFilter, fromDate, toDate])

  const filtered = useMemo(() => movements, [movements])

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString() : "-")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Stock Movements</h1>
          <p className="text-muted-foreground">In / Out movements and manual adjustments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/inventory_user/stock-adjustments/add">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Adjustment
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>All Movements</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by invoice, supplier, reference..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-md border px-3 py-1 text-sm"
                title="Type"
              >
                <option value="">All types</option>
                <option value="in">In</option>
                <option value="out">Out</option>
                <option value="adjust">Adjust</option>
              </select>

              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-md border px-2 py-1 text-sm" />
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-md border px-2 py-1 text-sm" />

              <Button variant="ghost" onClick={() => { setSearchQuery(""); setTypeFilter(""); setFromDate(""); setToDate(""); }}>
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No movements found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Batch / Invoice</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{formatDate(m.movement_date)}</TableCell>
                    <TableCell className="font-mono text-sm">{m.batch?.invoice_no || (m.batch_id ? `Batch #${m.batch_id}` : "-")}</TableCell>
                    <TableCell>{m.batch?.supplier?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={m.movement_type === 'out' ? 'destructive' : 'secondary'}>{m.movement_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.quantity >= 0 ? 'secondary' : 'destructive'}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={m.reference || ""}>{m.reference || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate" title={m.note || ""}>{m.note || "-"}</TableCell>
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
