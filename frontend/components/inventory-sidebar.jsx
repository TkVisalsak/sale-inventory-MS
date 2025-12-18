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
    href: "/inventory_user/analytics",
  },
  { 
    title: "Products", 
    href: "/inventory_user/products", 
    icon: Package 
  },
  {
    title: "Categories",
    href: "/inventory_user/categories",
    icon: Layers
  },
  {
    title: "Batches",
    href: "/inventory_user/batches",
    icon: Boxes
  },
  {
    title: "Stock Movements",
    href: "/inventory_user/stock-movements",
    icon: MoveRight
  },
  {
    title: "Purchase request",
    href: "/inventory_user/purchase-requests",
    icon: FilePlus2
  },
  {
    title: "Returns",
    href: "/inventory_user/return",
    icon: RefreshCcw
  },
  {
    title: "Reports",
    href: "/inventory_user/reports",
    icon: BarChart3
  },
  {
    title: "Customers",
    icon: Users,
      href: "/inventory_user/customer",
  },
  {
    title: "Stock Adjustments",
    icon: Users,
    href: "/inventory_user/customers",
  },
  {
    title: "Stock Transfers",
    icon: Users,
    href: "/inventory_user/customers",
  },
  {
    title: "Suppliers",
    icon: Truck,
    href: "/inventory_user/suppliers",
  },
  {
    title: "Users",
    icon: UserCog,
    href: "/inventory_user/users",
  },
  {
    title: "Activity",
    icon: Activity,
    href: "/inventory_user/activity",
  },
  {
    title: "Log out",
    icon: Shield,
    href: "/inventory_user/customers",
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
