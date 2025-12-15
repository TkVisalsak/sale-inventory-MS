import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, DollarSign, TrendingUp, Package } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SalesPage() {
  const stats = [
    {
      title: "Today's Sales",
      value: "$4,234.50",
      change: "23 transactions",
      icon: DollarSign,
      href: "/sales/pos",
    },
    {
      title: "This Week",
      value: "$28,456.78",
      change: "+18.2% from last week",
      icon: TrendingUp,
      href: "/sales/pos",
    },
    {
      title: "Pending Orders",
      value: "12",
      change: "Awaiting processing",
      icon: ShoppingCart,
      href: "/sales/pos",
    },
    {
      title: "Items Sold",
      value: "456",
      change: "This month",
      icon: Package,
      href: "/sales/pos",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Sales</h1>
          <p className="text-muted-foreground">Manage your sales and transactions</p>
        </div>
        <Link href="/sales/pos">
          <Button size="lg">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Open POS
          </Button>
        </Link>
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { id: "TXN-1001", customer: "John Doe", amount: 234.5, items: 3, time: "2 min ago" },
              { id: "TXN-1002", customer: "Jane Smith", amount: 456.78, items: 5, time: "15 min ago" },
              { id: "TXN-1003", customer: "Bob Johnson", amount: 123.45, items: 2, time: "32 min ago" },
              { id: "TXN-1004", customer: "Alice Brown", amount: 789.12, items: 7, time: "1 hour ago" },
              { id: "TXN-1005", customer: "Charlie Wilson", amount: 345.67, items: 4, time: "2 hours ago" },
            ].map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="space-y-1">
                  <p className="font-medium">{transaction.id}</p>
                  <p className="text-sm text-muted-foreground">{transaction.customer}</p>
                  <p className="text-xs text-muted-foreground">{transaction.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${transaction.amount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{transaction.items} items</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
