"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Calendar, TrendingUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { api as saleApi } from "@/lib/sale-api"
import { apiRequest } from "@/lib/api"

export default function ReportsPage() {
  const [reportType, setReportType] = useState("all")

  const [sales, setSales] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)

  // Build report list from fetched data
  const reports = [
    // Sales reports (one per recent sale)
    ...sales.slice(0, 6).map((s) => ({
      id: `sale-${s.id}`,
      name: `Sale ${s.invoice_number || s.id}`,
      type: "Sales",
      date: s.sale_date || s.created_at || "-",
      status: s.order_status === "reserved" ? "completed" : "processing",
      size: "-",
      saleObj: s,
    })),
    // Inventory valuation summary
    {
      id: "inventory-valuation",
      name: "Inventory Valuation",
      type: "Inventory",
      date: new Date().toISOString().split("T")[0],
      status: batches.length ? "completed" : "processing",
      size: "-",
    },
  ]

  const quickReports = [
    {
      title: "Sales Summary",
      description: "Daily, weekly, and monthly sales overview",
      icon: TrendingUp,
      type: "Sales",
    },
    {
      title: "Inventory Status",
      description: "Current stock levels and valuations",
      icon: FileText,
      type: "Inventory",
    },
    {
      title: "Customer Report",
      description: "Customer purchase history and trends",
      icon: FileText,
      type: "Customers",
    },
    {
      title: "Financial Statement",
      description: "Revenue, expenses, and profit analysis",
      icon: FileText,
      type: "Financial",
    },
  ]

  const filteredReports = reportType === "all" ? reports : reports.filter((r) => r.type === reportType)

  useEffect(() => {
    let mounted = true
    async function fetchData() {
      setLoading(true)
      try {
        const s = await saleApi.sales.getAll()
        const b = await apiRequest("/batches")
        if (!mounted) return
        setSales(Array.isArray(s) ? s : [])
        setBatches(Array.isArray(b) ? b : [])
      } catch (err) {
        console.error("Reports fetch error", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchData()
    return () => {
      mounted = false
    }
  }, [])

  async function handleDownloadSale(saleObj) {
    try {
      const res = await saleApi.sales.generateInvoice(saleObj.id)
      const invoice = res?.invoice || res
      const blob = new Blob([JSON.stringify(invoice, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${invoice.invoice_number || `sale-${saleObj.id}`}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Download invoice failed", err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Reports</h1>
          <p className="text-muted-foreground">Generate and download business reports</p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Generate New Report
        </Button>
      </div>

      {/* Quick Reports */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Reports</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickReports.map((report) => (
            <Card key={report.title} className="cursor-pointer transition-colors hover:bg-accent/50">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <report.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="mt-4 space-y-1">
                  <p className="font-medium">{report.title}</p>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                  <Button variant="ghost" size="sm" className="mt-2 h-8 px-2">
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Reports</CardTitle>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Inventory">Inventory</SelectItem>
                <SelectItem value="Customers">Customers</SelectItem>
                <SelectItem value="Financial">Financial</SelectItem>
                <SelectItem value="Suppliers">Suppliers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date Generated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{report.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{report.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {report.date}
                    </div>
                  </TableCell>
                  <TableCell>
                    {report.status === "completed" ? (
                      <Badge variant="secondary">Completed</Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                        Processing
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{report.size}</TableCell>
                  <TableCell className="text-right">
                    {report.status === "completed" && (
                      <Button variant="ghost" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Weekly Sales Summary", frequency: "Every Monday at 9:00 AM", nextRun: "2024-02-05" },
              { name: "Monthly Inventory Report", frequency: "1st of every month", nextRun: "2024-02-01" },
              { name: "Quarterly Financial Report", frequency: "Every 3 months", nextRun: "2024-04-01" },
            ].map((schedule, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-1">
                  <p className="font-medium">{schedule.name}</p>
                  <p className="text-sm text-muted-foreground">{schedule.frequency}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Next Run</p>
                  <p className="text-sm text-muted-foreground">{schedule.nextRun}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
