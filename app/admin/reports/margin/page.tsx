import { db } from '@/db'
import { skuPrices, skus } from '@/db/schema'
import { eq, and, isNull, or, gte, desc } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getMarginAnalysis() {
  const today = new Date().toISOString().split('T')[0]
  
  // Get current prices for each SKU and price type
  const prices = await db
    .select({
      sku_id: skus.sku_id,
      sku_code: skus.sku_code,
      name: skus.name,
      price_type: skuPrices.price_type,
      unit_price: skuPrices.unit_price,
      currency: skuPrices.currency,
    })
    .from(skuPrices)
    .innerJoin(skus, eq(skuPrices.sku_id, skus.sku_id))
    .where(
      and(
        or(isNull(skuPrices.effective_to), gte(skuPrices.effective_to, today))
      )
    )
    .orderBy(skus.sku_code, skuPrices.price_type)

  // Group by SKU and calculate margins
  const skuPriceMap = new Map()
  prices.forEach(p => {
    if (!skuPriceMap.has(p.sku_id)) {
      skuPriceMap.set(p.sku_id, {
        sku_id: p.sku_id,
        sku_code: p.sku_code,
        name: p.name,
        currency: p.currency,
        prices: {}
      })
    }
    skuPriceMap.get(p.sku_id).prices[p.price_type] = p.unit_price
  })

  return Array.from(skuPriceMap.values()).map(sku => {
    const stcCost = sku.prices['STC_COST'] || 0
    const ourCost = sku.prices['OUR_COST'] || 0
    const ourSupply = sku.prices['OUR_SUPPLY'] || 0
    const storePrice = sku.prices['STORE_PRICE'] || 0

    return {
      ...sku,
      stc_cost: stcCost,
      our_cost: ourCost,
      our_supply: ourSupply,
      store_price: storePrice,
      our_margin: ourSupply > 0 ? ((ourSupply - ourCost) / ourSupply * 100) : 0,
      store_margin: storePrice > 0 ? ((storePrice - ourSupply) / storePrice * 100) : 0,
    }
  })
}

export default async function MarginReportPage() {
  const marginData = await getMarginAnalysis()

  const avgOurMargin = marginData.length > 0 
    ? marginData.reduce((sum, m) => sum + m.our_margin, 0) / marginData.length 
    : 0
  const avgStoreMargin = marginData.length > 0 
    ? marginData.reduce((sum, m) => sum + m.store_margin, 0) / marginData.length 
    : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💰 마진 분석</h1>
          <p className="mt-2 text-gray-600">다단계 가격별 마진율 분석</p>
        </div>
        <Link href="/admin/reports" className="text-gray-600 hover:text-gray-900">
          ← 리포트 목록
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">분석 SKU 수</p>
          <p className="text-2xl font-bold text-gray-900">{marginData.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-500">평균 Our 마진</p>
          <p className="text-2xl font-bold text-green-600">{avgOurMargin.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">평균 Store 마진</p>
          <p className="text-2xl font-bold text-blue-600">{avgStoreMargin.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">저마진 품목 (15% 미만)</p>
          <p className="text-2xl font-bold text-purple-600">
            {marginData.filter(m => m.our_margin < 15 && m.our_margin > 0).length}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {marginData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">마진 분석 데이터가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">가격 정보가 등록되어야 마진을 계산할 수 있습니다.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">품목명</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">STC 원가</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Our 원가</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Our 공급가</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Store 판매가</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Our 마진</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Store 마진</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {marginData.map((item) => (
                <tr key={item.sku_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                    {item.sku_code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    ${item.stc_cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    ${item.our_cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    ${item.our_supply.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    ${item.store_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    <span className={item.our_margin < 15 ? 'text-red-600' : 'text-green-600'}>
                      {item.our_margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-600">
                    {item.store_margin.toFixed(1)}%
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
