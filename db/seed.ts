/**
 * Database Seed Script
 * Run with: npx tsx db/seed.ts
 */

import { db } from './index'
import { 
  regions, 
  stores, 
  routes, 
  storeRoutes, 
  skus, 
  skuPrices, 
  locations, 
  inventory, 
  lots, 
  orders, 
  orderLines 
} from './schema'
import { encrypt } from '../lib/encryption'

async function seed() {
  console.log('🌱 시드 데이터 생성 시작...')

  // 1. Regions
  console.log('📍 지역 생성...')
  const [vancouver] = await db.insert(regions).values({
    name: 'Vancouver',
    timezone: 'America/Vancouver',
    run_days: 'Mon,Tue,Wed,Thu,Fri',
    analytics_time: '06:00',
    docs_time: '07:00',
    shop_domain: 'demo-store.myshopify.com',
    admin_token_enc: encrypt('shpat_demo_token_123'),
    webhook_secret_enc: encrypt('whsec_demo_secret_456'),
    store_match_method: 'CUSTOMER',
    active: true,
  }).returning()

  const [korea] = await db.insert(regions).values({
    name: 'Korea',
    timezone: 'Asia/Seoul',
    run_days: 'Mon,Wed,Fri',
    analytics_time: '09:00',
    docs_time: '10:00',
    shop_domain: 'korea-store.myshopify.com',
    admin_token_enc: encrypt('shpat_kr_token_789'),
    webhook_secret_enc: encrypt('whsec_kr_secret_012'),
    store_match_method: 'TAG',
    active: true,
  }).returning()

  // 2. Locations (Warehouses)
  console.log('🏭 창고 생성...')
  const [vanWarehouse] = await db.insert(locations).values({
    region_id: vancouver.region_id,
    name: 'Vancouver Main Warehouse',
    location_type: 'OUR_WAREHOUSE',
    address: '123 Main St, Vancouver, BC',
    active: true,
  }).returning()

  const [stcWarehouse] = await db.insert(locations).values({
    region_id: vancouver.region_id,
    name: 'STC Vancouver',
    location_type: 'STC_WAREHOUSE',
    address: '456 STC Road, Vancouver, BC',
    active: true,
  }).returning()

  const [krWarehouse] = await db.insert(locations).values({
    region_id: korea.region_id,
    name: 'Seoul Distribution Center',
    location_type: 'OUR_WAREHOUSE',
    address: '서울시 강남구 테헤란로 123',
    active: true,
  }).returning()

  // 3. Stores
  console.log('🏪 가맹점 생성...')
  const [store1] = await db.insert(stores).values({
    region_id: vancouver.region_id,
    store_name: 'Downtown Vancouver Store',
    city: 'Vancouver',
    province: 'BC',
    postal_code: 'V6B 1A1',
    country: 'Canada',
    shopify_customer_id: '1234567890',
    store_code: 'VAN001',
    active: true,
  }).returning()

  const [store2] = await db.insert(stores).values({
    region_id: vancouver.region_id,
    store_name: 'Richmond Store',
    city: 'Richmond',
    province: 'BC',
    postal_code: 'V6X 1A2',
    country: 'Canada',
    shopify_customer_id: '1234567891',
    store_code: 'VAN002',
    active: true,
  }).returning()

  const [store3] = await db.insert(stores).values({
    region_id: korea.region_id,
    store_name: '강남점',
    city: 'Seoul',
    province: 'Gangnam',
    postal_code: '06123',
    country: 'Korea',
    store_code: 'KR001',
    active: true,
  }).returning()

  // 4. Routes
  console.log('🚚 배송 코스 생성...')
  const [routeA] = await db.insert(routes).values({
    region_id: vancouver.region_id,
    name: 'A 코스',
    active_days: 'Mon,Wed,Fri',
    cutoff_time: '14:00',
    active: true,
  }).returning()

  const [routeB] = await db.insert(routes).values({
    region_id: vancouver.region_id,
    name: 'B 코스',
    active_days: 'Tue,Thu',
    cutoff_time: '14:00',
    active: true,
  }).returning()

  // 5. Store-Route Mapping
  await db.insert(storeRoutes).values([
    { store_id: store1.store_id, route_id: routeA.route_id, effective_from: '2024-01-01' },
    { store_id: store2.store_id, route_id: routeB.route_id, effective_from: '2024-01-01' },
  ])

  // 6. SKUs
  console.log('📦 SKU 생성...')
  const skuData = [
    { sku_code: 'PRD-001', name: 'Premium Coffee Beans 1kg', pack_size: 12, moq: 24, lead_time_days: 7, safety_stock_days: 14, abc_grade: 'A', expiry_managed: true },
    { sku_code: 'PRD-002', name: 'Organic Green Tea 500g', pack_size: 24, moq: 48, lead_time_days: 5, safety_stock_days: 10, abc_grade: 'A', expiry_managed: true },
    { sku_code: 'PRD-003', name: 'Honey 350ml', pack_size: 12, moq: 12, lead_time_days: 3, safety_stock_days: 7, abc_grade: 'B', expiry_managed: true },
    { sku_code: 'PRD-004', name: 'Almond Milk 1L', pack_size: 6, moq: 12, lead_time_days: 5, safety_stock_days: 7, abc_grade: 'A', expiry_managed: true },
    { sku_code: 'PRD-005', name: 'Vanilla Syrup 750ml', pack_size: 12, moq: 12, lead_time_days: 7, safety_stock_days: 14, abc_grade: 'B', expiry_managed: false },
    { sku_code: 'PRD-006', name: 'Chocolate Powder 1kg', pack_size: 12, moq: 24, lead_time_days: 10, safety_stock_days: 21, abc_grade: 'B', expiry_managed: true },
    { sku_code: 'PRD-007', name: 'Paper Cups 500pcs', pack_size: 1, moq: 10, lead_time_days: 3, safety_stock_days: 7, abc_grade: 'C', expiry_managed: false },
    { sku_code: 'PRD-008', name: 'Napkins 1000pcs', pack_size: 1, moq: 5, lead_time_days: 3, safety_stock_days: 7, abc_grade: 'C', expiry_managed: false },
  ]

  const insertedSKUs = await db.insert(skus).values(skuData.map(s => ({ ...s, active: true }))).returning()

  // 7. SKU Prices
  console.log('💰 가격 정보 생성...')
  const priceData = insertedSKUs.flatMap(sku => [
    { sku_id: sku.sku_id, price_type: 'STC_COST', currency: 'CAD', unit_price: Math.random() * 10 + 5, effective_from: '2024-01-01' },
    { sku_id: sku.sku_id, price_type: 'OUR_COST', currency: 'CAD', unit_price: Math.random() * 12 + 8, effective_from: '2024-01-01' },
    { sku_id: sku.sku_id, price_type: 'OUR_SUPPLY', currency: 'CAD', unit_price: Math.random() * 15 + 12, effective_from: '2024-01-01' },
    { sku_id: sku.sku_id, price_type: 'STORE_PRICE', currency: 'CAD', unit_price: Math.random() * 20 + 18, effective_from: '2024-01-01' },
  ])
  await db.insert(skuPrices).values(priceData)

  // 8. Inventory
  console.log('📋 재고 생성...')
  const inventoryData = insertedSKUs.map(sku => ({
    region_id: vancouver.region_id,
    location_id: vanWarehouse.location_id,
    sku_id: sku.sku_id,
    on_hand_qty: Math.floor(Math.random() * 200) + 50,
    reserved_qty: Math.floor(Math.random() * 20),
  }))
  await db.insert(inventory).values(inventoryData)

  // 9. Lots (for expiry-managed items)
  console.log('📅 로트 생성...')
  const expiryManagedSKUs = insertedSKUs.filter(s => skuData.find(d => d.sku_code === s.sku_code)?.expiry_managed)
  const lotData = expiryManagedSKUs.map((sku, i) => ({
    region_id: vancouver.region_id,
    location_id: vanWarehouse.location_id,
    sku_id: sku.sku_id,
    lot_code: `LOT-2024-${String(i + 1).padStart(3, '0')}`,
    expiry_date: new Date(Date.now() + (Math.random() * 180 + 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    qty: Math.floor(Math.random() * 100) + 20,
    lot_status: 'AVAILABLE',
  }))
  await db.insert(lots).values(lotData)

  // 10. Sample Orders
  console.log('🛒 샘플 주문 생성...')
  const orderTypes = ['REGULAR', 'REGULAR', 'REGULAR', 'EMERGENCY', 'EXTRA']
  for (let i = 0; i < 15; i++) {
    const orderDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    const [order] = await db.insert(orders).values({
      region_id: vancouver.region_id,
      store_id: i % 2 === 0 ? store1.store_id : store2.store_id,
      shopify_order_id: `DEMO-${Date.now()}-${i}`,
      shopify_order_number: `#${1000 + i}`,
      order_date_at_utc: orderDate.toISOString(),
      order_type: orderTypes[Math.floor(Math.random() * orderTypes.length)],
      status: 'CONFIRMED',
      total_amount: 0,
      currency: 'CAD',
    }).returning()

    // Order lines
    const lineCount = Math.floor(Math.random() * 4) + 1
    let totalAmount = 0
    for (let j = 0; j < lineCount; j++) {
      const sku = insertedSKUs[Math.floor(Math.random() * insertedSKUs.length)]
      const qty = Math.floor(Math.random() * 10) + 1
      const unitPrice = Math.random() * 15 + 10
      totalAmount += qty * unitPrice

      await db.insert(orderLines).values({
        order_id: order.order_id,
        sku_id: sku.sku_id,
        sku_code_snapshot: sku.sku_code,
        name_snapshot: sku.name,
        qty,
        unit_price_snapshot: unitPrice,
        unit_cost_snapshot: unitPrice * 0.6,
      })
    }

    await db.update(orders).set({ total_amount: totalAmount }).where(eq(orders.order_id, order.order_id))
  }

  console.log('✅ 시드 데이터 생성 완료!')
  console.log(`   - 지역: 2개`)
  console.log(`   - 창고: 3개`)
  console.log(`   - 가맹점: 3개`)
  console.log(`   - 배송코스: 2개`)
  console.log(`   - SKU: ${insertedSKUs.length}개`)
  console.log(`   - 가격: ${priceData.length}개`)
  console.log(`   - 재고: ${inventoryData.length}개`)
  console.log(`   - 로트: ${lotData.length}개`)
  console.log(`   - 주문: 15개`)
}

import { eq } from 'drizzle-orm'

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 시드 오류:', err)
    process.exit(1)
  })
