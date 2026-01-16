import { db } from '@/db'
import { replenishmentRecommendations, skus, regions } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getReplenishmentRecommendations() {
  const result = await db
    .select({
      recommendation_id: replenishmentRecommendations.recommendation_id,
      region_name: regions.name,
      sku_code: skus.sku_code,
      sku_name: skus.name,
      recommendation_date: replenishmentRecommendations.recommendation_date,
      on_hand_qty: replenishmentRecommendations.on_hand_qty,
      daily_rate: replenishmentRecommendations.daily_rate,
      rop: replenishmentRecommendations.rop,
      recommended_qty: replenishmentRecommendations.recommended_qty,
      adjusted_qty: replenishmentRecommendations.adjusted_qty,
      priority: replenishmentRecommendations.priority,
    })
    .from(replenishmentRecommendations)
    .leftJoin(skus, eq(replenishmentRecommendations.sku_id, skus.sku_id))
    .leftJoin(regions, eq(replenishmentRecommendations.region_id, regions.region_id))
    .orderBy(desc(replenishmentRecommendations.recommendation_date), replenishmentRecommendations.priority)
    .limit(200)
  return result
}

export default async function ReplenishmentReportPage() {
  const recommendations = await getReplenishmentRecommendations()

  const stats = {
    total: recommendations.length,
    high: recommendations.filter(r => r.priority === 'HIGH').length,
    medium: recommendations.filter(r => r.priority === 'MEDIUM').length,
    low: recommendations.filter(r => r.priority === 'LOW').length,
    totalQty: recommendations.reduce((sum, r) => sum + (r.adjusted_qty || r.recommended_qty || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📈 발주 추천</h1>
          <p className="mt-2 text-gray-600">ROP 기반 자동 발주 추천</p>
        </div>
        <Link href="/admin/reports" className="text-gray-600 hover:text-gray-900">
          ← 리포트 목록
        </Link>
      </div>

      {/* Explanation */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900">발주 추천 기준</h3>
        <ul className="mt-2 text-sm text-green-800 space-y-1">
          <li><span className="font-semibold">ROP (Reorder Point):</span> Lead Time × Daily Rate + Safety Stock</li>
          <li><span className="font-semibold">추천 수량:</span> (ROP - 현재고) × 1.5 → MOQ/Pack 조정</li>
          <li><span className="font-semibold">HIGH:</span> 현재고 &lt; ROP, <span className="font-semibold">MEDIUM:</span> ROP-30% &lt; 현재고, <span className="font-semibold">LOW:</span> 그 외</li>
        </ul>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">발주 대상 SKU</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-sm text-gray-500">HIGH 우선</p>
          <p className="text-2xl font-bold text-red-600">{stats.high}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <p className="text-sm text-gray-500">MEDIUM 우선</p>
          <p className="text-2xl font-bold text-orange-600">{stats.medium}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-500">LOW 우선</p>
          <p className="text-2xl font-bold text-green-600">{stats.low}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">총 추천 수량</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalQty.toLocaleString()}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {recommendations.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">발주 추천 데이터가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">Daily Analytics 실행 후 발주 추천이 생성됩니다.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">지역</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">품목명</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">현재고</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">일소비율</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ROP</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">추천량</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">조정량</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">우선순위</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recommendations.map((item) => (
                <tr key={item.recommendation_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.recommendation_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.region_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">{item.sku_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.sku_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.on_hand_qty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{item.daily_rate?.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">{item.rop}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.recommended_qty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-600">{item.adjusted_qty || item.recommended_qty}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      item.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                      item.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>{item.priority}</span>
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
