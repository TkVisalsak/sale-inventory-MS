"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  LayoutDashboard,
  BarChart3,
  ShoppingCart,
  Users,
  Truck,
  FileText,
  UserCog,
  Shield,
  Activity,
  ChevronDown,
  Store,
  Package,
  Layers,
  Boxes,
  MoveRight,
  FilePlus2,
  RefreshCcw,
  ListOrdered,
} from "lucide-react"

import { cn } from "@/lib/utils"


const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/inventory_user/",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    submenu: [
      { title: "Overview", icon: ShoppingCart, href: "/inventory_user/overview" },
      { title: "Analytics", icon: BarChart3, href: "/inventory_user/analytics" },
      { title: "Reports", icon: BarChart3, href: "/inventory_user/reports" },
    ],
  },
  {
    title: "Inventory",
    icon: Package,
    submenu: [
      { title: "Products", icon: Package, href: "/inventory_user/products" },
      { title: "Categories", icon: Layers, href: "/inventory_user/categories" },
      { title: "Batches", icon: Boxes, href: "/inventory_user/batches" },
      { title: "Stock Movements", icon: MoveRight, href: "/inventory_user/stock-movements" },
      { title: "Stock Adjustments", icon: RefreshCcw, href: "/inventory_user/stock-adjustments" },
      
    ],
  },
  {
    title: "Procurement",
    icon: FilePlus2,
    submenu: [
      { title: "Purchase Requests", icon: FilePlus2, href: "/inventory_user/purchase-requests" },
      { title: "Purchase orders", icon: ListOrdered, href: "/inventory_user/purchase_orders" },
      { title: "Sales orders", icon: ListOrdered, href: "/inventory_user/sale_order" },
      { title: "Returns", icon: RefreshCcw, href: "/inventory_user/return" },
      { title: "Suppliers", icon: Truck, href: "/inventory_user/suppliers" },
      { title: "Price Lists", icon: FileText, href: "/inventory_user/price-list" },
    ],
  },
  {
    title: "Customers & Users",
    icon: Users,
    submenu: [
      { title: "Customers", icon: Users, href: "/inventory_user/customer" },
      { title: "Users", icon: UserCog, href: "/inventory_user/users" },
    ],
  },
  {
    title: "Activity",
    icon: Activity,
    href: "/inventory_user/activity",
  },
  {
    title: "Log Out",
    icon: Shield,
    href: "/inventory_user/logout",
  },
];




export function AppSidebar() {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState([])

  const toggleMenu = (title) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    )
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <Store className="h-6 w-6 text-sidebar-primary" />
        <span className="text-lg font-semibold text-sidebar-foreground">SaleSystem</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const hasSubmenu = Array.isArray(item.submenu)
            const isOpen = openMenus.includes(item.title)

            return (
              <li key={item.title}>
                {hasSubmenu ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.title)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </button>

                    {isOpen && (
                      <ul className="ml-8 mt-1 space-y-1">
                        {item.submenu.map((sub) => {
                          const isSubActive = pathname === sub.href
                          return (
                            <li key={sub.href}>
                              <Link
                                href={sub.href}
                                className={cn(
                                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                  isSubActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                                )}
                              >
                                <sub.icon className="h-4 w-4" />
                                {sub.title}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
            <span className="text-sm font-semibold">AD</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-accent-foreground">Admin User</p>
            <p className="text-xs text-muted-foreground">admin@salesystem.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
