import { db } from '@/db'
import { deadstockRisk, skus, lots, regions } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getDeadstockRisk() {
  const result = await db
    .select({
      deadstock_id: deadstockRisk.deadstock_id,
      sku_code: skus.sku_code,
      sku_name: skus.name,
      lot_code: lots.lot_code,
      expiry_date: deadstockRisk.expiry_date,
      days_to_expiry: deadstockRisk.days_to_expiry,
      current_qty: deadstockRisk.current_qty,
      expected_leftover: deadstockRisk.expected_leftover,
      risk_level: deadstockRisk.risk_level,
      suggested_action: deadstockRisk.suggested_action,
      analysis_date: deadstockRisk.analysis_date,
    })
    .from(deadstockRisk)
    .leftJoin(skus, eq(deadstockRisk.sku_id, skus.sku_id))
    .leftJoin(lots, eq(deadstockRisk.lot_id, lots.lot_id))
    .orderBy(deadstockRisk.days_to_expiry)
    .limit(100)
  return result
}

export default async function DeadstockReportPage() {
  const riskData = await getDeadstockRisk()

  const stats = {
    total: riskData.length,
    high: riskData.filter(r => r.risk_level === 'HIGH').length,
    med: riskData.filter(r => r.risk_level === 'MED').length,
    low: riskData.filter(r => r.risk_level === 'LOW').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🗑️ 불용재고 리포트</h1>
          <p className="mt-2 text-gray-600">유통기한 D-150 기준 위험 분석</p>
        </div>
        <Link href="/admin/reports" className="text-gray-600 hover:text-gray-900">
          ← 리포트 목록
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">위험 품목 수</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-sm text-gray-500">HIGH 위험</p>
          <p className="text-2xl font-bold text-red-600">{stats.high}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <p className="text-sm text-gray-500">MED 위험</p>
          <p className="text-2xl font-bold text-orange-600">{stats.med}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">LOW 위험</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.low}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {riskData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">불용재고 위험 데이터가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">유통기한이 관리되는 품목이 있어야 분석됩니다.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">품목명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">로트</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">유통기한</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">잔여일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">현재고</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">예상잔량</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">위험도</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">권장조치</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {riskData.map((item) => (
                <tr key={item.deadstock_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                    {item.sku_code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.sku_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.lot_code || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.expiry_date || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={item.days_to_expiry && item.days_to_expiry <= 30 ? 'text-red-600' : 'text-gray-900'}>
                      {item.days_to_expiry}일
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.current_qty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">{item.expected_leftover?.toFixed(0) || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      item.risk_level === 'HIGH' ? 'bg-red-100 text-red-800' :
                      item.risk_level === 'MED' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.risk_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{item.suggested_action || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
