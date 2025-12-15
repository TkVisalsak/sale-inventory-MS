"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+20.1%",
      trend: "up",
      icon: DollarSign,
      description: "from last month",
    },
    {
      title: "Sales",
      value: "2,350",
      change: "+15.3%",
      trend: "up",
      icon: ShoppingCart,
      description: "transactions this month",
    },
    {
      title: "Customers",
      value: "1,234",
      change: "+8.2%",
      trend: "up",
      icon: Users,
      description: "active customers",
    },
    {
      title: "Products",
      value: "567",
      change: "-2.4%",
      trend: "down",
      icon: Package,
      description: "in inventory",
    },
  ]

  const revenueData = [
    { date: "Mon", revenue: 4200 },
    { date: "Tue", revenue: 3800 },
    { date: "Wed", revenue: 5100 },
    { date: "Thu", revenue: 4600 },
    { date: "Fri", revenue: 6200 },
    { date: "Sat", revenue: 7800 },
    { date: "Sun", revenue: 5400 },
  ]

  const topProducts = [
    { name: "Wireless Headphones", sales: 245, revenue: 12250 },
    { name: "Smart Watch", sales: 189, revenue: 18900 },
    { name: "Laptop Stand", sales: 156, revenue: 4680 },
    { name: "USB-C Cable", sales: 134, revenue: 2680 },
    { name: "Phone Case", sales: 98, revenue: 1960 },
  ]

  const recentSales = [
    { id: "1001", customer: "John Doe", amount: 234.5, time: "2 min ago", status: "completed" },
    { id: "1002", customer: "Jane Smith", amount: 456.78, time: "15 min ago", status: "completed" },
    { id: "1003", customer: "Bob Johnson", amount: 123.45, time: "32 min ago", status: "pending" },
    { id: "1004", customer: "Alice Brown", amount: 789.12, time: "1 hour ago", status: "completed" },
    { id: "1005", customer: "Charlie Wilson", amount: 345.67, time: "2 hours ago", status: "completed" },
  ]

  const lowStockItems = [
    { name: "Wireless Mouse", category: "Electronics", stock: 5, reorderLevel: 20 },
    { name: "Notebook A4", category: "Stationery", stock: 8, reorderLevel: 50 },
    { name: "USB Flash Drive", category: "Electronics", stock: 3, reorderLevel: 15 },
    { name: "Desk Lamp", category: "Furniture", stock: 6, reorderLevel: 10 },
    { name: "Water Bottle", category: "Accessories", stock: 4, reorderLevel: 25 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-balance">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === "up" ? "text-success" : "text-destructive"
                  }`}
                >
                  {stat.trend === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#fillRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sales: {
                  label: "Sales",
                  color: "hsl(var(--chart-2))",
                },
              }}
            >
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={120} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Sales</CardTitle>
            <Button variant="ghost" size="sm">
              View All
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">Order #{sale.id}</p>
                    <p className="text-sm text-muted-foreground">{sale.customer}</p>
                    <p className="text-xs text-muted-foreground">{sale.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${sale.amount.toFixed(2)}</p>
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs ${
                        sale.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}
                    >
                      {sale.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Low Stock Alert</CardTitle>
            <Button variant="ghost" size="sm">
              Manage
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-destructive">{item.stock} left</p>
                    <p className="text-xs text-muted-foreground">Reorder: {item.reorderLevel}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
