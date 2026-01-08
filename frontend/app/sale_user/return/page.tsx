"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Loader2, Eye, RotateCcw, DollarSign, AlertTriangle } from "lucide-react"
import { api as returnsApi } from "@/lib/sale-api/return-api"
import { Alert, AlertDescription } from "@/components/ui/alert"

type ReturnRecord = {
  id: number
  return_date: string
  customer_id: number | null
  product_id: number | null
  quantity: number
  reason: string | null
  refund_amount: number | null
  status: string
  customer?: {
    id: number
    name: string
  } | null
  product?: {
    id: number
    name: string
  } | null
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRecord[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await returnsApi.returns.getAll()
        setReturns(Array.isArray(data) ? data : [])
      } catch (err: any) {
        console.error("Error fetching returns:", err)
        setError(err.message || err.data?.message || "Failed to load returns")
      } finally {
        setLoading(false)
      }
    }

    fetchReturns()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this return record?")) return
    try {
      setDeletingId(id)
      await returnsApi.returns.delete(id)
      setReturns((prev) => prev.filter((r) => r.id !== id))
    } catch (err: any) {
      console.error("Error deleting return:", err)
      alert(err.message || err.data?.message || "Failed to delete return")
    } finally {
      setDeletingId(null)
    }
  }

  const filteredReturns = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return returns.filter((r) => {
      const customerName = r.customer?.name?.toLowerCase() || ""
      const productName = r.product?.name?.toLowerCase() || ""
      const reason = (r.reason || "").toLowerCase()
      return (
        customerName.includes(q) ||
        productName.includes(q) ||
        reason.includes(q) ||
        r.status.toLowerCase().includes(q)
      )
    })
  }, [returns, searchQuery])

  const stats = useMemo(() => {
    const total = returns.length
    const pending = returns.filter((r) => r.status?.toLowerCase() === "pending").length
    const approved = returns.filter((r) => r.status?.toLowerCase() === "approved").length
    const totalRefund = returns.reduce((sum, r) => sum + (Number(r.refund_amount) || 0), 0)
    return { total, pending, approved, totalRefund }
  }, [returns])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Returns</h1>
          <p className="text-muted-foreground">Manage product returns and refunds</p>
        </div>
        <Link href="/sale_user/return/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Return
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <RotateCcw className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Total Returns</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <RotateCcw className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Total Refund</p>
              <p className="text-2xl font-bold">Rs. {stats.totalRefund.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Returns</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by customer, product or status..."
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
          ) : filteredReturns.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery ? "No returns found matching your search." : "No returns recorded yet."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Refund</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.return_date}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{r.customer?.name || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{r.product?.name || "-"}</p>
                    </TableCell>
                    <TableCell>{r.quantity}</TableCell>
                    <TableCell>
                      {r.refund_amount != null ? `Rs. ${Number(r.refund_amount).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status?.toLowerCase() === "approved"
                            ? "secondary"
                            : r.status?.toLowerCase() === "pending"
                            ? "outline"
                            : "outline"
                        }
                      >
                        {r.status || "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/sale_user/return/view?id=${r.id}`}>
                          <Button variant="ghost" size="icon-sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/sale_user/return/edit?id=${r.id}`}>
                          <Button variant="ghost" size="icon-sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
