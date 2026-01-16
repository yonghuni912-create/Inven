import { db } from '@/db'
import { routes, regions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

async function getRoutes() {
  const result = await db
    .select({
      route_id: routes.route_id,
      route_name: routes.name,
      region_name: regions.name,
      active_days: routes.active_days,
      cutoff_time: routes.cutoff_time,
      active: routes.active,
    })
    .from(routes)
    .leftJoin(regions, eq(routes.region_id, regions.region_id))

  return result
}

export default async function RoutesPage() {
  const routesList = await getRoutes()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Routes / 배송 코스</h1>
          <p className="mt-2 text-gray-600">배송 그룹 및 스케줄 관리</p>
        </div>
        <Link
          href="/admin/routes/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          + New Route
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {routesList.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">등록된 배송 코스가 없습니다.</p>
            <Link
              href="/admin/routes/new"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              첫 번째 배송 코스 추가하기 →
            </Link>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cutoff Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routesList.map((route) => (
                <tr key={route.route_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{route.route_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{route.region_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{route.active_days}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{route.cutoff_time || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {route.active ? (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/routes/${route.route_id}`}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/routes/${route.route_id}/edit`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Edit
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
