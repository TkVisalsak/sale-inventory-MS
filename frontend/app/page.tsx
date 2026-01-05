"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Store, ArrowRight, Shield, Package, BarChart3, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    if (typeof window !== "undefined") {
      const authToken = localStorage.getItem("auth_token")
      const userRole = localStorage.getItem("user_role")
      
      if (authToken && userRole) {
        // Redirect to appropriate dashboard
        const redirectPath = userRole === "admin" ? "/admin_user" : "/inventory_user"
        router.push(redirectPath)
      }
    }
  }, [router])

  const handleGetStarted = () => {
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SaleSystem</h1>
              <p className="text-xs text-muted-foreground">Professional Sales & Inventory Management</p>
            </div>
          </div>
          <Button onClick={handleGetStarted} variant="default">
            Sign In
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Store className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Welcome to SaleSystem
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Professional Sales & Inventory Management System
            <br />
            Streamline your business operations with powerful tools and insights
          </p>
          <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardContent className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Role-Based Access</h3>
              <p className="text-sm text-muted-foreground">
                Secure access control with admin and inventory user roles for better security and management.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardContent className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Inventory Management</h3>
              <p className="text-sm text-muted-foreground">
                Complete inventory tracking with batches, stock movements, adjustments, and purchase requests.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardContent className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Analytics & Reports</h3>
              <p className="text-sm text-muted-foreground">
                Real-time analytics and comprehensive reports to make data-driven business decisions.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Customer Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage customer relationships, track orders, and handle returns efficiently.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Purchase Requests</h3>
                  <p className="text-sm text-muted-foreground">
                    Streamline procurement with purchase request workflows and approval processes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Sign in to access your dashboard and start managing your sales and inventory efficiently.
              </p>
              <Button size="lg" onClick={handleGetStarted} variant="default" className="text-lg px-8 py-6">
                Sign In Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 SaleSystem. All rights reserved.</p>
            <p className="mt-2">Professional Sales & Inventory Management System</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

