import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, FolderTree, AlertTriangle, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function InventoryPage() {
  const stats = [
    {
      title: "Total Products",
      value: "567",
      change: "+12 this week",
      icon: Package,
      href: "/inventory/products",
    },
    {
      title: "Categories",
      value: "24",
      change: "+2 this month",
      icon: FolderTree,
      href: "/inventory/categories",
    },
    {
      title: "Low Stock Items",
      value: "15",
      change: "Needs attention",
      icon: AlertTriangle,
      href: "/inventory/products?filter=low-stock",
    },
    {
      title: "Total Value",
      value: "$234,567",
      change: "+8.3% from last month",
      icon: TrendingUp,
      href: "/inventory/products",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your products and categories</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/inventory/products/new">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Add New Product
              </Button>
            </Link>
            <Link href="/inventory/categories/new">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <FolderTree className="mr-2 h-4 w-4" />
                Add New Category
              </Button>
            </Link>
            <Link href="/inventory/products">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Package className="mr-2 h-4 w-4" />
                View All Products
              </Button>
            </Link>
            <Link href="/inventory/categories">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <FolderTree className="mr-2 h-4 w-4" />
                View All Categories
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Added", item: "Wireless Headphones", time: "2 hours ago" },
                { action: "Updated", item: "Smart Watch", time: "5 hours ago" },
                { action: "Low Stock Alert", item: "USB-C Cable", time: "1 day ago" },
                { action: "Added", item: "Phone Case", time: "2 days ago" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-muted-foreground">{activity.item}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
