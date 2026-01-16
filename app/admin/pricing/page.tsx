import { db } from '@/db'
import { skuPrices, skus } from '@/db/schema'
import { eq, desc, isNull, or, gte } from 'drizzle-orm'
import Link from 'next/link'

async function getPrices() {
  const result = await db
    .select({
      sku_price_id: skuPrices.sku_price_id,
      sku_code: skus.sku_code,
      sku_name: skus.name,
      price_type: skuPrices.price_type,
      currency: skuPrices.currency,
      unit_price: skuPrices.unit_price,
      effective_from: skuPrices.effective_from,
      effective_to: skuPrices.effective_to,
    })
    .from(skuPrices)
    .innerJoin(skus, eq(skuPrices.sku_id, skus.sku_id))
    .orderBy(desc(skuPrices.effective_from))
    .limit(100)

  return result
}

export default async function PricingPage() {
  const prices = await getPrices()

  const priceTypes = ['STC_COST', 'OUR_COST', 'OUR_SUPPLY', 'STORE_PRICE', 'KR_COST']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pricing</h1>
          <p className="mt-2 text-gray-600">다단계 가격 관리 및 마진 분석</p>
        </div>
        <Link
          href="/admin/pricing/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          + Add Price
        </Link>
      </div>

      {/* Price Type Legend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Price Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {priceTypes.map(type => (
            <div key={type} className="border border-gray-200 rounded p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{type}</p>
              <p className="text-sm text-gray-700 mt-1">
                {type === 'STC_COST' && 'STC → Our 구매가'}
                {type === 'OUR_COST' && 'Our 원가'}
                {type === 'OUR_SUPPLY' && 'Our → Store 공급가'}
                {type === 'STORE_PRICE' && 'Store 판매가'}
                {type === 'KR_COST' && 'Korea 본사 원가'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {prices.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">등록된 가격 정보가 없습니다.</p>
            <Link
              href="/admin/pricing/new"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              첫 번째 가격 추가하기 →
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
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Effective From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Effective To
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prices.map((price) => {
                const isActive = !price.effective_to || new Date(price.effective_to) >= new Date()
                return (
                  <tr key={price.sku_price_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-medium text-gray-900">{price.sku_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{price.sku_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        price.price_type === 'STC_COST' ? 'bg-blue-100 text-blue-800' :
                        price.price_type === 'OUR_COST' ? 'bg-purple-100 text-purple-800' :
                        price.price_type === 'OUR_SUPPLY' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {price.price_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {price.currency} {price.unit_price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{price.effective_from}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {price.effective_to || (
                          <span className="text-green-600 font-medium">Current</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/pricing/${price.sku_price_id}/edit`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </Link>
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
