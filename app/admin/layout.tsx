'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Regions', href: '/admin/regions', icon: '🌍' },
  { name: 'Stores', href: '/admin/stores', icon: '🏪' },
  { name: 'Routes', href: '/admin/routes', icon: '🚚' },
  { name: 'SKUs', href: '/admin/skus', icon: '📦' },
  { name: 'Pricing', href: '/admin/pricing', icon: '💰' },
  { name: 'Inventory', href: '/admin/inventory', icon: '📋' },
  { name: 'Orders', href: '/admin/orders', icon: '🛒' },
  { name: 'Adjustments', href: '/admin/adjustments', icon: '⚙️' },
  { name: 'Documents', href: '/admin/documents', icon: '📄' },
  { name: 'Reports', href: '/admin/reports', icon: '📈' },
  { name: 'Ops Logs', href: '/admin/ops', icon: '📝' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-primary-600">Inven</h1>
            <p className="text-sm text-gray-500">Inventory System</p>
          </div>
          <nav className="mt-6">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <header className="bg-white shadow-sm">
            <div className="px-8 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Multi-Region Inventory Management
              </h2>
            </div>
          </header>
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
