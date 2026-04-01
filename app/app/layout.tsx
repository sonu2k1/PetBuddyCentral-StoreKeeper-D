import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ToastProvider } from "@/components/ui/Toast"

export const viewport: Viewport = {
  themeColor: "#0B1120",
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  title: "PetBuddyCentral — Store Keeper",
  description:
    "AI-powered franchise management for pet store chains. Manage inventory, billing, customers, and analytics across all your stores.",
  keywords: "pet store, POS, inventory, franchise, management",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
