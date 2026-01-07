"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiRequest } from "@/lib/api"

export default function InventoryAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({ sales: null, revenue: null, customers: null, products: null })

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [sales, revenue, customers, products] = await Promise.all([
          apiRequest("/analytics/sales").catch(() => null),
          apiRequest("/analytics/revenue").catch(() => null),
          apiRequest("/analytics/customers").catch(() => null),
          apiRequest("/analytics/products").catch(() => null),
        ])

        if (!mounted) return
        setAnalytics({ sales, revenue, customers, products })
      } catch (err) {
        console.error("analytics load", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const salesCount = analytics.sales?.total ?? analytics.sales?.count ?? (Array.isArray(analytics.sales) ? analytics.sales.length : "-")
  const revenueVal = analytics.revenue?.total ?? analytics.revenue?.revenue ?? analytics.revenue ?? "-"
  const customersCount = analytics.customers?.total ?? analytics.customers?.count ?? (Array.isArray(analytics.customers) ? analytics.customers.length : "-")

  const topProducts = analytics.products?.top || (Array.isArray(analytics.products) ? analytics.products : [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Live analytics from the backend</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{loading ? "…" : salesCount}</div>
            <div className="text-sm text-muted-foreground">Total sales</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{loading ? "…" : revenueVal}</div>
            <div className="text-sm text-muted-foreground">Period revenue</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{loading ? "…" : customersCount}</div>
            <div className="text-sm text-muted-foreground">Active customers</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(topProducts.length === 0 || loading) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    {loading ? "Loading…" : "No data"}
                  </TableCell>
                </TableRow>
              )}
              {topProducts.map((p, i) => (
                <TableRow key={p.id || i}>
                  <TableCell>{p.name || p.product_name || p.product?.name || "-"}</TableCell>
                  <TableCell>{p.sold ?? p.quantity ?? "-"}</TableCell>
                  <TableCell>{p.value ?? p.revenue ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

