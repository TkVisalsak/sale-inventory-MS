"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, Users, TrendingUp, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { apiRequest } from "@/lib/api"
import { api as saleApi } from "@/lib/sale-api"

export default function SalePage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    revenue: { value: 0, formatted: "$0.00" },
    sales: { value: 0, formatted: "0" },
    customers: { value: 0, formatted: "0" },
    recentSales: { value: 0, formatted: "0" },
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    async function loadDashboardData() {
      setLoading(true)
      try {
        // Fetch all analytics data in parallel
        const [salesData, revenueData, customersData, recentSalesList] = await Promise.all([
          apiRequest("/analytics/sales").catch(() => ({ total: 0, recent: [] })),
          apiRequest("/analytics/revenue").catch(() => ({ total: 0 })),
          apiRequest("/analytics/customers").catch(() => ({ total: 0 })),
          saleApi.sales.getAll().catch(() => []),
        ])

        if (!mounted) return

        // Format revenue
        const totalRevenue = parseFloat(revenueData?.total || 0)
        const formattedRevenue = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(totalRevenue)

        // Format recent sales activity
        const salesList = Array.isArray(recentSalesList) ? recentSalesList : []
        const sortedSales = salesList
          .sort((a: any, b: any) => {
            const dateA = new Date(a.sale_date || a.created_at || 0).getTime()
            const dateB = new Date(b.sale_date || b.created_at || 0).getTime()
            return dateB - dateA
          })
          .slice(0, 4)

        const activity = sortedSales.map((sale: any) => {
          const saleDate = new Date(sale.sale_date || sale.created_at || Date.now())
          const timeAgo = getTimeAgo(saleDate)
          return {
            action: "Sale",
            item: `Order #${sale.id || sale.sale_id || "-"}`,
            customer: sale.customer?.name || sale.customer?.full_name || "Unknown",
            amount: parseFloat(sale.grand_total || 0),
            time: timeAgo,
          }
        })

        setStats({
          revenue: {
            value: totalRevenue,
            formatted: formattedRevenue,
          },
          sales: {
            value: salesData?.total || 0,
            formatted: (salesData?.total || 0).toLocaleString(),
          },
          customers: {
            value: customersData?.total || 0,
            formatted: (customersData?.total || 0).toLocaleString(),
          },
          recentSales: {
            value: salesList.length,
            formatted: salesList.length.toLocaleString(),
          },
        })

        setRecentActivity(activity)
      } catch (err) {
        console.error("Dashboard data load error:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadDashboardData()
    return () => {
      mounted = false
    }
  }, [])

  function getTimeAgo(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    return date.toLocaleDateString()
  }

  const statsConfig = [
    {
      title: "Total Revenue",
      value: stats.revenue.formatted,
      change: "",
      icon: DollarSign,
      href: "/sale_user/sale-orders",
    },
    {
      title: "Total Sales",
      value: stats.sales.formatted,
      change: "",
      icon: ShoppingCart,
      href: "/sale_user/sale-orders",
    },
    {
      title: "Customers",
      value: stats.customers.formatted,
      change: "",
      icon: Users,
      href: "/sale_user/customer",
    },
    {
      title: "Recent Orders",
      value: stats.recentSales.formatted,
      change: "",
      icon: TrendingUp,
      href: "/sale_user/sale-orders",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Sale Management</h1>

        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          statsConfig.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {stat.change && <p className="text-xs text-muted-foreground">{stat.change}</p>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/sale_user/sale-orders/add">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Create New Sale Order
              </Button>
            </Link>
            <Link href="/sale_user/customer/add">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Add New Customer
              </Button>
            </Link>
            <Link href="/sale_user/sale-orders">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <ShoppingCart className="mr-2 h-4 w-4" />
                View All Sale Orders
              </Button>
            </Link>
            <Link href="/sale_user/customer">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                View All Customers
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No recent sales</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{activity.item}</p>
                      <p className="text-muted-foreground">{activity.customer}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${activity.amount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
