"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Store, Lock, User, Shield } from "lucide-react"
import { api as authApi } from "@/lib/inventory-api/auth-api"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!formData.username || !formData.password || !formData.role) {
        setError("Please fill in all fields")
        setLoading(false)
        return
      }

      const response = await authApi.auth.login({
        username: formData.username,
        password: formData.password,
        role: formData.role,
      })

      if (response.success) {
        // Store user info in localStorage for client-side access
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_token", "authenticated")
          localStorage.setItem("user", JSON.stringify(response.data.user))
          localStorage.setItem("user_role", response.data.user.role)
        }

        // Redirect based on selected role (override backend redirect for Sale role)
        let redirectPath = response.data.redirect
        if (formData.role === "admin") {
          // "admin" role in backend corresponds to "Sale" in frontend, redirect to sale_user
          redirectPath = "/sale_user"
        } else if (formData.role === "inventory") {
          redirectPath = "/inventory_user"
        }

        router.push(redirectPath)
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || err.data?.message || "Login failed. Please check your credentials.")
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">SaleSystem</h1>
            <p className="text-sm text-muted-foreground">Professional Sales & Inventory Management</p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    className="pl-10"
                    value={formData.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleChange("role", value)}
                    required
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Sale</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Select your role to access the appropriate dashboard</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>© 2024 SaleSystem. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

