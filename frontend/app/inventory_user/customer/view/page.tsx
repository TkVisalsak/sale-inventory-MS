"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { api } from "@/lib/inventory-api/customer-api"
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
  created_at?: string
  updated_at?: string
}

export default function ViewCustomerPage() {
  const searchParams = useSearchParams()
  const customerId = searchParams.get("id")

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) {
        setError("Customer ID is required")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await api.customers.getById(customerId)
        setCustomer(data)
      } catch (err: any) {
        console.error("Error fetching customer:", err)
        setError(err.message || err.data?.message || "Failed to load customer")
      } finally {
        setLoading(false)
      }
    }

    fetchCustomer()
  }, [customerId])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory_user/customer">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-balance">Customer Details</h1>
          <p className="text-muted-foreground">View information from the customers table</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading customer...</p>
      ) : !customer ? (
        <p className="text-sm text-muted-foreground">Customer not found.</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{customer.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm">{customer.email || "-"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <p className="text-sm">{customer.phone || "-"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Customer Type</Label>
                <p className="text-sm">{customer.customer_type || "RETAIL"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Credit Limit</Label>
                <p className="text-sm">
                  {customer.credit_limit != null ? `Rs. ${Number(customer.credit_limit).toFixed(2)}` : "-"}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Address</Label>
                <p className="text-sm whitespace-pre-line">{customer.address || "-"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <p className="text-sm">{customer.is_active ? "Active" : "Inactive"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Created At</Label>
                <p className="text-sm">{customer.created_at || "-"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Updated At</Label>
                <p className="text-sm">{customer.updated_at || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
