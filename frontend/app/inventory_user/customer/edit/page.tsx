"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/inventory-api/customer-api"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function EditCustomerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerId = searchParams.get("id")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    customer_type: "RETAIL",
    credit_limit: "",
  })
  const [loading, setLoading] = useState(false)
  const [loadingCustomer, setLoadingCustomer] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) {
        setError("Customer ID is required")
        setLoadingCustomer(false)
        return
      }

      try {
        setLoadingCustomer(true)
        setError(null)
        const data = await api.customers.getById(customerId)
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          customer_type: data.customer_type || "RETAIL",
          credit_limit: data.credit_limit != null ? String(data.credit_limit) : "",
        })
      } catch (err: any) {
        console.error("Error fetching customer:", err)
        setError(err.message || "Failed to load customer")
      } finally {
        setLoadingCustomer(false)
      }
    }

    fetchCustomer()
  }, [customerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        customer_type: formData.customer_type || "RETAIL",
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : 0,
      }

      if (!payload.name) {
        setError("Customer name is required")
        setLoading(false)
        return
      }

      await api.customers.update(customerId!, payload)
      router.push("/inventory_user/customer")
    } catch (err: any) {
      console.error("Error updating customer:", err)

      if (err.data?.errors) {
        const errorMessages = Object.values(err.data.errors as Record<string, string[]>).flat()
        setError(errorMessages.join(", ") || "Validation failed")
      } else {
        setError(err.message || err.data?.message || "Failed to update customer. Please try again.")
      }
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (loadingCustomer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/inventory_user/customer">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-balance">Edit Customer</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory_user/customer">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-balance">Edit Customer</h1>
          <p className="text-muted-foreground">Update customer information</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Customer Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter customer name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="customer@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+94 7X XXX XXXX"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter customer address"
                    rows={4}
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customer_type">Customer Type</Label>
                    <Input
                      id="customer_type"
                      placeholder="RETAIL or WHOLESALE"
                      value={formData.customer_type}
                      onChange={(e) => handleChange("customer_type", (e.target.value || "").toUpperCase())}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credit_limit">Credit Limit</Label>
                    <Input
                      id="credit_limit"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.credit_limit}
                      onChange={(e) => handleChange("credit_limit", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardContent className="pt-6 space-y-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Link href="/inventory_user/customer" className="block">
                  <Button type="button" variant="outline" className="w-full bg-transparent" disabled={loading}>
                    Cancel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
