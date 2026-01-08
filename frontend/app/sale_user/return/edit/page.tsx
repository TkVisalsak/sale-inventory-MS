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
import { api as returnsApi } from "@/lib/inventory-api/return-api"
import { api as customersApi } from "@/lib/inventory-api/customer-api"
import { api as productsApi } from "@/lib/inventory-api/product-api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Customer = {
  id: number
  name: string
}

type Product = {
  id: number
  name: string
}

export default function EditReturnPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnId = searchParams.get("id")
  
  const [formData, setFormData] = useState({
    return_date: "",
    customer_id: "",
    product_id: "",
    quantity: 1,
    reason: "",
    refund_amount: "",
    status: "Pending",
  })
  const [loading, setLoading] = useState(false)
  const [loadingReturn, setLoadingReturn] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (!returnId) {
        setError("Return ID is required")
        setLoadingReturn(false)
        return
      }

      try {
        setLoadingReturn(true)
        setError(null)

        const [returnData, customerData, productData] = await Promise.all([
          returnsApi.returns.getById(returnId),
          customersApi.customers.getAll(),
          productsApi.products.getAll(),
        ])

        setFormData({
          return_date: returnData.return_date || "",
          customer_id: returnData.customer_id ? String(returnData.customer_id) : "",
          product_id: returnData.product_id ? String(returnData.product_id) : "",
          quantity: returnData.quantity || 1,
          reason: returnData.reason || "",
          refund_amount: returnData.refund_amount != null ? String(returnData.refund_amount) : "",
          status: returnData.status || "Pending",
        })

        setCustomers(Array.isArray(customerData) ? customerData : [])
        setProducts(Array.isArray(productData) ? productData : [])
      } catch (err: any) {
        console.error("Error fetching return:", err)
        setError(err.message || "Failed to load return")
      } finally {
        setLoadingReturn(false)
      }
    }

    fetchData()
  }, [returnId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload = {
        return_date: formData.return_date || undefined,
        customer_id: formData.customer_id ? Number(formData.customer_id) : null,
        product_id: formData.product_id ? Number(formData.product_id) : null,
        quantity: Number(formData.quantity) || 1,
        reason: formData.reason.trim() || null,
        refund_amount: formData.refund_amount ? parseFloat(formData.refund_amount) : null,
        status: formData.status || "Pending",
      }

      if (!payload.product_id || !payload.quantity) {
        setError("Product and quantity are required")
        setLoading(false)
        return
      }

      await returnsApi.returns.update(returnId!, payload)
      router.push("/sale_user/return")
    } catch (err: any) {
      console.error("Error updating return:", err)
      
      // Handle validation errors
      if (err.data?.errors) {
        const errorMessages = Object.values(err.data.errors).flat()
        setError(errorMessages.join(", ") || "Validation failed")
      } else {
        setError(err.message || err.data?.message || "Failed to update return. Please try again.")
      }
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (loadingReturn) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/sale_user/return">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-balance">Edit Return</h1>
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
        <Link href="/sale_user/return">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-balance">Edit Return</h1>
          <p className="text-muted-foreground">Update return information</p>
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
                <CardTitle>Return Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="return_date">Return Date</Label>
                  <Input
                    id="return_date"
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => handleChange("return_date", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => handleChange("customer_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Product *</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => handleChange("product_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      value={formData.quantity}
                      onChange={(e) => handleChange("quantity", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refund_amount">Refund Amount</Label>
                    <Input
                      id="refund_amount"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={formData.refund_amount}
                      onChange={(e) => handleChange("refund_amount", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Reason for return"
                    rows={4}
                    value={formData.reason}
                    onChange={(e) => handleChange("reason", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    placeholder="Pending, Approved, Rejected..."
                    value={formData.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                  />
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
                <Link href="/sale_user/return" className="block">
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

