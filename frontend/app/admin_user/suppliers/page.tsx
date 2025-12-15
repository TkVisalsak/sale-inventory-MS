"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Truck, Mail, Phone } from "lucide-react"
import Link from "next/link"

// Mock data
const suppliers = [
  {
    id: 1,
    name: "Tech Supplies Inc.",
    email: "contact@techsupplies.com",
    phone: "+1 (555) 111-2222",
    category: "Electronics",
    totalOrders: 45,
    totalValue: 125340.5,
    status: "active",
  },
  {
    id: 2,
    name: "Office Essentials Co.",
    email: "sales@officeessentials.com",
    phone: "+1 (555) 222-3333",
    category: "Stationery",
    totalOrders: 32,
    totalValue: 45678.9,
    status: "active",
  },
  {
    id: 3,
    name: "Furniture World",
    email: "orders@furnitureworld.com",
    phone: "+1 (555) 333-4444",
    category: "Furniture",
    totalOrders: 18,
    totalValue: 89234.12,
    status: "active",
  },
  {
    id: 4,
    name: "Gadget Distributors",
    email: "info@gadgetdist.com",
    phone: "+1 (555) 444-5555",
    category: "Electronics",
    totalOrders: 67,
    totalValue: 234567.89,
    status: "active",
  },
  {
    id: 5,
    name: "Accessory Hub",
    email: "support@accessoryhub.com",
    phone: "+1 (555) 555-6666",
    category: "Accessories",
    totalOrders: 12,
    totalValue: 23456.78,
    status: "inactive",
  },
]

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Suppliers</h1>
          <p className="text-muted-foreground">Manage your supplier relationships</p>
        </div>
        <Link href="/suppliers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Total Suppliers</p>
              <p className="text-2xl font-bold">{suppliers.length}</p>
              <p className="text-xs text-muted-foreground">
                {suppliers.filter((s) => s.status === "active").length} active
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/10">
                <Mail className="h-6 w-6 text-chart-2" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{suppliers.reduce((sum, s) => sum + s.totalOrders, 0)}</p>
              <p className="text-xs text-muted-foreground">From all suppliers</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10">
                <Phone className="h-6 w-6 text-chart-3" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">${suppliers.reduce((sum, s) => sum + s.totalValue, 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">All purchases</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Suppliers</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search suppliers..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium">{supplier.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">{supplier.email}</p>
                      <p className="text-xs text-muted-foreground">{supplier.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{supplier.category}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{supplier.totalOrders}</TableCell>
                  <TableCell className="font-medium">${supplier.totalValue.toFixed(2)}</TableCell>
                  <TableCell>
                    {supplier.status === "active" ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon-sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
