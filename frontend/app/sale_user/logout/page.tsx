"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Store, ArrowRight, Loader2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { api } from "@/lib/inventory-api/auth-api"

export default function LogoutPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loggedOut, setLoggedOut] = useState(false)

    useEffect(() => {
        // Auto-logout on mount
        handleLogout()
    }, [])

    const handleLogout = async () => {
        setLoading(true)
        setError(null)

        try {
            await api.auth.logout()

            // Clear any local storage
            if (typeof window !== "undefined") {
                localStorage.removeItem("auth_token")
                localStorage.clear()
            }

            setLoggedOut(true)

            // Redirect to landing page after a short delay
            setTimeout(() => {
                router.push("/")
            }, 2000)
        } catch (err: any) {
            console.error("Logout error:", err)
            setError(err?.message || "Failed to logout. Please try again.")

            // Even if logout fails, clear local storage and redirect
            if (typeof window !== "undefined") {
                localStorage.removeItem("auth_token")
                localStorage.clear()
            }

            setLoggedOut(true)
            setTimeout(() => {
                router.push("/")
            }, 2000)
        } finally {
            setLoading(false)
        }
    }

    const handleGoToHome = () => {
        router.push("/")
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
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-16">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Card className="w-full max-w-md shadow-lg">
                        <CardContent className="p-8">
                            <div className="text-center mb-6">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                    {loading ? (
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    ) : loggedOut ? (
                                        <LogOut className="h-8 w-8 text-primary" />
                                    ) : (
                                        <LogOut className="h-8 w-8 text-primary" />
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold mb-2">
                                    {loading ? "Logging Out..." : loggedOut ? "Logged Out Successfully" : "Logging Out"}
                                </h2>
                                {loading ? (
                                    <p className="text-sm text-muted-foreground">Please wait while we log you out...</p>
                                ) : error ? (
                                    <p className="text-sm text-destructive">{error}</p>
                                ) : loggedOut ? (
                                    <p className="text-sm text-muted-foreground">You have been successfully logged out. Redirecting to home page...</p>
                                ) : null}
                            </div>

                            {loggedOut && (
                                <div className="space-y-4">
                                    <Button
                                        onClick={handleGoToHome}
                                        className="w-full"
                                        variant="default"
                                        size="lg"
                                    >
                                        Go to Home Page
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-16 mt-16">
                    <Card className="border-2 hover:border-primary transition-colors">
                        <CardContent className="p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                                <Store className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Thank You</h3>
                            <p className="text-sm text-muted-foreground">
                                You have been successfully logged out. We hope to see you again soon.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-2 hover:border-primary transition-colors">
                        <CardContent className="p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                                <ArrowRight className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Ready to Continue?</h3>
                            <p className="text-sm text-muted-foreground">
                                Return to the home page or sign in again to access your dashboard.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-2 hover:border-primary transition-colors">
                        <CardContent className="p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                                <LogOut className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Secure Logout</h3>
                            <p className="text-sm text-muted-foreground">
                                Your session has been securely terminated. All data has been cleared.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* CTA Section */}
                <div className="text-center">
                    <Card className="border-2 border-primary/20 bg-primary/5">
                        <CardContent className="p-12">
                            <h2 className="text-3xl font-bold mb-4">Ready to Sign In Again?</h2>
                            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                                Return to the login page to access your dashboard and continue managing your sales and inventory.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Button size="lg" onClick={handleGoToHome} variant="outline" className="text-lg px-8 py-6">
                                    Go to Home
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button size="lg" onClick={() => router.push("/login")} variant="default" className="text-lg px-8 py-6">
                                    Sign In Again
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </div>
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
