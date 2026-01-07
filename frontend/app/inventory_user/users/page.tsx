"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, UserCog, Mail, Shield } from "lucide-react"
import Link from "next/link"

// Mock data
const users = [
  {
    id: 1,
    name: "John Admin",
    email: "john.admin@salesystem.com",
    phone: "+1 (555) 111-1111",
    role: "admin",
    status: "active",
    lastLogin: "2024-01-18 10:30 AM",
  },
  {
    id: 2,
    name: "Sarah Manager",
    email: "sarah.manager@salesystem.com",
    phone: "+1 (555) 222-2222",
    role: "manager",
    status: "active",
    lastLogin: "2024-01-18 09:15 AM",
  },
  {
    id: 3,
    name: "Mike Staff",
    email: "mike.staff@salesystem.com",
    phone: "+1 (555) 333-3333",
    role: "staff",
    status: "active",
    lastLogin: "2024-01-17 04:45 PM",
  },
  {
    id: 4,
    name: "Emily Sales",
    email: "emily.sales@salesystem.com",
    phone: "+1 (555) 444-4444",
    role: "staff",
    status: "active",
    lastLogin: "2024-01-18 08:00 AM",
  },
  {
    id: 5,
    name: "David Former",
    email: "david.former@salesystem.com",
    phone: "+1 (555) 555-5555",
    role: "staff",
    status: "inactive",
    lastLogin: "2023-12-15 02:30 PM",
  },
]

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>
      case "manager":
        return <Badge variant="default">Manager</Badge>
      case "staff":
        return <Badge variant="secondary">Staff</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Users</h1>
          <p className="text-muted-foreground">Manage system users and permissions</p>
        </div>
        <Link href="/users/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <UserCog className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">
                {users.filter((u) => u.status === "active").length} active
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/10">
                <Shield className="h-6 w-6 text-chart-2" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Administrators</p>
              <p className="text-2xl font-bold">{users.filter((u) => u.role === "admin").length}</p>
              <p className="text-xs text-muted-foreground">Full system access</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10">
                <Mail className="h-6 w-6 text-chart-3" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Staff Members</p>
              <p className="text-2xl font-bold">{users.filter((u) => u.role === "staff").length}</p>
              <p className="text-xs text-muted-foreground">Regular access</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
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
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-semibold text-primary">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.lastLogin}</TableCell>
                  <TableCell>
                    {user.status === "active" ? (
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
