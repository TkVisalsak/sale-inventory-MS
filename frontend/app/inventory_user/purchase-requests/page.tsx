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
import { api as purchaseRequestApi } from "@/lib/inventory-api/purchase-request-api"

interface PurchaseRequest {
  id: number
  pr_number: string
  requested_by: number
  status: string
  note?: string | null
  created_at?: string
  items?: any[]
  requester?: {
    id: number
    name?: string
    email?: string
  } | null
}

export default function PurchaseRequestsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await purchaseRequestApi.purchaseRequests.getAll()
        const mapped = Array.isArray(data)
          ? data.map((pr: any) => ({
              id: pr.id,
              pr_number: pr.pr_number,
              requested_by: pr.requested_by,
              status: pr.status,
              note: pr.note ?? null,
              created_at: pr.created_at,
              items: pr.items ?? [],
              requester: pr.requester ?? null,
            }))
          : []
        setRequests(mapped)
      } catch (err: any) {
        console.error("Error fetching purchase requests:", err)
        setError(err.message || "Failed to load purchase requests")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredRequests = requests.filter((pr) => {
    const q = searchQuery.toLowerCase()
    return (
      pr.pr_number?.toLowerCase().includes(q) ||
      pr.requester?.name?.toLowerCase().includes(q) ||
      pr.status?.toLowerCase().includes(q)
    )
  })

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "secondary" as const
      case "submitted":
        return "default" as const
      case "rejected":
        return "destructive" as const
      case "draft":
      default:
        return "outline" as const
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Purchase Requests</h1>
          <p className="text-muted-foreground">Track purchase requests created by users.</p>
        </div>
        <Link href="/inventory_user/purchase-requests/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Purchase Request
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>All Purchase Requests</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by PR number, requester, status..."
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
                  <TableHead>PR Number</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery
                        ? "No purchase requests found matching your search."
                        : "No purchase requests found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((pr) => {
                    const itemsCount = pr.items?.length || 0
                    return (
                      <TableRow key={pr.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {pr.pr_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {pr.requester?.name || `User #${pr.requested_by}`}
                            </span>
                            {pr.requester?.email && (
                              <span className="text-xs text-muted-foreground">
                                {pr.requester.email}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {itemsCount} item{itemsCount !== 1 ? "s" : ""}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(pr.status)}>
                            {pr.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(pr.created_at)}</TableCell>
                        <TableCell className="max-w-xs truncate" title={pr.note || ""}>
                          {pr.note || "-"}
                        </TableCell>
                        <TableCell>
                          <Link href={`/inventory_user/purchase-requests/view?id=${pr.id}`}>
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

