"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api as saleApi } from "@/lib/sale-api"

export default function SaleHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await saleApi.sales.getAll()
        setSales(Array.isArray(data) ? data : [])
      } catch (e: any) {
        console.error(e)
        setError(e?.message || "Failed to load sales")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const renderOrderBadge = (status?: string) => {
    switch (status) {
      case 'draft': return <Badge variant="outline">Draft</Badge>
      case 'pending_inventory': return <Badge variant="secondary">Pending Inventory</Badge>
      case 'submitted': return <Badge variant="accent">Submitted</Badge>
      case 'completed': return <Badge variant="success">Completed</Badge>
      default: return <Badge variant="outline">{status || 'N/A'}</Badge>
    }
  }

  const renderPaymentBadge = (status?: string) => {
    switch (status) {
      case 'paid': return <Badge variant="success">Paid</Badge>
      case 'partial': return <Badge variant="warning">Partial</Badge>
      case 'unpaid': return <Badge variant="destructive">Unpaid</Badge>
      default: return <Badge variant="outline">{status || 'N/A'}</Badge>
    }
  }

  const filtered = sales.filter((s) => {
    // date filter
    if (startDate || endDate) {
      const sd = startDate ? new Date(startDate) : null
      const ed = endDate ? new Date(endDate) : null
      const saleDate = s.sale_date ? new Date(s.sale_date) : null
      if (sd && saleDate && saleDate < sd) return false
      if (ed && saleDate && saleDate > new Date(new Date(ed).setHours(23,59,59,999))) return false
    }

    // order status
    if (orderStatusFilter !== 'all' && s.order_status !== orderStatusFilter) return false

    // payment status
    if (paymentStatusFilter !== 'all' && s.payment_status !== paymentStatusFilter) return false

    // search by invoice or customer
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const invoiceMatch = (s.invoice_number || '').toLowerCase().includes(q)
      const customerMatch = (s.customer?.name || '').toLowerCase().includes(q)
      if (!invoiceMatch && !customerMatch) return false
    }

    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sale History</h1>
          <p className="text-muted-foreground">All invoices with order status and payment status</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Input type="date" value={startDate || ''} onChange={(e)=>setStartDate(e.target.value || null)} />
              <Input type="date" value={endDate || ''} onChange={(e)=>setEndDate(e.target.value || null)} />
              <Input placeholder="Search invoice or customer" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Order status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_inventory">Pending Inventory</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => { setStartDate(null); setEndDate(null); setOrderStatusFilter('all'); setPaymentStatusFilter('all'); setSearchQuery('') }}>Clear</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <CardTitle className="sr-only">Invoices</CardTitle>
          {error && <div className="text-red-600">{error}</div>}
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="animate-spin"/></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Sale Date</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Grand Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No invoices found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.invoice_number}</TableCell>
                      <TableCell>{s.customer?.name || 'Walk-in'}</TableCell>
                      <TableCell>{s.sale_date ? new Date(s.sale_date).toLocaleString() : 'N/A'}</TableCell>
                      <TableCell>{renderOrderBadge(s.order_status)}</TableCell>
                      <TableCell>{renderPaymentBadge(s.payment_status)}</TableCell>
                      <TableCell>{s.grand_total}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/sale_user/sales/view?id=${s.id}`}>
                            <Button variant="ghost" size="icon-sm"><Eye className="h-4 w-4"/></Button>
                          </Link>
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
    </div>
  )
}
