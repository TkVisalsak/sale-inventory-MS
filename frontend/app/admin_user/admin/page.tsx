"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Settings, Database, Bell, Lock, Save } from "lucide-react"

// Mock data for roles
const roles = [
  { id: 1, name: "Administrator", users: 2, permissions: ["all"] },
  { id: 2, name: "Manager", users: 3, permissions: ["inventory", "sales", "customers", "reports"] },
  { id: 3, name: "Staff", users: 8, permissions: ["sales", "customers"] },
]

// Mock data for recent activity
const recentActivity = [
  { id: 1, user: "John Admin", action: "Created new product", timestamp: "2 minutes ago" },
  { id: 2, user: "Sarah Manager", action: "Updated customer record", timestamp: "15 minutes ago" },
  { id: 3, user: "Mike Staff", action: "Processed sale #1234", timestamp: "1 hour ago" },
  { id: 4, user: "Emily Sales", action: "Added new customer", timestamp: "2 hours ago" },
  { id: 5, user: "John Admin", action: "Modified user permissions", timestamp: "3 hours ago" },
]

export default function AdminPage() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
    enableNotifications: true,
    enableBackups: true,
    companyName: "SaleSystem",
    companyEmail: "admin@salesystem.com",
    taxRate: "8.5",
    currency: "USD",
  })

  const handleSettingChange = (field: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveSettings = () => {
    console.log("Saving settings:", settings)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Admin Panel</h1>
          <p className="text-muted-foreground">System administration and configuration</p>
        </div>
        <Button onClick={handleSaveSettings}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Total Roles</p>
              <p className="text-2xl font-bold">{roles.length}</p>
              <p className="text-xs text-muted-foreground">Permission groups</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/10">
                <Settings className="h-6 w-6 text-chart-2" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">System Status</p>
              <p className="text-2xl font-bold">Online</p>
              <p className="text-xs text-muted-foreground">All services running</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10">
                <Database className="h-6 w-6 text-chart-3" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Database Size</p>
              <p className="text-2xl font-bold">2.4 GB</p>
              <p className="text-xs text-muted-foreground">Last backup: 2h ago</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-4/10">
                <Bell className="h-6 w-6 text-chart-4" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">Active Sessions</p>
              <p className="text-2xl font-bold">13</p>
              <p className="text-xs text-muted-foreground">Users online now</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Disable public access</p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleSettingChange("maintenanceMode", checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="allowRegistration">Allow Registration</Label>
                <p className="text-sm text-muted-foreground">Enable new user signups</p>
              </div>
              <Switch
                id="allowRegistration"
                checked={settings.allowRegistration}
                onCheckedChange={(checked) => handleSettingChange("allowRegistration", checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="requireEmailVerification">Email Verification</Label>
                <p className="text-sm text-muted-foreground">Require email confirmation</p>
              </div>
              <Switch
                id="requireEmailVerification"
                checked={settings.requireEmailVerification}
                onCheckedChange={(checked) => handleSettingChange("requireEmailVerification", checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="enableNotifications">Notifications</Label>
                <p className="text-sm text-muted-foreground">System notifications</p>
              </div>
              <Switch
                id="enableNotifications"
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => handleSettingChange("enableNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="enableBackups">Automatic Backups</Label>
                <p className="text-sm text-muted-foreground">Daily database backups</p>
              </div>
              <Switch
                id="enableBackups"
                checked={settings.enableBackups}
                onCheckedChange={(checked) => handleSettingChange("enableBackups", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => handleSettingChange("companyName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyEmail">Company Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={settings.companyEmail}
                onChange={(e) => handleSettingChange("companyEmail", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.1"
                value={settings.taxRate}
                onChange={(e) => handleSettingChange("taxRate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={settings.currency}
                onChange={(e) => handleSettingChange("currency", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Role Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Permissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{role.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{role.users}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 2).map((perm) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                        {role.permissions.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-xs font-semibold text-primary">
                      {activity.user
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.user}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
