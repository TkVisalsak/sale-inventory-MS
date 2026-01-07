"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Loader2, Eye } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PurchaseOrderItem {
  id: number
  product_id: number
  product?: { id: number; name?: string } | null
  quantity: number
  unit_price?: number | null
}

interface PurchaseOrder {
  id: number
  po_number?: string
  supplier?: { id: number; name?: string } | null
  items?: PurchaseOrderItem[]
  status?: string
  created_at?: string
}

export default function PurchaseOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch("/api/purchase-orders")
        if (res.status === 404) {
          setError("Purchase orders API not available (404). You can view Purchase Requests instead.")
          setOrders([])
          return
        }
        if (!res.ok) throw new Error(`Failed to load purchase orders: ${res.status}`)
        const data = await res.json()
        setOrders(Array.isArray(data) ? data : [])
      } catch (err: any) {
        console.error("Error fetching purchase orders:", err)
        setError(err.message || "Failed to load purchase orders")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, PurchaseOrder[]>()
    for (const o of orders) {
      const supplierName = o.supplier?.name || "Unknown Supplier"
      const arr = map.get(supplierName) || []
      arr.push(o)
      map.set(supplierName, arr)
    }
    return map
  }, [orders])

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return Array.from(grouped.entries()).filter(([name, orders]) => {
      if (!q) return true
      if (name.toLowerCase().includes(q)) return true
      return orders.some((o) => o.po_number?.toLowerCase().includes(q))
    })
  }, [grouped, searchQuery])

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Purchase Orders</h1>
          <p className="text-muted-foreground">Ordered items grouped by supplier (read-only).</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>Purchase Orders by Supplier</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by supplier or PO number..."
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
            <div className="space-y-6">
              {filteredSuppliers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No purchase orders found.</p>
              ) : (
                filteredSuppliers.map(([supplierName, supplierOrders]) => (
                  <Card key={supplierName}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{supplierName}</h3>
                          <p className="text-xs text-muted-foreground">{supplierOrders.length} order(s)</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>PO Number</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total Qty</TableHead>
                            <TableHead className="w-[160px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {supplierOrders.map((o) => {
                            const itemsCount = o.items?.length || 0
                            const totalQty = (o.items || []).reduce((s, it) => s + (it.quantity || 0), 0)
                            return (
                              <TableRow key={o.id}>
                                <TableCell className="font-mono text-sm">{o.po_number || `PO#${o.id}`}</TableCell>
                                <TableCell>{formatDate(o.created_at)}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{itemsCount} item{itemsCount !== 1 ? "s" : ""}</Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium">{totalQty}</span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2 justify-end">
                                    <Link href={`/inventory_user/purchase_orders/view?id=${o.id}`}>
                                      <Button variant="outline" size="sm">
                                        <Eye className="mr-2 h-4 w-4" />
                                        View
                                      </Button>
                                    </Link>
                                    <Link href={`/inventory_user/purchase_orders/view?id=${o.id}&action=receive`}>
                                      <Button size="sm">Receive</Button>
                                    </Link>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

