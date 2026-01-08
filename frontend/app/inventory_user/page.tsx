"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  FolderTree,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { api as productApi } from "@/lib/inventory-api/product-api";
import { api as categoryApi } from "@/lib/inventory-api/category-api";

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    products: { value: 0, formatted: "0" },
    categories: { value: 0, formatted: "0" },
    lowStock: { value: 0, formatted: "0" },
    totalValue: { value: 0, formatted: "$0.00" },
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadDashboardData() {
      setLoading(true);
      try {
        // Fetch all data in parallel
        const [productsData, categoriesData, analyticsRevenue, batchesData] =
          await Promise.all([
            productApi.products.getAll().catch(() => []),
            categoryApi.categories.getAll().catch(() => []),
            apiRequest("/analytics/revenue").catch(() => ({ total: 0 })),
            apiRequest("/batches").catch(() => []),
          ]);

        if (!mounted) return;

        // Calculate low stock items (assuming products have stock_quantity and reorder_level)
        const products = Array.isArray(productsData) ? productsData : [];
        const lowStockCount = products.filter((p: any) => {
          const stock = parseFloat(p.stock_quantity || p.quantity || 0);
          const reorder = parseFloat(p.reorder_level || p.minimum_stock || 0);
          return stock > 0 && stock <= reorder;
        }).length;

        // Calculate total inventory value from batch items (more reliable)
        const batches = Array.isArray(batchesData) ? batchesData : [];
        const totalValue = batches.reduce((sum: number, batch: any) => {
          const items = Array.isArray(batch.items) ? batch.items : [];
          const batchValue = items.reduce((s: number, it: any) => {
            const qty = parseFloat(it.quantity || 0);
            const cost = parseFloat(it.unit_cost || it.price || 0);
            return s + qty * cost;
          }, 0);
          return sum + batchValue;
        }, 0);

        // Format recent activity from products (last 4 modified)
        const sortedProducts = [...products]
          .sort((a: any, b: any) => {
            const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
            const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 4);

        const activity = sortedProducts.map((p: any) => {
          const updatedAt = new Date(
            p.updated_at || p.created_at || Date.now()
          );
          const timeAgo = getTimeAgo(updatedAt);
          return {
            action:
              p.updated_at &&
              p.created_at &&
              new Date(p.updated_at) > new Date(p.created_at)
                ? "Updated"
                : "Added",
            item: p.name || "Unknown Product",
            time: timeAgo,
          };
        });

        setStats({
          products: {
            value: products.length,
            formatted: products.length.toLocaleString(),
          },
          categories: {
            value: Array.isArray(categoriesData) ? categoriesData.length : 0,
            formatted: Array.isArray(categoriesData)
              ? categoriesData.length.toLocaleString()
              : "0",
          },
          lowStock: {
            value: lowStockCount,
            formatted: lowStockCount.toLocaleString(),
          },
          totalValue: {
            value: totalValue,
            formatted: new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(totalValue),
          },
        });

        setRecentActivity(activity);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      mounted = false;
    };
  }, []);

  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  }

  const statsConfig = [
    {
      title: "Total Products",
      value: stats.products.formatted,
      change: "",
      icon: Package,
      href: "/inventory_user/products",
    },
    {
      title: "Categories",
      value: stats.categories.formatted,
      change: "",
      icon: FolderTree,
      href: "/inventory_user/categories",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStock.formatted,
      change: stats.lowStock.value > 0 ? "Needs attention" : "",
      icon: AlertTriangle,
      href: "/inventory_user/products",
    },
    {
      title: "Total Value",
      value: stats.totalValue.formatted,
      change: "",
      icon: TrendingUp,
      href: "/inventory_user/products",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Manage your products and categories
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                </CardContent>
              </Card>
            ))
          : statsConfig.map((stat) => (
              <Link key={stat.title} href={stat.href}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <stat.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      {stat.change && (
                        <p className="text-xs text-muted-foreground">
                          {stat.change}
                        </p>
                      )}
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
            <Link href="/inventory_user/products/new">
              <Button
                className="w-full justify-start bg-transparent"
                variant="outline"
              >
                <Package className="mr-2 h-4 w-4" />
                Add New Product
              </Button>
            </Link>
            <Link href="/inventory_user/categories/add">
              <Button
                className="w-full justify-start bg-transparent"
                variant="outline"
              >
                <FolderTree className="mr-2 h-4 w-4" />
                Add New Category
              </Button>
            </Link>
            <Link href="/inventory_user/products">
              <Button
                className="w-full justify-start bg-transparent"
                variant="outline"
              >
                <Package className="mr-2 h-4 w-4" />
                View All Products
              </Button>
            </Link>
            <Link href="/inventory_user/categories">
              <Button
                className="w-full justify-start bg-transparent"
                variant="outline"
              >
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No recent activity
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-muted-foreground">{activity.item}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
