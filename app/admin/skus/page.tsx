import { db } from '@/db'
import { skus } from '@/db/schema'
import Link from 'next/link'

async function getSKUs() {
  return await db
    .select()
    .from(skus)
    .orderBy(skus.sku_code)
}

export default async function SKUsPage() {
  const skuList = await getSKUs()

  const stats = {
    total: skuList.length,
    active: skuList.filter(s => s.active).length,
    expiryManaged: skuList.filter(s => s.expiry_managed).length,
    gradeA: skuList.filter(s => s.abc_grade === 'A').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SKUs / Products</h1>
          <p className="mt-2 text-gray-600">품목 마스터 및 재고 정책 관리</p>
        </div>
        <Link
          href="/admin/skus/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          + New SKU
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total SKUs</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Expiry Managed</p>
          <p className="text-2xl font-bold text-blue-600">{stats.expiryManaged}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Grade A</p>
          <p className="text-2xl font-bold text-purple-600">{stats.gradeA}</p>
        </div>
      </div>

      {/* SKU Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {skuList.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">등록된 SKU가 없습니다.</p>
            <Link
              href="/admin/skus/new"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              첫 번째 SKU 추가하기 →
            </Link>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pack Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MOQ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Safety Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ABC Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry
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
              {skuList.map((sku) => (
                <tr key={sku.sku_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono font-medium text-gray-900">{sku.sku_code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{sku.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{sku.pack_size}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{sku.moq}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{sku.lead_time_days}d</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{sku.safety_stock_days}d</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sku.abc_grade ? (
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        sku.abc_grade === 'A' ? 'bg-purple-100 text-purple-800' :
                        sku.abc_grade === 'B' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {sku.abc_grade}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sku.expiry_managed ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-300">✗</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sku.active ? (
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
                      href={`/admin/skus/${sku.sku_id}`}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/skus/${sku.sku_id}/edit`}
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
