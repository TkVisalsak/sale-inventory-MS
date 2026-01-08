"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Users } from "lucide-react"
import { api } from "@/lib/sale-api/customer-api"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Customer = {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  customer_type: string
  credit_limit: number
  is_active: boolean
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.customers.getAll()
        setCustomers(data || [])
      } catch (err: any) {
        console.error("Error fetching customers:", err)
        setError(err.message || err.data?.message || "Failed to load customers")
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer?")) return
    try {
      setDeletingId(id)
      await api.customers.delete(id)
      setCustomers((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      console.error("Error deleting customer:", err)
      alert(err.message || err.data?.message || "Failed to delete customer")
    } finally {
      setDeletingId(null)
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const q = searchQuery.toLowerCase()
    return (
      customer.name.toLowerCase().includes(q) ||
      (customer.email || "").toLowerCase().includes(q) ||
      (customer.phone || "").includes(searchQuery)
    )
  })

  const totalCustomers = customers.length
  const activeCustomers = customers.filter((c) => c.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Customers</h1>
          <p className="text-muted-foreground"></p>
        </div>
        <Link href="/sale_user/customer/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold">{totalCustomers}</p>
              <p className="text-xs text-muted-foreground">{activeCustomers} active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Customers</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading customers...</p>
          ) : filteredCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No customers found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-semibold text-primary">
                            {customer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="font-medium">{customer.name}</span>
                          {customer.address && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{customer.address}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{customer.email || "-"}</p>
                        <p className="text-xs text-muted-foreground">{customer.phone || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{customer.customer_type || "RETAIL"}</TableCell>
                    <TableCell className="text-sm">
                      {customer.credit_limit != null ? `Rs. ${Number(customer.credit_limit).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      {customer.is_active ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/sale_user/customer/edit?id=${customer.id}`}>
                          <Button variant="ghost" size="icon-sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(customer.id)}
                          disabled={deletingId === customer.id}
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
