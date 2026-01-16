import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { events, regions, orders, orderLines, skus } from '@/db/schema'
import { verifyShopifyWebhook } from '@/lib/shopify'
import { decrypt } from '@/lib/encryption'
import { matchStore } from '@/lib/store-matching'
import { classifyOrderType } from '@/lib/order-classification'
import { getCurrentPrice } from '@/lib/inventory-calculations'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256') || ''
    const topic = req.headers.get('x-shopify-topic') || ''
    const shopDomain = req.headers.get('x-shopify-shop-domain') || ''
    const shopifyEventId = req.headers.get('x-shopify-webhook-id') || ''

    // Find region by shop domain
    const region = await db
      .select()
      .from(regions)
      .where(eq(regions.shop_domain, shopDomain))
      .limit(1)

    if (!region[0]) {
      return NextResponse.json({ error: 'Unknown shop domain' }, { status: 404 })
    }

    // Verify HMAC
    const webhookSecret = decrypt(region[0].webhook_secret_enc)
    if (!verifyShopifyWebhook(body, hmacHeader, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 })
    }

    // Check for duplicate event
    if (shopifyEventId) {
      const existing = await db
        .select()
        .from(events)
        .where(eq(events.shopify_event_id, shopifyEventId))
        .limit(1)

      if (existing[0]) {
        return NextResponse.json({ message: 'Event already processed' }, { status: 200 })
      }
    }

    // Store event
    const payload = JSON.parse(body)
    await db.insert(events).values({
      source: 'SHOPIFY',
      topic,
      shopify_event_id: shopifyEventId,
      region_id: region[0].region_id,
      payload_json: body,
      processed: false,
    })

    // Process order events immediately
    if (topic === 'orders/create' || topic === 'orders/updated') {
      await processOrder(region[0], payload)
    }

    return NextResponse.json({ message: 'Webhook received' }, { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processOrder(region: any, orderData: any) {
  try {
    // Match store
    const storeId = await matchStore(
      region.region_id,
      region.store_match_method,
      {
        customer_id: orderData.customer?.id?.toString(),
        shipping_address: orderData.shipping_address,
        tags: orderData.tags,
      }
    )

    // Classify order type
    const orderDate = new Date(orderData.created_at)
    const classification = await classifyOrderType(
      region.region_id,
      storeId,
      orderDate,
      region.timezone
    )

    // Upsert order
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.shopify_order_id, orderData.id.toString()))
      .limit(1)

    const orderValues = {
      region_id: region.region_id,
      store_id: storeId,
      shopify_order_id: orderData.id.toString(),
      order_number: orderData.order_number || orderData.name,
      order_date_at_utc: orderData.created_at,
      order_type: classification.order_type,
      reason: classification.suggested_reason,
      currency: orderData.currency,
      total_amount: parseFloat(orderData.total_price),
      status: orderData.financial_status === 'paid' ? 'PENDING' : 'PROCESSING',
      shopify_customer_id: orderData.customer?.id?.toString(),
      shipping_address_json: JSON.stringify(orderData.shipping_address),
      tags: orderData.tags,
      updated_at_utc: new Date().toISOString(),
    }

    let orderId: number

    if (existingOrder[0]) {
      await db
        .update(orders)
        .set(orderValues)
        .where(eq(orders.order_id, existingOrder[0].order_id))
      orderId = existingOrder[0].order_id
    } else {
      const result = await db
        .insert(orders)
        .values({ ...orderValues, created_at_utc: new Date().toISOString() })
        .returning({ order_id: orders.order_id })
      orderId = result[0].order_id
    }

    // Process line items
    for (const line of orderData.line_items || []) {
      const skuCode = line.sku || line.variant_id?.toString()
      
      // Find SKU
      const sku = await db
        .select()
        .from(skus)
        .where(eq(skus.sku_code, skuCode))
        .limit(1)

      const skuId = sku[0]?.sku_id || null
      
      // Get prices if SKU exists
      let unitCost = null
      let margin = null
      
      if (skuId) {
        const costPrice = await getCurrentPrice(skuId, 'OUR_COST')
        if (costPrice) {
          unitCost = costPrice
          margin = parseFloat(line.price) - costPrice
        }
      }

      // Upsert order line
      await db.insert(orderLines).values({
        order_id: orderId,
        sku_id: skuId,
        sku_code_snapshot: skuCode,
        name_snapshot: line.title,
        qty: line.quantity,
        unit_price_snapshot: parseFloat(line.price),
        unit_cost_snapshot: unitCost,
        margin_snapshot: margin,
        shopify_line_item_id: line.id?.toString(),
      })
    }

    // Mark event as processed
    await db
      .update(events)
      .set({ processed: true, processed_at_utc: new Date().toISOString() })
      .where(eq(events.shopify_event_id, orderData.id.toString()))

  } catch (error) {
    console.error('Error processing order:', error)
    throw error
  }
}
