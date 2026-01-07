"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { api as batchApi } from "@/lib/inventory-api/batch-api"
import { api as stockAdjustmentApi } from "@/lib/inventory-api/stock-adjustment-api"

interface Batch {
  batch_id: number
  supplier_id: number
  invoice_no: string
  purchase_date: string
  supplier?: {
    supplier_id: number
    name: string
  }
}

export default function NewStockAdjustmentPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    batch_id: "",
    product_id: "",
    quantity: "",
    reference: "",
    note: "",
  })

  const [batches, setBatches] = useState<Batch[]>([])
  const [batchItems, setBatchItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingBatches, setLoadingBatches] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoadingBatches(true)
        const data = await batchApi.batches.getAll()
        const mapped = Array.isArray(data)
          ? data.map((b: any) => ({
              batch_id: b.batch_id || b.id,
              supplier_id: b.supplier_id,
              invoice_no: b.invoice_no || "",
              purchase_date: b.purchase_date || "",
              supplier: b.supplier || null,
            }))
          : []
        setBatches(mapped)
      } catch (err) {
        console.error("Error fetching batches for stock adjustments:", err)
      } finally {
        setLoadingBatches(false)
      }
    }

    fetchBatches()
  }, [])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBatchChange = async (value: string) => {
    handleChange("batch_id", value)
    setFormData((prev) => ({ ...prev, product_id: "" }))
    if (!value) return
    try {
      const data = await batchApi.batches.getById(Number(value))
      const items = Array.isArray(data.items) ? data.items : data.items ? [data.items] : []
      setBatchItems(items)
      if (items.length > 0) {
        setFormData((prev) => ({ ...prev, product_id: String(items[0].product_id || items[0].product?.id) }))
      }
    } catch (err) {
      console.error("Failed to load batch items", err)
      setBatchItems([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.batch_id) {
      setError("Batch is required")
      return
    }

    if (!formData.quantity || Number(formData.quantity) === 0) {
      setError("Quantity is required and cannot be 0 (use positive or negative number)")
      return
    }

    if (!formData.product_id) {
      setError("Product (from selected batch) is required")
      return
    }

    const payload = {
      batch_id: Number(formData.batch_id),
      product_id: Number(formData.product_id),
      quantity: Number(formData.quantity),
      reference: formData.reference.trim() || null,
      note: formData.note.trim() || null,
    }

    try {
      setLoading(true)
      await stockAdjustmentApi.adjustments.create(payload)
      router.push("/inventory_user/stock-adjustments")
    } catch (err: any) {
      console.error("Error creating stock adjustment:", err)
      if (err?.data?.errors) {
        const messages = Object.values(err.data.errors as any).flat()
        setError(String(messages.join(", ")))
      } else {
        setError(err?.message || "Failed to create stock adjustment. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory_user/stock-adjustments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-balance">New Stock Adjustment</h1>
          <p className="text-muted-foreground">
            Record a manual stock adjustment for a batch (positive or negative quantity).
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Adjustment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Batch *</Label>
                  <Select
                    value={formData.batch_id}
                    onValueChange={(value) => handleBatchChange(value)}
                    disabled={loadingBatches}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={loadingBatches ? "Loading batches..." : "Select batch"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((b) => (
                        <SelectItem key={b.batch_id} value={b.batch_id.toString()}>
                          {b.invoice_no || `Batch #${b.batch_id}`} –{" "}
                          {b.supplier?.name || "Unknown supplier"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                  {batchItems.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <Label>Product in Batch *</Label>
                      <Select value={formData.product_id} onValueChange={(v) => handleChange("product_id", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {batchItems.map((it: any) => (
                            <SelectItem key={it.batch_item_id || it.id} value={String(it.product_id || it.product?.id)}>
                              {it.product?.name || `Product ${it.product_id || it.product?.id}`} – {it.quantity} available
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity (use negative to reduce) *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleChange("quantity", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference</Label>
                    <Input
                      id="reference"
                      placeholder="e.g. Inventory count adjustment"
                      value={formData.reference}
                      onChange={(e) => handleChange("reference", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Note</Label>
                  <Textarea
                    id="note"
                    placeholder="Additional details about this adjustment"
                    rows={4}
                    value={formData.note}
                    onChange={(e) => handleChange("note", e.target.value)}
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
                      Save Adjustment
                    </>
                  )}
                </Button>
                <Link href="/inventory_user/stock-adjustments" className="block">
                  <Button type="button" variant="outline" className="w-full bg-transparent">
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
