import { sqliteTable, text, integer, real, index, unique, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================
// 1. REGIONS - 멀티지역/타임존/스케줄
// ============================================
export const regions = sqliteTable('regions', {
  region_id: integer('region_id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  timezone: text('timezone').notNull(), // IANA timezone
  run_days: text('run_days').notNull(), // Mon,Tue,Wed format
  analytics_time: text('analytics_time').notNull(), // HH:MM
  docs_time: text('docs_time').notNull(), // HH:MM
  slack_webhook_url: text('slack_webhook_url'),
  shop_domain: text('shop_domain').notNull(),
  admin_token_enc: text('admin_token_enc').notNull(),
  webhook_secret_enc: text('webhook_secret_enc').notNull(),
  shopify_location_id: text('shopify_location_id'),
  store_match_method: text('store_match_method').notNull().default('CUSTOMER'), // CUSTOMER/ADDRESS/TAG
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  created_at_utc: text('created_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at_utc: text('updated_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  shopDomainIdx: index('regions_shop_domain_idx').on(table.shop_domain),
}));

// ============================================
// 2. JOB_RUNS - 배치 작업 실행 로그
// ============================================
export const jobRuns = sqliteTable('job_runs', {
  job_run_id: integer('job_run_id').primaryKey({ autoIncrement: true }),
  job_name: text('job_name').notNull(), // SYNC_SHOPIFY_ORDERS, DAILY_ANALYTICS, etc
  region_id: integer('region_id').references(() => regions.region_id),
  run_date: text('run_date').notNull(), // YYYY-MM-DD in region timezone
  ran_at_utc: text('ran_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
  status: text('status').notNull(), // RUNNING, SUCCESS, FAILED
  message: text('message'),
  duration_ms: integer('duration_ms'),
}, (table) => ({
  jobDateIdx: index('job_runs_job_date_idx').on(table.job_name, table.run_date, table.region_id),
}));

// ============================================
// 3. STORES - 가맹점 마스터
// ============================================
export const stores = sqliteTable('stores', {
  store_id: integer('store_id').primaryKey({ autoIncrement: true }),
  region_id: integer('region_id').notNull().references(() => regions.region_id),
  store_name: text('store_name').notNull(),
  address_line1: text('address_line1'),
  address_line2: text('address_line2'),
  city: text('city'),
  province: text('province'),
  postal_code: text('postal_code'),
  country: text('country'),
  shopify_customer_id: text('shopify_customer_id'), // For CUSTOMER match method
  store_code: text('store_code'), // For TAG match method
  match_address_key: text('match_address_key'), // For ADDRESS match method (normalized)
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  created_at_utc: text('created_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at_utc: text('updated_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  regionIdx: index('stores_region_idx').on(table.region_id),
  customerIdx: index('stores_customer_idx').on(table.shopify_customer_id),
  storeCodeIdx: index('stores_code_idx').on(table.store_code),
}));

// ============================================
// 4. ROUTES - 배송 코스/그룹
// ============================================
export const routes = sqliteTable('routes', {
  route_id: integer('route_id').primaryKey({ autoIncrement: true }),
  region_id: integer('region_id').notNull().references(() => regions.region_id),
  name: text('name').notNull(), // A, B, etc
  active_days: text('active_days').notNull(), // Mon,Wed,Fri
  cutoff_time: text('cutoff_time'), // HH:MM
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  created_at_utc: text('created_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  regionIdx: index('routes_region_idx').on(table.region_id),
}));

// ============================================
// 5. STORE_ROUTES - 매장-코스 매핑 (기간별)
// ============================================
export const storeRoutes = sqliteTable('store_routes', {
  store_route_id: integer('store_route_id').primaryKey({ autoIncrement: true }),
  store_id: integer('store_id').notNull().references(() => stores.store_id),
  route_id: integer('route_id').notNull().references(() => routes.route_id),
  effective_from: text('effective_from').notNull(), // YYYY-MM-DD
  effective_to: text('effective_to'), // YYYY-MM-DD or null for open-ended
  created_at_utc: text('created_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  storeIdx: index('store_routes_store_idx').on(table.store_id),
  routeIdx: index('store_routes_route_idx').on(table.route_id),
}));

// ============================================
// 6. SKUS - 품목 마스터
// ============================================
export const skus = sqliteTable('skus', {
  sku_id: integer('sku_id').primaryKey({ autoIncrement: true }),
  sku_code: text('sku_code').notNull().unique(),
  name: text('name').notNull(),
  pack_size: integer('pack_size').notNull().default(1),
  moq: integer('moq').notNull().default(1), // Minimum Order Quantity
  lead_time_days: integer('lead_time_days').notNull().default(0),
  safety_stock_days: integer('safety_stock_days').notNull().default(0),
  expiry_managed: integer('expiry_managed', { mode: 'boolean' }).notNull().default(false),
  abc_grade: text('abc_grade'), // A, B, C
  abc_lock: integer('abc_lock', { mode: 'boolean' }).notNull().default(false),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  created_at_utc: text('created_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at_utc: text('updated_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  skuCodeIdx: index('skus_code_idx').on(table.sku_code),
  abcGradeIdx: index('skus_abc_idx').on(table.abc_grade),
}));

// ============================================
// 7. SKU_PRICES - 가격 히스토리 (다단계)
// ============================================
export const skuPrices = sqliteTable('sku_prices', {
  sku_price_id: integer('sku_price_id').primaryKey({ autoIncrement: true }),
  sku_id: integer('sku_id').notNull().references(() => skus.sku_id),
  price_type: text('price_type').notNull(), // STC_COST, OUR_COST, OUR_SUPPLY, STORE_PRICE, KR_COST
  currency: text('currency').notNull(), // CAD, KRW
  unit_price: real('unit_price').notNull(),
  effective_from: text('effective_from').notNull(), // YYYY-MM-DD
  effective_to: text('effective_to'), // YYYY-MM-DD or null
  created_at_utc: text('created_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  skuPriceTypeIdx: index('sku_prices_sku_type_idx').on(table.sku_id, table.price_type),
  effectiveIdx: index('sku_prices_effective_idx').on(table.effective_from, table.effective_to),
}));

// ============================================
// 8. LOCATIONS - 창고/위치
// ============================================
export const locations = sqliteTable('locations', {
  location_id: integer('location_id').primaryKey({ autoIncrement: true }),
  region_id: integer('region_id').notNull().references(() => regions.region_id),
  name: text('name').notNull(),
  location_type: text('location_type').notNull(), // STC_WAREHOUSE, OUR_WAREHOUSE, STORE
  address: text('address'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  created_at_utc: text('created_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  regionTypeIdx: index('locations_region_type_idx').on(table.region_id, table.location_type),
}));

// ============================================
// 9. INVENTORY - 위치별 현재고 집계
// ============================================
export const inventory = sqliteTable('inventory', {
  inventory_id: integer('inventory_id').primaryKey({ autoIncrement: true }),
  region_id: integer('region_id').notNull().references(() => regions.region_id),
  location_id: integer('location_id').notNull().references(() => locations.location_id),
  sku_id: integer('sku_id').notNull().references(() => skus.sku_id),
  on_hand_qty: integer('on_hand_qty').notNull().default(0),
  reserved_qty: integer('reserved_qty').notNull().default(0),
  updated_at_utc: text('updated_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  locationSkuIdx: unique('inventory_location_sku_unique').on(table.location_id, table.sku_id),
  regionSkuIdx: index('inventory_region_sku_idx').on(table.region_id, table.sku_id),
}));

// ============================================
// 10. LOTS - 로트별 재고 (유통기한 관리)
// ============================================
export const lots = sqliteTable('lots', {
  lot_id: integer('lot_id').primaryKey({ autoIncrement: true }),
  region_id: integer('region_id').notNull().references(() => regions.region_id),
  location_id: integer('location_id').notNull().references(() => locations.location_id),
  sku_id: integer('sku_id').notNull().references(() => skus.sku_id),
  lot_code: text('lot_code').notNull(),
  expiry_date: text('expiry_date'), // YYYY-MM-DD
  qty: integer('qty').notNull().default(0),
  received_date: text('received_date'), // YYYY-MM-DD
  lot_status: text('lot_status').notNull().default('AVAILABLE'), // AVAILABLE, QUARANTINE, DAMAGED, EXPIRED
  created_at_utc: text('created_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at_utc: text('updated_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  lotCodeIdx: index('lots_code_idx').on(table.lot_code),
  expiryIdx: index('lots_expiry_idx').on(table.expiry_date),
  locationSkuIdx: index('lots_location_sku_idx').on(table.location_id, table.sku_id),
}));

// ============================================
// 11. MOVEMENTS - 재고 전표 (모든 입출고 기록)
// ============================================
export const movements = sqliteTable('movements', {
  movement_id: integer('movement_id').primaryKey({ autoIncrement: true }),
  region_id: integer('region_id').notNull().references(() => regions.region_id),
  movement_type: text('movement_type').notNull(), // PURCHASE, SHIP, RECEIVE, OUT, RETURN, ADJUST, WRITE_OFF, TRANSFER
  sku_id: integer('sku_id').notNull().references(() => skus.sku_id),
  from_location_id: integer('from_location_id').references(() => locations.location_id),
  to_location_id: integer('to_location_id').references(() => locations.location_id),
  lot_id: integer('lot_id').references(() => lots.lot_id),
  qty: integer('qty').notNull(),
  related_order_id: integer('related_order_id'),
  ref_type: text('ref_type'), // ORDER, PO, ADJUSTMENT, etc
  ref_id: text('ref_id'),
  reason: text('reason'),
  unit_cost_applied: real('unit_cost_applied'),
  created_at_utc: text('created_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
  created_by_user_id: integer('created_by_user_id'),
}, (table) => ({
  regionTypeIdx: index('movements_region_type_idx').on(table.region_id, table.movement_type),
  skuIdx: index('movements_sku_idx').on(table.sku_id),
  createdIdx: index('movements_created_idx').on(table.created_at_utc),
}));

// ============================================
// 12. ORDERS - Shopify 주문 헤더
// ============================================
export const orders = sqliteTable('orders', {
  order_id: integer('order_id').primaryKey({ autoIncrement: true }),
  region_id: integer('region_id').notNull().references(() => regions.region_id),
  store_id: integer('store_id').references(() => stores.store_id), // nullable for unmatched
  shopify_order_id: text('shopify_order_id').notNull().unique(),
  order_number: text('order_number').notNull(),
  order_date_at_utc: text('order_date_at_utc').notNull(),
  order_type: text('order_type').notNull().default('REGULAR'), // REGULAR, EMERGENCY, EXTRA
  reason: text('reason'), // For EMERGENCY/EXTRA
  currency: text('currency').notNull(),
  total_amount: real('total_amount').notNull(),
  status: text('status').notNull(), // PENDING, PROCESSING, FULFILLED, CANCELLED
  shopify_customer_id: text('shopify_customer_id'),
  shipping_address_json: text('shipping_address_json'),
  tags: text('tags'),
  created_at_utc: text('created_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at_utc: text('updated_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  shopifyOrderIdx: index('orders_shopify_order_idx').on(table.shopify_order_id),
  regionDateIdx: index('orders_region_date_idx').on(table.region_id, table.order_date_at_utc),
  storeIdx: index('orders_store_idx').on(table.store_id),
  orderTypeIdx: index('orders_type_idx').on(table.order_type),
}));

// ============================================
// 13. ORDER_LINES - 주문 라인 아이템
// ============================================
export const orderLines = sqliteTable('order_lines', {
  order_line_id: integer('order_line_id').primaryKey({ autoIncrement: true }),
  order_id: integer('order_id').notNull().references(() => orders.order_id),
  sku_id: integer('sku_id').references(() => skus.sku_id), // nullable if SKU not found
  sku_code_snapshot: text('sku_code_snapshot').notNull(),
  name_snapshot: text('name_snapshot').notNull(),
  qty: integer('qty').notNull(),
  unit_price_snapshot: real('unit_price_snapshot').notNull(), // OUR_SUPPLY price to store
  unit_cost_snapshot: real('unit_cost_snapshot'), // OUR_COST or STC_COST
  margin_snapshot: real('margin_snapshot'),
  shopify_line_item_id: text('shopify_line_item_id'),
}, (table) => ({
  orderIdx: index('order_lines_order_idx').on(table.order_id),
  skuIdx: index('order_lines_sku_idx').on(table.sku_id),
}));

// ============================================
// 14. FORECAST - 수요 예측
// ============================================
export const forecast = sqliteTable('forecast', {
  forecast_id: integer('forecast_id').primaryKey({ autoIncrement: true }),
  region_id: integer('region_id').notNull().references(() => regions.region_id),
  sku_id: integer('sku_id').notNull().references(() => skus.sku_id),
  forecast_date: text('forecast_date').notNull(), // YYYY-MM-DD
  daily_rate_30: real('daily_rate_30'),
  daily_rate_60: real('daily_rate_60'),
  daily_rate_90: real('daily_rate_90'),
  daily_rate_used: real('daily_rate_used'),
  calculated_at_utc: text('calculated_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  regionSkuDateIdx: unique('forecast_region_sku_date_unique').on(table.region_id, table.sku_id, table.forecast_date),
}));

// ============================================
// 15. ABC_CLASSIFICATION - ABC 등급
// ============================================
export const abcClassification = sqliteTable('abc_classification', {
  abc_id: integer('abc_id').primaryKey({ autoIncrement: true }),
  region_id: integer('region_id').notNull().references(() => regions.region_id),
  sku_id: integer('sku_id').notNull().references(() => skus.sku_id),
  analysis_date: text('analysis_date').notNull(), // YYYY-MM-DD
  abc_grade: text('abc_grade').notNull(), // A, B, C
  revenue_contribution: real('revenue_contribution'),
  volume_contribution: real('volume_contribution'),
  calculated_at_utc: text('calculated_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  regionSkuDateIdx: unique('abc_region_sku_date_unique').on(table.region_id, table.sku_id, table.analysis_date),
}));

// ============================================
// 16. REPLENISHMENT_RECOMMENDATIONS - 발주 추천
// ============================================
export const replenishmentRecommendations = sqliteTable('replenishment_recommendations', {
  recommendation_id: integer('recommendation_id').primaryKey({ autoIncrement: true }),
  region_id: integer('region_id').notNull().references(() => regions.region_id),
  sku_id: integer('sku_id').notNull().references(() => skus.sku_id),
  recommendation_date: text('recommendation_date').notNull(), // YYYY-MM-DD
  on_hand_qty: integer('on_hand_qty').notNull(),
  daily_rate: real('daily_rate').notNull(),
  rop: integer('rop').notNull(), // Reorder Point
  recommended_qty: integer('recommended_qty').notNull(),
  adjusted_qty: integer('adjusted_qty'), // After MOQ/pack adjustments
  priority: text('priority'), // HIGH, MEDIUM, LOW
  calculated_at_utc: text('calculated_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  regionDateIdx: index('replenishment_region_date_idx').on(table.region_id, table.recommendation_date),
  skuIdx: index('replenishment_sku_idx').on(table.sku_id),
}));

// ============================================
// 17. DEADSTOCK_RISK - 불용재고 위험
// ============================================
export const deadstockRisk = sqliteTable('deadstock_risk', {
  deadstock_id: integer('deadstock_id').primaryKey({ autoIncrement: true }),
  region_id: integer('region_id').notNull().references(() => regions.region_id),
  sku_id: integer('sku_id').notNull().references(() => skus.sku_id),
  lot_id: integer('lot_id').references(() => lots.lot_id),
  analysis_date: text('analysis_date').notNull(), // YYYY-MM-DD
  expiry_date: text('expiry_date'),
  days_to_expiry: integer('days_to_expiry'),
  current_qty: integer('current_qty').notNull(),
  expected_consume: real('expected_consume'),
  expected_leftover: real('expected_leftover'),
  risk_level: text('risk_level').notNull(), // HIGH, MED, LOW
  suggested_action: text('suggested_action'), // PROMO, BUNDLE, TRANSFER, STOP_PURCHASE
  calculated_at_utc: text('calculated_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  regionDateIdx: index('deadstock_region_date_idx').on(table.region_id, table.analysis_date),
  riskIdx: index('deadstock_risk_idx').on(table.risk_level),
}));

// ============================================
// 18. COMMENTS - 협업/댓글
// ============================================
export const comments = sqliteTable('comments', {
  comment_id: integer('comment_id').primaryKey({ autoIncrement: true }),
  entity_type: text('entity_type').notNull(), // ORDER, SKU, STORE, MOVEMENT, LOT
  entity_id: integer('entity_id').notNull(),
  user_id: integer('user_id'),
  user_name: text('user_name').notNull(),
  comment_text: text('comment_text').notNull(),
  tags: text('tags'), // Comma-separated: URGENT, ISSUE, RESOLVED
  created_at_utc: text('created_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  entityIdx: index('comments_entity_idx').on(table.entity_type, table.entity_id),
}));

// ============================================
// 19. AUDIT_LOGS - 감사 로그
// ============================================
export const auditLogs = sqliteTable('audit_logs', {
  audit_id: integer('audit_id').primaryKey({ autoIncrement: true }),
  entity_type: text('entity_type').notNull(),
  entity_id: integer('entity_id'),
  action: text('action').notNull(), // CREATE, UPDATE, DELETE, ADJUST
  user_id: integer('user_id'),
  user_name: text('user_name'),
  changes_json: text('changes_json'),
  reason: text('reason'),
  created_at_utc: text('created_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  entityIdx: index('audit_logs_entity_idx').on(table.entity_type, table.entity_id),
  createdIdx: index('audit_logs_created_idx').on(table.created_at_utc),
}));

// ============================================
// 20. EVENTS - Shopify 웹훅 원본
// ============================================
export const events = sqliteTable('events', {
  event_id: integer('event_id').primaryKey({ autoIncrement: true }),
  source: text('source').notNull(), // SHOPIFY
  topic: text('topic').notNull(), // orders/create, orders/updated, etc
  shopify_event_id: text('shopify_event_id'),
  region_id: integer('region_id').references(() => regions.region_id),
  payload_json: text('payload_json').notNull(),
  processed: integer('processed', { mode: 'boolean' }).notNull().default(false),
  processed_at_utc: text('processed_at_utc'),
  error_message: text('error_message'),
  created_at_utc: text('created_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  sourceTopicIdx: index('events_source_topic_idx').on(table.source, table.topic),
  shopifyEventIdx: index('events_shopify_event_idx').on(table.shopify_event_id),
  processedIdx: index('events_processed_idx').on(table.processed),
}));

// ============================================
// 21. USERS - 사용자 (간단한 인증용)
// ============================================
export const users = sqliteTable('users', {
  user_id: integer('user_id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('OPERATOR'), // ADMIN, OPERATOR, VIEWER
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  created_at_utc: text('created_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

// ============================================
// 22. DOCUMENTS - 생성된 문서 기록
// ============================================
export const documents = sqliteTable('documents', {
  document_id: integer('document_id').primaryKey({ autoIncrement: true }),
  region_id: integer('region_id').notNull().references(() => regions.region_id),
  document_type: text('document_type').notNull(), // PICKING_LIST, PACKING_LIST, PO_DRAFT
  document_date: text('document_date').notNull(), // YYYY-MM-DD
  file_url: text('file_url'),
  file_name: text('file_name'),
  status: text('status').notNull(), // GENERATED, SENT, ARCHIVED
  generated_at_utc: text('generated_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  regionDateIdx: index('documents_region_date_idx').on(table.region_id, table.document_date),
}));

// ============================================
// 23. EMERGENCY_KPI_DAILY - 긴급발주 KPI 집계 (선택)
// ============================================
export const emergencyKpiDaily = sqliteTable('emergency_kpi_daily', {
  kpi_id: integer('kpi_id').primaryKey({ autoIncrement: true }),
  region_id: integer('region_id').notNull().references(() => regions.region_id),
  kpi_date: text('kpi_date').notNull(), // YYYY-MM-DD
  total_orders: integer('total_orders').notNull().default(0),
  emergency_orders: integer('emergency_orders').notNull().default(0),
  extra_orders: integer('extra_orders').notNull().default(0),
  regular_orders: integer('regular_orders').notNull().default(0),
  emergency_rate: real('emergency_rate'),
  calculated_at_utc: text('calculated_at_utc').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  regionDateIdx: unique('emergency_kpi_region_date_unique').on(table.region_id, table.kpi_date),
}));
