import { db } from '@/db'
import { inventory, skus, locations, regions } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getInventoryStatus() {
  const result = await db
    .select({
      inventory_id: inventory.inventory_id,
      region_name: regions.name,
      location_name: locations.name,
      location_type: locations.location_type,
      sku_code: skus.sku_code,
      sku_name: skus.name,
      on_hand_qty: inventory.on_hand_qty,
      reserved_qty: inventory.reserved_qty,
      available: sql<number>`${inventory.on_hand_qty} - ${inventory.reserved_qty}`,
      updated_at_utc: inventory.updated_at_utc,
    })
    .from(inventory)
    .leftJoin(skus, eq(inventory.sku_id, skus.sku_id))
    .leftJoin(locations, eq(inventory.location_id, locations.location_id))
    .leftJoin(regions, eq(inventory.region_id, regions.region_id))
    .orderBy(regions.name, locations.name, skus.sku_code)
  return result
}

export default async function InventoryStatusReportPage() {
  const inventoryData = await getInventoryStatus()

  const stats = {
    totalSKUs: new Set(inventoryData.map(i => i.sku_code)).size,
    totalLocations: new Set(inventoryData.map(i => i.location_name)).size,
    totalOnHand: inventoryData.reduce((sum, i) => sum + i.on_hand_qty, 0),
    totalReserved: inventoryData.reduce((sum, i) => sum + i.reserved_qty, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📦 재고 현황</h1>
          <p className="mt-2 text-gray-600">위치별 SKU 재고 상세 현황</p>
        </div>
        <Link href="/admin/reports" className="text-gray-600 hover:text-gray-900">
          ← 리포트 목록
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">보유 SKU 수</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalSKUs}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">창고/위치 수</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalLocations}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">총 보유량</p>
          <p className="text-2xl font-bold text-green-600">{stats.totalOnHand.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">예약 수량</p>
          <p className="text-2xl font-bold text-orange-600">{stats.totalReserved.toLocaleString()}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {inventoryData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">재고 데이터가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">재고 입고 후 현황이 표시됩니다.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">지역</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">위치</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">품목명</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">보유량</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">예약</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">가용</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">갱신일시</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryData.map((item) => (
                <tr key={item.inventory_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.region_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.location_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      item.location_type === 'STC_WAREHOUSE' ? 'bg-blue-100 text-blue-800' :
                      item.location_type === 'OUR_WAREHOUSE' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{item.location_type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">{item.sku_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.sku_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">{item.on_hand_qty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">{item.reserved_qty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{item.available}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.updated_at_utc).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
