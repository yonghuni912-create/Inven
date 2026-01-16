import { db } from '@/db'
import { abcClassification, skus, regions } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getAbcData() {
  const result = await db
    .select({
      abc_id: abcClassification.abc_id,
      sku_code: skus.sku_code,
      sku_name: skus.name,
      region_name: regions.name,
      analysis_date: abcClassification.analysis_date,
      abc_grade: abcClassification.abc_grade,
      revenue_contribution: abcClassification.revenue_contribution,
      volume_contribution: abcClassification.volume_contribution,
      calculated_at_utc: abcClassification.calculated_at_utc,
    })
    .from(abcClassification)
    .innerJoin(skus, eq(abcClassification.sku_id, skus.sku_id))
    .innerJoin(regions, eq(abcClassification.region_id, regions.region_id))
    .orderBy(desc(abcClassification.analysis_date))
    .limit(100)

  return result
}

export default async function AbcReportPage() {
  const data = await getAbcData()

  const stats = {
    total: data.length,
    gradeA: data.filter(d => d.abc_grade === 'A').length,
    gradeB: data.filter(d => d.abc_grade === 'B').length,
    gradeC: data.filter(d => d.abc_grade === 'C').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ABC 분류 리포트</h1>
          <p className="mt-2 text-gray-600">품목별 ABC 등급 분석 (파레토 원칙)</p>
        </div>
        <Link
          href="/admin/reports"
          className="text-blue-600 hover:text-blue-700"
        >
          ← 리포트 목록
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">전체 품목</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">A등급 (상위 20%)</p>
          <p className="text-2xl font-bold text-purple-600">{stats.gradeA}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">B등급 (중위 30%)</p>
          <p className="text-2xl font-bold text-blue-600">{stats.gradeB}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">C등급 (하위 50%)</p>
          <p className="text-2xl font-bold text-gray-600">{stats.gradeC}</p>
        </div>
      </div>

      {/* ABC Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ABC 분류 기준</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><span className="font-bold">A등급:</span> 매출 기여도 상위 20% - 집중 관리 대상</li>
          <li><span className="font-bold">B등급:</span> 매출 기여도 중위 30% - 정규 관리</li>
          <li><span className="font-bold">C등급:</span> 매출 기여도 하위 50% - 효율화 검토</li>
        </ul>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {data.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">ABC 분류 데이터가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">분석 작업을 실행해 주세요.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU 코드</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">품목명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">리전</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">분석일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ABC 등급</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매출 기여도</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">물량 기여도</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.abc_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono font-medium text-gray-900">{item.sku_code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{item.sku_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.region_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.analysis_date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-sm font-bold rounded ${
                      item.abc_grade === 'A' ? 'bg-purple-100 text-purple-800' :
                      item.abc_grade === 'B' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.abc_grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.revenue_contribution ? `${(item.revenue_contribution * 100).toFixed(1)}%` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.volume_contribution ? `${(item.volume_contribution * 100).toFixed(1)}%` : '-'}
                    </div>
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
