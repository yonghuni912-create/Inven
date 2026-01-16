import { db } from '@/db'
import { stores, regions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getStores() {
  const result = await db
    .select({
      store_id: stores.store_id,
      store_name: stores.store_name,
      region_name: regions.name,
      city: stores.city,
      province: stores.province,
      store_code: stores.store_code,
      shopify_customer_id: stores.shopify_customer_id,
      active: stores.active,
    })
    .from(stores)
    .leftJoin(regions, eq(stores.region_id, regions.region_id))

  return result
}

export default async function StoresPage() {
  const storesList = await getStores()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">가맹점 관리</h1>
          <p className="mt-2 text-gray-600">가맹점 관리 및 매칭 설정</p>
        </div>
        <Link
          href="/admin/stores/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span>
          <span>새 가맹점</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {storesList.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">등록된 가맹점이 없습니다.</p>
            <Link
              href="/admin/stores/new"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              첫 번째 가맹점 추가하기 →
            </Link>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가맹점명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">리전</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">위치</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매장 코드</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객 ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {storesList.map((store) => (
                <tr key={store.store_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{store.store_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{store.region_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {store.city && store.province ? `${store.city}, ${store.province}` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{store.store_code || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 font-mono">
                      {store.shopify_customer_id ? `#${store.shopify_customer_id}` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {store.active ? (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">활성</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">비활성</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/stores/${store.store_id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      상세
                    </Link>
                    <Link
                      href={`/admin/stores/${store.store_id}/edit`}
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
