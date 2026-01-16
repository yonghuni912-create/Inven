import { db } from '@/db'
import { orders, stores, regions, orderLines } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getOrders() {
  const result = await db
    .select({
      order_id: orders.order_id,
      order_number: orders.order_number,
      order_date_at_utc: orders.order_date_at_utc,
      order_type: orders.order_type,
      store_name: stores.store_name,
      region_name: regions.name,
      total_amount: orders.total_amount,
      currency: orders.currency,
      status: orders.status,
      line_count: sql<number>`(SELECT COUNT(*) FROM ${orderLines} WHERE ${orderLines.order_id} = ${orders.order_id})`,
    })
    .from(orders)
    .leftJoin(stores, eq(orders.store_id, stores.store_id))
    .leftJoin(regions, eq(orders.region_id, regions.region_id))
    .orderBy(desc(orders.order_date_at_utc))
    .limit(100)

  return result
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function OrdersPage() {
  const ordersList = await getOrders()

  const stats = {
    total: ordersList.length,
    emergency: ordersList.filter(o => o.order_type === 'EMERGENCY').length,
    extra: ordersList.filter(o => o.order_type === 'EXTRA').length,
    unmatched: ordersList.filter(o => !o.store_name).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">주문 관리</h1>
          <p className="mt-2 text-gray-600">주문 관리 및 매장 매칭</p>
        </div>
        <Link
          href="/admin/orders/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span>
          <span>새 주문</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">전체 주문</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">긴급 주문</p>
          <p className="text-2xl font-bold text-orange-600">{stats.emergency}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">추가 주문</p>
          <p className="text-2xl font-bold text-blue-600">{stats.extra}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">미매칭</p>
          <p className="text-2xl font-bold text-red-600">{stats.unmatched}</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {ordersList.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">주문이 없습니다.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주문번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가맹점</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">리전</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">품목수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordersList.map((order) => (
                <tr key={order.order_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(order.order_date_at_utc)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.store_name || <span className="text-red-600">미매칭</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{order.region_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      order.order_type === 'REGULAR' ? 'bg-green-100 text-green-800' :
                      order.order_type === 'EMERGENCY' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.order_type === 'REGULAR' ? '정규' : order.order_type === 'EMERGENCY' ? '긴급' : '추가'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{order.line_count}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.currency} {order.total_amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      order.status === 'FULFILLED' ? 'bg-green-100 text-green-800' :
                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status === 'FULFILLED' ? '완료' : order.status === 'CANCELLED' ? '취소' : '대기'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/orders/${order.order_id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      상세
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
