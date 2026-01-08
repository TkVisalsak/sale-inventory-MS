"use client"

import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { api as categoryApi } from "@/lib/inventory-api/category-api"
import { api as supplierApi } from "@/lib/inventory-api/supplier-api"
import { api as productApi } from "@/lib/inventory-api/product-api"

export default function StockReportPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [categories, setCategories] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  const [filters, setFilters] = useState({
    category_id: '',
    supplier_id: '',
    product_id: '',
    from: '',
    to: '',
  })

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [cats, sups, prods] = await Promise.all([
          categoryApi.categories.getAll(),
          supplierApi.suppliers.getAll(),
          productApi.products.getAll(),
        ])
        setCategories(Array.isArray(cats) ? cats : [])
        setSuppliers(Array.isArray(sups) ? sups : [])
        setProducts(Array.isArray(prods) ? prods : [])
      } catch (e) {
        console.error('Failed to load report metadata', e)
      }
    }

    loadMeta()
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async (opts: any = {}) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      const qs = { ...filters, ...opts }
      Object.entries(qs).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).trim() !== '') params.set(k, String(v))
      })
      const url = '/reports/stock' + (Array.from(params).length ? '?' + params.toString() : '')
      const res = await apiRequest(url)
      setData(Array.isArray(res) ? res : [])
      setError(null)
    } catch (e: any) {
      console.error('Failed to load stock report', e)
      setError(e?.message || 'Failed to load stock report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Stock Report</h1>
          <p className="text-muted-foreground">Current stock by product and batch</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <Select value={filters.category_id} onValueChange={(v) => setFilters((p) => ({ ...p, category_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.supplier_id} onValueChange={(v) => setFilters((p) => ({ ...p, supplier_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Suppliers</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.product_id} onValueChange={(v) => setFilters((p) => ({ ...p, product_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Products</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="date" value={filters.from} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))} />
            <Input type="date" value={filters.to} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))} />

            <Button onClick={() => fetchData()}>Filter</Button>
            <Button variant="outline" onClick={() => exportCsv(data)}>Export CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
        <CardHeader>
          <CardTitle>Stock</CardTitle>
        </CardHeader>
        
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-destructive">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Total Qty</TableHead>
                  <TableHead>Batch Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((p) => (
                  <TableRow key={p.product_id}>
                    <TableCell>
                      <div className="font-medium">{p.product_name}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{p.barcode || 'N/A'}</TableCell>
                    <TableCell>{p.unit || 'N/A'}</TableCell>
                    <TableCell>{p.total_quantity}</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {p.batches && p.batches.length > 0 ? (
                          <ul>
                            {p.batches.map((b: any) => (
                              <li key={b.batch_item_id}>
                                Batch {b.batch_id} — {b.quantity} @ ${Number(b.unit_cost).toFixed(2)} ({b.purchase_date})
                              </li>
                            ))}
                          </ul>
                        ) : (
                          '—'
                        )}
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

function exportCsv(data: any[]) {
  if (!data || data.length === 0) return

  const rows: string[] = []
  // header
  rows.push(['product_id', 'product_name', 'barcode', 'unit', 'total_quantity', 'batch_id', 'batch_item_id', 'purchase_date', 'batch_quantity', 'unit_cost'].join(','))

  data.forEach((p) => {
    (p.batches || []).forEach((b: any) => {
      rows.push([
        p.product_id,
        `"${(p.product_name || '').replace(/"/g, '""') }"`,
        p.barcode || '',
        p.unit || '',
        p.total_quantity,
        b.batch_id,
        b.batch_item_id,
        b.purchase_date,
        b.quantity,
        Number(b.unit_cost).toFixed(2),
      ].join(','))
    })
  })

  const csv = rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `stock-report_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
