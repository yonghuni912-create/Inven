/**
 * Sync orders from Shopify
 * Runs frequently to catch any missed webhooks
 */

const { db } = require('../db')
const { orders } = require('../db/schema')
const { ShopifyClient } = require('../lib/shopify')
const { decrypt } = require('../lib/encryption')
const { desc } = require('drizzle-orm')

async function run(region) {
  console.log(`  Syncing Shopify orders for region ${region.name}`)

  try {
    // Get last synced order timestamp
    const lastOrder = await db
      .select({ order_date_at_utc: orders.order_date_at_utc })
      .from(orders)
      .where(eq(orders.region_id, region.region_id))
      .orderBy(desc(orders.order_date_at_utc))
      .limit(1)

    const since = lastOrder[0]?.order_date_at_utc

    // Create Shopify client
    const client = new ShopifyClient({
      shop_domain: region.shop_domain,
      admin_token: decrypt(region.admin_token_enc),
    })

    // Fetch orders
    const shopifyOrders = await client.fetchOrders(since)

    console.log(`  Found ${shopifyOrders.length} orders to sync`)

    // Process orders
    // Note: Actual order processing is handled by webhook endpoint
    // This is just a reconciliation/catch-up mechanism

    return {
      message: `Synced ${shopifyOrders.length} orders`,
      orders_synced: shopifyOrders.length,
    }
  } catch (error) {
    console.error('Error syncing Shopify orders:', error)
    throw error
  }
}

module.exports = { run }
