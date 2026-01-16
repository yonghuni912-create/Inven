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
      analysis_date: emergencyKpiDaily.analysis_date,
      total_orders: emergencyKpiDaily.total_orders,
      emergency_count: emergencyKpiDaily.emergency_count,
      emergency_rate: emergencyKpiDaily.emergency_rate,
      target_rate: emergencyKpiDaily.target_rate,
      achieved: emergencyKpiDaily.achieved,
    })
    .from(emergencyKpiDaily)
    .leftJoin(regions, eq(emergencyKpiDaily.region_id, regions.region_id))
    .orderBy(desc(emergencyKpiDaily.analysis_date))
    .limit(100)
  return result
}

export default async function EmergencyReportPage() {
  const kpiData = await getEmergencyKPI()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">⚠️ 긴급발주 리포트</h1>
          <p className="mt-2 text-gray-600">Emergency Order KPI 분석</p>
        </div>
        <Link href="/admin/reports" className="text-gray-600 hover:text-gray-900">
          ← 리포트 목록
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">총 분석 일수</p>
          <p className="text-2xl font-bold text-gray-900">{kpiData.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">평균 긴급발주율</p>
          <p className="text-2xl font-bold text-orange-600">
            {kpiData.length > 0 
              ? (kpiData.reduce((sum, k) => sum + (k.emergency_rate || 0), 0) / kpiData.length * 100).toFixed(1)
              : 0}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">목표 달성일</p>
          <p className="text-2xl font-bold text-green-600">
            {kpiData.filter(k => k.achieved).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">목표 미달성일</p>
          <p className="text-2xl font-bold text-red-600">
            {kpiData.filter(k => !k.achieved).length}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {kpiData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">긴급발주 KPI 데이터가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">Daily Analytics 작업 실행 후 데이터가 생성됩니다.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">지역</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">전체 주문</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">긴급 발주</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">긴급발주율</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">목표</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">달성</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {kpiData.map((kpi) => (
                <tr key={kpi.kpi_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {kpi.analysis_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {kpi.region_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {kpi.total_orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                    {kpi.emergency_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${(kpi.emergency_rate || 0) > (kpi.target_rate || 0.15) ? 'text-red-600' : 'text-green-600'}`}>
                      {((kpi.emergency_rate || 0) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {((kpi.target_rate || 0.15) * 100).toFixed(0)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {kpi.achieved ? (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">달성</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">미달</span>
                    )}
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
