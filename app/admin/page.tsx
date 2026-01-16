import { db } from '@/db'
import { regions, orders, inventory, jobRuns } from '@/db/schema'
import { sql, desc, eq } from 'drizzle-orm'

async function getDashboardData() {
  // Get active regions
  const activeRegions = await db
    .select()
    .from(regions)
    .where(eq(regions.active, true))

  // Get recent orders count
  const orderStats = await db
    .select({
      total: sql<number>`COUNT(*)`,
      today: sql<number>`COUNT(CASE WHEN DATE(${orders.order_date_at_utc}) = DATE('now') THEN 1 END)`,
      emergency: sql<number>`COUNT(CASE WHEN ${orders.order_type} = 'EMERGENCY' THEN 1 END)`,
    })
    .from(orders)

  // Get recent job runs
  const recentJobs = await db
    .select()
    .from(jobRuns)
    .orderBy(desc(jobRuns.ran_at_utc))
    .limit(10)

  return {
    regions: activeRegions,
    orderStats: orderStats[0] || { total: 0, today: 0, emergency: 0 },
    recentJobs,
  }
}

export default async function AdminDashboard() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">멀티지역 재고/발주/가격 통합 운영 시스템</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Regions</p>
              <p className="text-3xl font-bold text-primary-600">{data.regions.length}</p>
            </div>
            <div className="text-4xl">🌍</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{data.orderStats.total}</p>
            </div>
            <div className="text-4xl">🛒</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Orders</p>
              <p className="text-3xl font-bold text-green-600">{data.orderStats.today}</p>
            </div>
            <div className="text-4xl">📈</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Emergency Orders</p>
              <p className="text-3xl font-bold text-orange-600">{data.orderStats.emergency}</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Regions Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Regions</h2>
        </div>
        <div className="p-6">
          {data.regions.length === 0 ? (
            <p className="text-gray-500">No regions configured yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.regions.map((region) => (
                <div key={region.region_id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900">{region.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{region.shop_domain}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {region.timezone}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {region.store_match_method}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Jobs</h2>
        </div>
        <div className="p-6">
          {data.recentJobs.length === 0 ? (
            <p className="text-gray-500">No jobs run yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentJobs.map((job) => (
                <div key={job.job_run_id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <p className="font-medium text-gray-900">{job.job_name}</p>
                    <p className="text-sm text-gray-500">{job.run_date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      job.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                      job.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {job.status}
                    </span>
                    {job.duration_ms && (
                      <span className="text-xs text-gray-500">{job.duration_ms}ms</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
