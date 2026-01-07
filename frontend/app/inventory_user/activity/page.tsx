"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, Search, Filter, Download, User, Package, ShoppingCart, Users, FileText } from "lucide-react"

// Mock activity data
const activities = [
  {
    id: 1,
    user: "John Admin",
    action: "Created new product",
    target: "Wireless Headphones",
    category: "inventory",
    timestamp: "2024-01-18 10:30:45",
    details: "Added product with SKU WH-001",
    ip: "192.168.1.100",
  },
  {
    id: 2,
    user: "Sarah Manager",
    action: "Updated customer record",
    target: "Alice Brown",
    category: "customers",
    timestamp: "2024-01-18 10:15:22",
    details: "Modified contact information",
    ip: "192.168.1.101",
  },
  {
    id: 3,
    user: "Mike Staff",
    action: "Processed sale",
    target: "Order #1234",
    category: "sales",
    timestamp: "2024-01-18 09:45:10",
    details: "Total amount: $234.50",
    ip: "192.168.1.102",
  },
  {
    id: 4,
    user: "Emily Sales",
    action: "Added new customer",
    target: "David Wilson",
    category: "customers",
    timestamp: "2024-01-18 09:30:55",
    details: "Created customer profile",
    ip: "192.168.1.103",
  },
  {
    id: 5,
    user: "John Admin",
    action: "Modified user permissions",
    target: "Mike Staff",
    category: "users",
    timestamp: "2024-01-18 08:20:33",
    details: "Updated role to Manager",
    ip: "192.168.1.100",
  },
  {
    id: 6,
    user: "Sarah Manager",
    action: "Generated report",
    target: "Monthly Sales Report",
    category: "reports",
    timestamp: "2024-01-18 08:00:12",
    details: "Exported to PDF",
    ip: "192.168.1.101",
  },
  {
    id: 7,
    user: "Mike Staff",
    action: "Updated product stock",
    target: "USB-C Cable",
    category: "inventory",
    timestamp: "2024-01-17 16:45:28",
    details: "Stock adjusted from 15 to 8",
    ip: "192.168.1.102",
  },
  {
    id: 8,
    user: "Emily Sales",
    action: "Processed refund",
    target: "Order #1220",
    category: "sales",
    timestamp: "2024-01-17 15:30:44",
    details: "Refund amount: $89.99",
    ip: "192.168.1.103",
  },
  {
    id: 9,
    user: "John Admin",
    action: "Created new category",
    target: "Smart Home",
    category: "inventory",
    timestamp: "2024-01-17 14:15:19",
    details: "Added product category",
    ip: "192.168.1.100",
  },
  {
    id: 10,
    user: "Sarah Manager",
    action: "Updated supplier info",
    target: "Tech Supplies Inc.",
    category: "suppliers",
    timestamp: "2024-01-17 13:00:05",
    details: "Modified contact details",
    ip: "192.168.1.101",
  },
]

export default function ActivityPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.target.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === "all" || activity.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "inventory":
        return <Package className="h-4 w-4" />
      case "sales":
        return <ShoppingCart className="h-4 w-4" />
      case "customers":
        return <Users className="h-4 w-4" />
      case "users":
        return <User className="h-4 w-4" />
      case "reports":
        return <FileText className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      inventory: "bg-primary/10 text-primary",
      sales: "bg-chart-2/10 text-chart-2",
      customers: "bg-chart-3/10 text-chart-3",
      users: "bg-chart-4/10 text-chart-4",
      reports: "bg-chart-5/10 text-chart-5",
      suppliers: "bg-purple-500/10 text-purple-500",
    }

    return (
      <Badge variant="secondary" className={colors[category] || "bg-muted"}>
        {category}
      </Badge>
    )
  }

  const categoryStats = [
    { category: "inventory", count: activities.filter((a) => a.category === "inventory").length, label: "Inventory" },
    { category: "sales", count: activities.filter((a) => a.category === "sales").length, label: "Sales" },
    { category: "customers", count: activities.filter((a) => a.category === "customers").length, label: "Customers" },
    { category: "users", count: activities.filter((a) => a.category === "users").length, label: "Users" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Activity Log</h1>
          <p className="text-muted-foreground">Track all system activities and user actions</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Log
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {categoryStats.map((stat) => (
          <Card key={stat.category}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  {getCategoryIcon(stat.category)}
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.count}</p>
                <p className="text-xs text-muted-foreground">activities logged</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>All Activities</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search activities..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="reports">Reports</SelectItem>
                  <SelectItem value="suppliers">Suppliers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex flex-1 gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-semibold text-primary">
                      {activity.user
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{activity.user}</span>
                      <span className="text-sm text-muted-foreground">{activity.action}</span>
                      <span className="font-medium">{activity.target}</span>
                      {getCategoryBadge(activity.category)}
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.details}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{activity.timestamp}</span>
                      <span>•</span>
                      <span>IP: {activity.ip}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0">
                  View Details
                </Button>
              </div>
            ))}
          </div>

          {filteredActivities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No activities found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
