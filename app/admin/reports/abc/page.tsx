import { db } from '@/db'
import { abcClassification, skus, regions } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getABCAnalysis() {
  const result = await db
    .select({
      abc_id: abcClassification.abc_id,
      region_name: regions.name,
      sku_code: skus.sku_code,
      sku_name: skus.name,
      analysis_date: abcClassification.analysis_date,
      prev_grade: abcClassification.prev_grade,
      new_grade: abcClassification.new_grade,
      total_qty: abcClassification.total_qty,
      total_value: abcClassification.total_value,
      cumulative_pct: abcClassification.cumulative_pct,
    })
    .from(abcClassification)
    .leftJoin(skus, eq(abcClassification.sku_id, skus.sku_id))
    .leftJoin(regions, eq(abcClassification.region_id, regions.region_id))
    .orderBy(desc(abcClassification.analysis_date), abcClassification.cumulative_pct)
    .limit(200)
  return result
}

export default async function ABCReportPage() {
  const abcData = await getABCAnalysis()

  const stats = {
    total: abcData.length,
    gradeA: abcData.filter(a => a.new_grade === 'A').length,
    gradeB: abcData.filter(a => a.new_grade === 'B').length,
    gradeC: abcData.filter(a => a.new_grade === 'C').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 ABC 분석</h1>
          <p className="mt-2 text-gray-600">파레토 법칙 기반 SKU 등급 분류</p>
        </div>
        <Link href="/admin/reports" className="text-gray-600 hover:text-gray-900">
          ← 리포트 목록
        </Link>
      </div>

      {/* Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900">ABC 분류 기준</h3>
        <ul className="mt-2 text-sm text-blue-800 space-y-1">
          <li><span className="font-semibold">A등급:</span> 매출 상위 70% (주요 품목 - 집중 관리)</li>
          <li><span className="font-semibold">B등급:</span> 매출 70-90% (중간 품목 - 일반 관리)</li>
          <li><span className="font-semibold">C등급:</span> 매출 하위 10% (저회전 품목 - 최소 재고)</li>
        </ul>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">분석 SKU 수</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">A등급 (상위 20%)</p>
          <p className="text-2xl font-bold text-purple-600">{stats.gradeA}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">B등급 (중위 30%)</p>
          <p className="text-2xl font-bold text-blue-600">{stats.gradeB}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
          <p className="text-sm text-gray-500">C등급 (하위 50%)</p>
          <p className="text-2xl font-bold text-gray-600">{stats.gradeC}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {abcData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">ABC 분석 데이터가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">Daily Analytics 작업이 실행되면 ABC 분류가 갱신됩니다.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">분석일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">지역</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">품목명</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">판매량</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">매출액</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">누적 %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이전등급</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">현재등급</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {abcData.map((item) => (
                <tr key={item.abc_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.analysis_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.region_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">{item.sku_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.sku_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.total_qty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${item.total_value?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{((item.cumulative_pct || 0) * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.prev_grade && (
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        item.prev_grade === 'A' ? 'bg-purple-100 text-purple-800' :
                        item.prev_grade === 'B' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{item.prev_grade}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      item.new_grade === 'A' ? 'bg-purple-100 text-purple-800' :
                      item.new_grade === 'B' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{item.new_grade}</span>
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
