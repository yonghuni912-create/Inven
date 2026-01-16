import { db } from '@/db'
import { inventory, skus, locations } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getInventory() {
  const result = await db
    .select({
      inventory_id: inventory.inventory_id,
      sku_code: skus.sku_code,
      sku_name: skus.name,
      location_name: locations.name,
      on_hand_qty: inventory.on_hand_qty,
      reserved_qty: inventory.reserved_qty,
      updated_at_utc: inventory.updated_at_utc,
    })
    .from(inventory)
    .innerJoin(skus, eq(inventory.sku_id, skus.sku_id))
    .innerJoin(locations, eq(inventory.location_id, locations.location_id))
    .orderBy(skus.sku_code)

  return result
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function InventoryPage() {
  const inventoryList = await getInventory()

  const stats = {
    totalSKUs: new Set(inventoryList.map(i => i.sku_code)).size,
    totalOnHand: inventoryList.reduce((sum, i) => sum + i.on_hand_qty, 0),
    totalReserved: inventoryList.reduce((sum, i) => sum + i.reserved_qty, 0),
    locations: new Set(inventoryList.map(i => i.location_name)).size,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-2 text-gray-600">재고 현황 및 로트 관리</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/adjustments"
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            강제조정
          </Link>
          <Link
            href="/admin/inventory/transfer"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            재고 이동
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">SKUs with Stock</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalSKUs}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total On Hand</p>
          <p className="text-2xl font-bold text-green-600">{stats.totalOnHand}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Reserved</p>
          <p className="text-2xl font-bold text-orange-600">{stats.totalReserved}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Locations</p>
          <p className="text-2xl font-bold text-blue-600">{stats.locations}</p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {inventoryList.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">재고 데이터가 없습니다.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  On Hand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reserved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryList.map((item) => {
                const available = item.on_hand_qty - item.reserved_qty
                return (
                  <tr key={item.inventory_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-medium text-gray-900">{item.sku_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{item.sku_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{item.location_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{item.on_hand_qty}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-orange-600">{item.reserved_qty}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {available}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(item.updated_at_utc)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/inventory/${item.inventory_id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
