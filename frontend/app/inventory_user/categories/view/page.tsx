"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  Search,
  Loader2,
  AlertTriangle,
  Package,
  DollarSign,
  AlertCircle,
  FolderTree,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { api as categoryApi } from "@/lib/inventory-api/category-api"
import { api as productApi } from "@/lib/inventory-api/product-api"
import { Alert, AlertDescription } from "@/components/ui/alert"

/* =======================
   Types
======================= */

interface Product {
  id: number
  name: string
  barcode?: string
  category?: {
    id: number
    name: string
  }
  supplier?: {
    id: number
    name: string
  }
  unit?: string
  description?: string
  availability?: boolean
}

interface Category {
  id: number
  name: string
  description?: string
}

/* =======================
   Component
======================= */

export default function ViewCategoryPage() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get("id")

  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!categoryId) {
        setError("Category ID is required")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // 1️⃣ Fetch category details
        const categoryData = await categoryApi.categories.getById(categoryId)
        setCategory({
          id: categoryData.id,
          name: categoryData.name || "",
          description: categoryData.description || "",
        })

        // 2️⃣ Fetch all products and filter by category
        const allProducts = await productApi.products.getAll()
        const filteredProducts = Array.isArray(allProducts)
          ? allProducts.filter(
              (p: any) => p.category_id === Number(categoryId),
            )
          : []

        setProducts(filteredProducts)
      } catch (err: any) {
        console.error("Error fetching category:", err)
        setError(err.message || "Failed to load category")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [categoryId])

  /* =======================
     Stats
  ======================= */

  const stats = {
    totalProducts: products.length,
    availableProducts: products.filter((p) => p.availability !== false).length,
    unavailableProducts: products.filter((p) => p.availability === false).length,
    withSupplier: products.filter((p) => p.supplier).length,
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.supplier?.name && p.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  /* =======================
     Loading
  ======================= */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/inventory_user/categories">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">View Category</h1>
        </div>

        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  /* =======================
     UI
  ======================= */

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory_user/categories">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{category?.name}</h1>
          <p className="text-muted-foreground">
            {category?.description || "Category details"}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <Package className="h-6 w-6 text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold">{stats.totalProducts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <FolderTree className="h-6 w-6 text-green-500" />
            <p className="mt-2 text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold">{stats.availableProducts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <p className="mt-2 text-sm text-muted-foreground">Unavailable</p>
            <p className="text-2xl font-bold">{stats.unavailableProducts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <DollarSign className="h-6 w-6 text-blue-500" />
            <p className="mt-2 text-sm text-muted-foreground">With Supplier</p>
            <p className="text-2xl font-bold">{stats.withSupplier}</p>
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Products in Category</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {searchQuery ? "No products found matching your search." : "No products found in this category."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {p.barcode || "N/A"}
                    </TableCell>
                    <TableCell>
                      {p.supplier ? (
                        <Badge variant="outline">{p.supplier.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{p.unit || "N/A"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.availability !== false
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {p.availability !== false ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/inventory_user/products/view?id=${p.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
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

