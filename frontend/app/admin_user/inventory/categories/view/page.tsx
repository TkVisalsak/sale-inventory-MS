"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Search, Loader2, AlertTriangle, Package, DollarSign, AlertCircle, FolderTree } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Product {
  product_id: number
  product_name: string
  category: string
  supplier: string
  total_quantity: number
  latest_buy_price: number
  latest_market_price: number
  total_value: number
  oldest_available_expiration_date: string | null
  latest_expiration_date: string | null
  stock_status: string
}

interface Category {
  id: number
  name: string
  description: string
}

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

        // Fetch category details
        const categoryData = await api.categories.getById(categoryId)
        setCategory({
          id: categoryData.id,
          name: categoryData.name || "",
          description: categoryData.description || "",
        })

        // Fetch products for this category
        // Try Node backend endpoint first (has detailed stock info)
        const nodeApiUrl = process.env.NEXT_PUBLIC_NODE_API_URL || "http://localhost:3001/api"
        
        try {
          const productsResponse = await fetch(`${nodeApiUrl}//admin_userinventory/getProductsByCategoryid?category_id=${categoryId}`)
          if (productsResponse.ok) {
            const productsData = await productsResponse.json()
            setProducts(Array.isArray(productsData) ? productsData : [])
          } else {
            throw new Error("Node API not available")
          }
        } catch (err) {
          console.log("Node API not available, trying Laravel API...")
          // Fallback: try to get all products and filter by category
          try {
            const allProducts = await api.products.getAll({ category_id: categoryId })
            const filteredProducts = Array.isArray(allProducts) 
              ? allProducts.filter((p: any) => p.category_id === parseInt(categoryId))
              : []
            setProducts(filteredProducts.map((p: any) => ({
              product_id: p.id,
              product_name: p.name,
              category: p.category?.name || "",
              supplier: p.supplier?.name || "",
              total_quantity: p.stock || 0,
              latest_buy_price: p.buy_price || 0,
              latest_market_price: p.price || 0,
              total_value: (p.stock || 0) * (p.price || 0),
              oldest_available_expiration_date: null,
              latest_expiration_date: null,
              stock_status: (p.stock || 0) > 0 ? "In Stock" : "Out of Stock",
            })))
          } catch (fallbackErr) {
            console.error("Error fetching products:", fallbackErr)
            // Continue with empty products array
            setProducts([])
          }
        }
      } catch (err: any) {
        console.error("Error fetching category:", err)
        setError(err.message || "Failed to load category")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [categoryId])

  // Calculate stats
  const stats = {
    expireAlert: products.filter((p) => {
      if (!p.oldest_available_expiration_date) return false
      const expDate = new Date(p.oldest_available_expiration_date)
      const today = new Date()
      const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
    }).length,
    totalProducts: products.length,
    stockValue: products.reduce((sum, p) => sum + (p.total_value || 0), 0),
    lowStockAlert: products.filter((p) => {
      const quantity = parseFloat(p.total_quantity?.toString() || "0")
      return quantity > 0 && quantity < 10
    }).length,
  }

  const filteredProducts = products.filter(
    (product) =>
      product.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getDaysUntilExpiry = (dateString: string | null) => {
    if (!dateString) return null
    const expDate = new Date(dateString)
    const today = new Date()
    const days = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin_user/inventory/categories">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-balance">View Category</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin_user/inventory/categories">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-balance">{category?.name || "View Category"}</h1>
          <p className="text-muted-foreground">{category?.description || "Category details and products"}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Expire Alert</p>
              <p className="text-2xl font-bold">{stats.expireAlert}</p>
              <p className="text-xs text-muted-foreground">Products expiring soon</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
              <p className="text-xs text-muted-foreground">In this category</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Stock Value</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.stockValue)}</p>
              <p className="text-xs text-muted-foreground">Total inventory value</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Low Stock Alert</p>
              <p className="text-2xl font-bold">{stats.lowStockAlert}</p>
              <p className="text-xs text-muted-foreground">Products need restocking</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Products List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Products in Category</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderTree className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No products found matching your search." : "No products in this category."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Buy Price</TableHead>
                  <TableHead>Market Price</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Expiration Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const daysUntilExpiry = getDaysUntilExpiry(product.oldest_available_expiration_date)
                  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry >= 0
                  const isLowStock = parseFloat(product.total_quantity?.toString() || "0") > 0 && parseFloat(product.total_quantity?.toString() || "0") < 10

                  return (
                    <TableRow key={product.product_id}>
                      <TableCell className="font-medium">{product.product_name}</TableCell>
                      <TableCell>{product.supplier || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={isLowStock ? "outline" : "secondary"}>
                          {product.total_quantity || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(product.latest_buy_price || 0)}</TableCell>
                      <TableCell>{formatCurrency(product.latest_market_price || 0)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(product.total_value || 0)}</TableCell>
                      <TableCell>
                        {product.oldest_available_expiration_date ? (
                          <div className="flex flex-col">
                            <span className={isExpiringSoon ? "text-orange-500 font-medium" : ""}>
                              {formatDate(product.oldest_available_expiration_date)}
                            </span>
                            {daysUntilExpiry !== null && (
                              <span className="text-xs text-muted-foreground">
                                {daysUntilExpiry < 0
                                  ? "Expired"
                                  : daysUntilExpiry === 0
                                    ? "Expires today"
                                    : `${daysUntilExpiry} days left`}
                              </span>
                            )}
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {product.stock_status === "In Stock" ? (
                          <Badge variant="secondary">In Stock</Badge>
                        ) : (
                          <Badge variant="destructive">Out of Stock</Badge>
                        )}
                        {isExpiringSoon && (
                          <Badge variant="outline" className="ml-2 border-orange-500 text-orange-500">
                            Expiring Soon
                          </Badge>
                        )}
                        {isLowStock && (
                          <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-500">
                            Low Stock
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
