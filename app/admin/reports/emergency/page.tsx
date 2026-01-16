import { db } from '@/db'
import { emergencyKpiDaily, regions } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getEmergencyKPI() {
  const result = await db
    .select({
      kpi_id: emergencyKpiDaily.kpi_id,
      region_name: regions.name,
      kpi_date: emergencyKpiDaily.kpi_date,
      total_orders: emergencyKpiDaily.total_orders,
      emergency_orders: emergencyKpiDaily.emergency_orders,
      extra_orders: emergencyKpiDaily.extra_orders,
      regular_orders: emergencyKpiDaily.regular_orders,
      emergency_rate: emergencyKpiDaily.emergency_rate,
    })
    .from(emergencyKpiDaily)
    .leftJoin(regions, eq(emergencyKpiDaily.region_id, regions.region_id))
    .orderBy(desc(emergencyKpiDaily.kpi_date))
    .limit(100)
  return result
}

export default async function EmergencyReportPage() {
  const kpiData = await getEmergencyKPI()

  const targetRate = 0.1 // 10% target
  const stats = {
    total: kpiData.length,
    achieved: kpiData.filter(k => (k.emergency_rate || 0) <= targetRate).length,
    avgRate: kpiData.length > 0 
      ? (kpiData.reduce((sum, k) => sum + (k.emergency_rate || 0), 0) / kpiData.length * 100).toFixed(1)
      : 0,
    totalEmergency: kpiData.reduce((sum, k) => sum + (k.emergency_orders || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">⚠️ 긴급발주 리포트</h1>
          <p className="mt-2 text-gray-600">Emergency Order KPI 분석 (목표: 10% 이하)</p>
        </div>
        <Link href="/admin/reports" className="text-blue-600 hover:text-blue-700">
          ← 리포트 목록
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">분석 일수</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-500">목표 달성일</p>
          <p className="text-2xl font-bold text-green-600">{stats.achieved}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <p className="text-sm text-gray-500">평균 긴급발주율</p>
          <p className="text-2xl font-bold text-orange-600">{stats.avgRate}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-sm text-gray-500">총 긴급발주</p>
          <p className="text-2xl font-bold text-red-600">{stats.totalEmergency}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {kpiData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">긴급발주 KPI 데이터가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">주문 데이터가 수집되면 자동으로 분석됩니다.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">리전</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">전체 주문</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">정규</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">추가</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">긴급</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">긴급발주율</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">달성</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {kpiData.map((item) => {
                const rate = item.emergency_rate || 0
                const achieved = rate <= targetRate
                return (
                  <tr key={item.kpi_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.kpi_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.region_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.total_orders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">{item.regular_orders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">{item.extra_orders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">{item.emergency_orders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span className={rate > targetRate ? 'text-red-600' : 'text-green-600'}>
                        {(rate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {achieved ? (
                        <span className="text-green-600 text-lg">✓</span>
                      ) : (
                        <span className="text-red-600 text-lg">✗</span>
                      )}
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
