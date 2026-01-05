import { Analytics } from "@vercel/analytics/next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "../globals.css"
import { AppSidebar } from "@/components/sale-sidebar"
import { Header } from "@/components/header"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" })

export const metadata = {
  title: "SaleSystem - Professional Sales & Inventory Management",
  description: "Complete sales and inventory management system",
  generator: "v0.app",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="flex h-screen overflow-hidden">
          <AppSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
