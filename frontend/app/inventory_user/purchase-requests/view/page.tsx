"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2 } from "lucide-react"
import { api as purchaseRequestApi } from "@/lib/inventory-api/purchase-request-api"

interface PurchaseRequestItem {
  id: number
  product_id: number
  requested_qty: number
  estimated_price: number | null
  product?: {
    id: number
    name: string
  } | null
  supplier?: {
    id: number
    name: string
  } | null
}

interface PurchaseRequest {
  id: number
  pr_number: string
  requested_by: number
  status: string
  note?: string | null
  created_at?: string
  items: PurchaseRequestItem[]
  requester?: {
    id: number
    name?: string
    email?: string
  } | null
}

export default function ViewPurchaseRequestPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [request, setRequest] = useState<PurchaseRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) {
        setError("Purchase request ID is required")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await purchaseRequestApi.purchaseRequests.getById(id)
        setRequest(data as PurchaseRequest)
      } catch (err: any) {
        console.error("Error loading purchase request:", err)
        setError(err.message || "Failed to load purchase request")
      } finally {
        setLoading(false)
      }
    }

    fetchRequest()
  }, [id])

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/inventory_user/purchase-requests">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-balance">View Purchase Request</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/inventory_user/purchase-requests">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-balance">View Purchase Request</h1>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error || "Purchase request not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const totalEstimated = request.items.reduce((sum, item) => {
    const price = item.estimated_price ?? 0
    return sum + item.requested_qty * price
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory_user/purchase-requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-balance">Purchase Request {request.pr_number}</h1>
          <p className="text-muted-foreground">
            Requested by {request.requester?.name || `User #${request.requested_by}`} on{" "}
            {formatDate(request.created_at)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">PR Number</p>
                  <p className="font-mono text-sm">{request.pr_number}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge>{request.status}</Badge>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Requested By</p>
                  <p className="font-medium">
                    {request.requester?.name || `User #${request.requested_by}`}
                  </p>
                  {request.requester?.email && (
                    <p className="text-xs text-muted-foreground">{request.requester.email}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <p>{formatDate(request.created_at)}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Note</p>
                <p>{request.note || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requested Items</CardTitle>
            </CardHeader>
            <CardContent>
              {request.items.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">
                  No items found for this purchase request.
                </p>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Requested Qty</TableHead>
                        <TableHead>Estimated Price</TableHead>
                        <TableHead>Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {request.items.map((item) => {
                        const price = item.estimated_price ?? 0
                        const subtotal = item.requested_qty * price
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {item.product?.name || `Product #${item.product_id}`}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.supplier?.name || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.requested_qty}</Badge>
                            </TableCell>
                            <TableCell>
                              {price > 0 ? formatCurrency(price) : "-"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {subtotal > 0 ? formatCurrency(subtotal) : "-"}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end pt-4 border-t">
                    <div className="text-lg font-semibold">
                      Total Estimated: {formatCurrency(totalEstimated)}
                    </div>
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
                <span className="font-medium">{request.items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Estimated</span>
                <span className="font-semibold">{formatCurrency(totalEstimated)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
