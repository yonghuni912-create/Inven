import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Inven - Multi-Region Inventory Management System',
  description: 'Global inventory, order, and pricing management with Shopify integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="font-sans">{children}</body>
    </html>
  )
}
