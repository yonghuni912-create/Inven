import { db } from '@/db'
import { regions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getRegions() {
  return await db.select().from(regions)
}

export default async function RegionsPage() {
  const regionsList = await getRegions()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">리전 관리</h1>
          <p className="mt-2 text-gray-600">지역별 설정 및 Shopify 연결 관리</p>
        </div>
        <Link
          href="/admin/regions/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span>
          <span>새 리전</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {regionsList.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">지역이 설정되지 않았습니다.</p>
            <Link
              href="/admin/regions/new"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              첫 번째 지역 추가하기 →
            </Link>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">리전명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shopify 스토어</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간대</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">운영일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매칭 방식</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {regionsList.map((region) => (
                <tr key={region.region_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{region.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{region.shop_domain}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{region.timezone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{region.run_days}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {region.store_match_method}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {region.active ? (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">활성</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">비활성</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/regions/${region.region_id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      상세
                    </Link>
                    <Link
                      href={`/admin/regions/${region.region_id}/edit`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      수정
                    </Link>
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
