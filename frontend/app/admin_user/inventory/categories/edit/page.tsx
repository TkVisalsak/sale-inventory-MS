"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function EditCategoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryId = searchParams.get("id")
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)
  const [loadingCategory, setLoadingCategory] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategory = async () => {
      if (!categoryId) {
        setError("Category ID is required")
        setLoadingCategory(false)
        return
      }

      try {
        setLoadingCategory(true)
        setError(null)
        const data = await api.categories.getById(categoryId)
        setFormData({
          name: data.name || "",
          description: data.description || "",
        })
      } catch (err: any) {
        console.error("Error fetching category:", err)
        setError(err.message || "Failed to load category")
      } finally {
        setLoadingCategory(false)
      }
    }

    fetchCategory()
  }, [categoryId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      }

      if (!categoryData.name) {
        setError("Category name is required")
        setLoading(false)
        return
      }

      await api.categories.update(categoryId!, categoryData)
      router.push("/admin_user/inventory/categories")
    } catch (err: any) {
      console.error("Error updating category:", err)
      
      // Handle validation errors
      if (err.data?.errors) {
        const errorMessages = Object.values(err.data.errors).flat()
        setError(errorMessages.join(", ") || "Validation failed")
      } else {
        setError(err.message || err.data?.message || "Failed to update category. Please try again.")
      }
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (loadingCategory) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin_user/inventory/categories">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-balance">Edit Category</h1>
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
          <h1 className="text-3xl font-bold text-balance">Edit Category</h1>
          <p className="text-muted-foreground">Update category information</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Category Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter category name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter category description"
                    rows={6}
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardContent className="pt-6 space-y-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Link href="/admin_user/inventory/categories" className="block">
                  <Button type="button" variant="outline" className="w-full bg-transparent" disabled={loading}>
                    Cancel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

