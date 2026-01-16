import { db } from '@/db';
import { stores } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Normalize address for matching
 */
function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match store based on region's matching method
 */
export async function matchStore(
  regionId: number,
  matchMethod: 'CUSTOMER' | 'ADDRESS' | 'TAG',
  orderData: {
    customer_id?: string;
    shipping_address?: any;
    tags?: string;
  }
): Promise<number | null> {
  if (matchMethod === 'CUSTOMER' && orderData.customer_id) {
    // Match by Shopify customer ID
    const result = await db
      .select({ store_id: stores.store_id })
      .from(stores)
      .where(
        and(
          eq(stores.region_id, regionId),
          eq(stores.shopify_customer_id, orderData.customer_id),
          eq(stores.active, true)
        )
      )
      .limit(1);
    
    return result[0]?.store_id || null;
  }

  if (matchMethod === 'ADDRESS' && orderData.shipping_address) {
    // Match by normalized shipping address
    const addressKey = normalizeAddress(
      `${orderData.shipping_address.address1 || ''} ${orderData.shipping_address.city || ''} ${orderData.shipping_address.zip || ''}`
    );

    const result = await db
      .select({ store_id: stores.store_id })
      .from(stores)
      .where(
        and(
          eq(stores.region_id, regionId),
          eq(stores.active, true)
        )
      );

    // Find best match
    for (const store of result) {
      if (store.match_address_key && normalizeAddress(store.match_address_key) === addressKey) {
        return store.store_id;
      }
    }

    return null;
  }

  if (matchMethod === 'TAG' && orderData.tags) {
    // Match by store code in tags
    const tags = orderData.tags.split(',').map((t: string) => t.trim());
    
    const result = await db
      .select({ store_id: stores.store_id })
      .from(stores)
      .where(
        and(
          eq(stores.region_id, regionId),
          eq(stores.active, true)
        )
      );

    for (const store of result) {
      if (store.store_code && tags.includes(store.store_code)) {
        return store.store_id;
      }
    }

    return null;
  }

  return null;
}

/**
 * Test store matching with a specific order
 */
export async function testStoreMatch(
  regionId: number,
  matchMethod: 'CUSTOMER' | 'ADDRESS' | 'TAG',
  shopifyOrderNumber: string
): Promise<{ matched: boolean; store_id: number | null; store_name?: string }> {
  // This would fetch the order from Shopify and test matching
  // Implementation would require Shopify API call
  return { matched: false, store_id: null };
}
