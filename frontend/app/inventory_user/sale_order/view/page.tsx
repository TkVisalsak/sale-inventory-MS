"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2 } from "lucide-react"
import { api as saleApi } from "@/lib/sale-api"
import { useToast } from "@/hooks/use-toast"

interface SaleItemRow {
  id: number
  product?: { id?: number; name?: string } | null
  batch_id?: number | null
  quantity: number
  unit_price: number
  discount?: number
}

interface SaleRow {
  id: number
  invoice_number: string
  user?: { id?: number; name?: string } | null
  customer?: { id?: number; name?: string } | null
  order_status?: string
  note?: string | null
  created_at?: string
  items: SaleItemRow[]
  reservations?: any[]
}

export default function ViewSalePage() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [sale, setSale] = useState<SaleRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const toast = useToast()

  useEffect(() => {
    const fetchSale = async () => {
      if (!id) {
        setError("Sale ID is required")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await saleApi.sales.getById(id)
        setSale(data as SaleRow)
      } catch (err: any) {
        console.error("Error loading sale:", err)
        setError(err.message || "Failed to load sale")
      } finally {
        setLoading(false)
      }
    }

    fetchSale()
  }, [id])

  const formatDate = (dateString?: string) => (dateString ? new Date(dateString).toLocaleDateString() : "N/A")

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/inventory_user/sale_order">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-balance">View Sale</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/inventory_user/sale_order">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-balance">View Sale</h1>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error || "Sale not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const total = sale.items.reduce((sum, item) => sum + (item.quantity * item.unit_price - (item.discount || 0)), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory_user/sale_order">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-balance">Sale {sale.invoice_number}</h1>
          <p className="text-muted-foreground">
            Created by {sale.user?.name || `User #${sale.user?.id ?? "-"}`} on {formatDate(sale.created_at)}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Inventory user actions: Accept, Reject, Stock Reserve */}
          {(sale.order_status && !['draft', 'reserved', 'rejected'].includes(sale.order_status.toLowerCase())) && (
            <>
              <Button variant="secondary" onClick={async ()=>{
                if (!confirm('Mark order as accepted?')) return
                const t = toast.toast({ title: 'Accepting order...' })
                try {
                  await saleApi.sales.update(String(sale.id), { order_status: 'accepted' })
                  toast.update(t.id, { title: 'Order accepted' })
                  setSale({ ...(sale as SaleRow), order_status: 'accepted' })
                } catch (err:any) {
                  toast.update(t.id, { title: 'Accept failed', description: err?.message || 'Failed to accept' })
                }
              }}>Accept</Button>

              <Button variant="destructive" onClick={async ()=>{
                if (!confirm('Reject this order?')) return
                const t = toast.toast({ title: 'Rejecting order...' })
                try {
                  await saleApi.sales.update(String(sale.id), { order_status: 'rejected' })
                  toast.update(t.id, { title: 'Order rejected' })
                  setSale({ ...(sale as SaleRow), order_status: 'rejected' })
                } catch (err:any) {
                  toast.update(t.id, { title: 'Reject failed', description: err?.message || 'Failed to reject' })
                }
              }}>Reject</Button>

              <Button variant="outline" onClick={async ()=>{
                if (!confirm('Reserve stock for this order? This will lock the order and deduct stock using FIFO.')) return
                const t = toast.toast({ title: 'Reserving stock...' })
                try {
                  let reservations = (sale as any).reservations || []
                  console.log('reservations for sale', reservations)

                  // If no reservations exist yet, call generateInvoice which will create pending reservations
                  if (reservations.length === 0) {
                    const g = await saleApi.sales.generateInvoice(String(sale.id))
                    console.log('generateInvoice response', g)
                    const refreshed = await saleApi.sales.getById(String(sale.id))
                    setSale(refreshed as SaleRow)
                    reservations = (refreshed as any).reservations || []
                    console.log('refreshed reservations', reservations)
                    if (reservations.length === 0) throw new Error('No reservations found for this order after generateInvoice')
                  }

                  // process reservations sequentially so backend can handle transactional deduction per-reservation
                  // guard against reservation objects missing an `id` (prevents PUT /stock-reservations/undefined)
                  let missingIdCount = 0
                  for (const r of reservations) {
                    if (!r || !r.id) {
                      console.error('Skipping reservation without id', r)
                      missingIdCount++
                      continue
                    }
                    // backend will perform FIFO batch deduction when reservation status becomes 'reserved'
                    await saleApi.stockReservations.update(String(r.id), { status: 'reserved' })
                  }

                  if (missingIdCount > 0) {
                    throw new Error(`${missingIdCount} reservation(s) were missing IDs and were skipped`)
                  }

                  toast.update(t.id, { title: 'Stock reserved' })
                  // refresh sale
                  const refreshed = await saleApi.sales.getById(String(sale.id))
                  setSale(refreshed as SaleRow)
                  // navigate back to inventory list after successful reservation
                  router.push('/inventory_user/sale_order')
                } catch (err:any) {
                  console.error('Reserve error', err)
                  toast.update(t.id, { title: 'Reserve failed', description: err?.message || 'Failed to reserve stock' })
                }
              }}>Stock Reserve</Button>
            </>
          )}

          <Button variant="ghost" onClick={async ()=>{
            const toast = useToast().toast({ title: 'Generating invoice...', description: 'Please wait' })
            try {
              const res = await saleApi.sales.generateInvoice(String(sale.id))
              useToast().update(toast.id, { title: 'Invoice generated', description: 'Invoice JSON returned' })
              console.log('invoice', res)
            } catch (err:any) {
              useToast().update(toast.id, { title: 'Invoice failed', description: err?.message || 'Failed to generate invoice' })
            }
          }}>
            Generate Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Sale Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Invoice</p>
                  <p className="font-mono text-sm">{sale.invoice_number}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Order Status</p>
                  <Badge>{sale.order_status}</Badge>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Customer</p>
                  <p className="font-medium">{sale.customer?.name || "Walk-in"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <p>{formatDate(sale.created_at)}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Note</p>
                <p>{sale.note || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              {sale.items.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No items found for this sale.</p>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.items.map((item) => {
                        const subtotal = item.quantity * item.unit_price - (item.discount || 0)
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{item.product?.name || `Product #${item.product?.id ?? "-"}`}</span>
                              </div>
                            </TableCell>
                            <TableCell>{item.batch_id ?? "-"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.quantity}</Badge>
                            </TableCell>
                            <TableCell>{item.unit_price > 0 ? formatCurrency(item.unit_price) : "-"}</TableCell>
                            <TableCell className="font-medium">{subtotal > 0 ? formatCurrency(subtotal) : "-"}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end pt-4 border-t">
                    <div className="text-lg font-semibold">Total: {formatCurrency(total)}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Items</span>
                <span className="font-medium">{sale.items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Grand Total</span>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
