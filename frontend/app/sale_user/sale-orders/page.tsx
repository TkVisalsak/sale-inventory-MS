"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Loader2, Eye } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api as saleApi } from "@/lib/sale-api"

interface SaleRow {
  id: number
  invoice_number: string
  user?: { id?: number; name?: string } | null
  customer?: { id?: number; name?: string } | null
  order_status?: string
  created_at?: string
  items?: any[]
  note?: string | null
}

export default function SaleOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [rows, setRows] = useState<SaleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await saleApi.sales.getAll()
        const mapped = Array.isArray(data)
          ? data.map((s: any) => ({
              id: s.id,
              invoice_number: s.invoice_number,
              user: s.user ?? null,
              customer: s.customer ?? null,
              order_status: s.order_status ?? null,
              created_at: s.created_at ?? null,
              items: s.items ?? [],
              note: s.note ?? null,
            }))
          : []
        setRows(mapped)
      } catch (err: any) {
        console.error("Error fetching sales:", err)
        setError(err.message || "Failed to load sales")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filtered = rows.filter((r) => {
    const q = searchQuery.toLowerCase()
    return (
      r.invoice_number?.toLowerCase().includes(q) ||
      r.customer?.name?.toLowerCase().includes(q) ||
      r.user?.name?.toLowerCase().includes(q) ||
      r.order_status?.toLowerCase().includes(q)
    )
  })

  const formatDate = (dateString?: string) => (dateString ? new Date(dateString).toLocaleDateString() : "N/A")

  const getStatusVariant = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "reserved":
        return "secondary" as const
      case "pending_inventory":
        return "default" as const
      case "submitted":
        return "outline" as const
      case "draft":
      default:
        return "outline" as const
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Sale Orders</h1>
          <p className="text-muted-foreground"></p>
        </div>
        <Link href="/sale_user/sale-orders/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Draft order
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>All Sale Orders</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by invoice, customer, status..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "No sales found matching your search." : "No sales found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => {
                    const itemsCount = r.items?.length || 0
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {r.invoice_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{r.customer?.name || `User #${r.customer?.id ?? "-"}`}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{itemsCount} item{itemsCount !== 1 ? "s" : ""}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(r.order_status)}>{r.order_status}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(r.created_at)}</TableCell>
                        <TableCell className="max-w-xs truncate" title={r.note || ""}>{r.note || "-"}</TableCell>
                        <TableCell>
                          <Link href={`/sale_user/sale-orders/view?id=${r.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-2 h-4 w-4" />
                              View
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
    </div>
  )
}

