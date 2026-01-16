import { db } from '@/db';
import { skus, skuPrices, inventory, forecast, movements, lots } from '@/db/schema';
import { eq, and, lte, or, isNull, gte, desc, sql } from 'drizzle-orm';

/**
 * Get current price for a SKU and price type
 */
export async function getCurrentPrice(
  skuId: number,
  priceType: string,
  effectiveDate: string = new Date().toISOString().split('T')[0]
): Promise<number | null> {
  const result = await db
    .select({ unit_price: skuPrices.unit_price })
    .from(skuPrices)
    .where(
      and(
        eq(skuPrices.sku_id, skuId),
        eq(skuPrices.price_type, priceType),
        lte(skuPrices.effective_from, effectiveDate),
        or(
          isNull(skuPrices.effective_to),
          gte(skuPrices.effective_to, effectiveDate)
        )
      )
    )
    .orderBy(desc(skuPrices.effective_from))
    .limit(1);

  return result[0]?.unit_price || null;
}

/**
 * Calculate ROP (Reorder Point) for a SKU
 */
export async function calculateROP(
  skuId: number,
  dailyRate: number
): Promise<number> {
  const sku = await db
    .select({
      lead_time_days: skus.lead_time_days,
      safety_stock_days: skus.safety_stock_days,
    })
    .from(skus)
    .where(eq(skus.sku_id, skuId))
    .limit(1);

  if (!sku[0]) return 0;

  const { lead_time_days, safety_stock_days } = sku[0];
  return Math.ceil(dailyRate * (lead_time_days + safety_stock_days));
}

/**
 * Calculate recommended order quantity
 */
export async function calculateRecommendedQty(
  skuId: number,
  onHandQty: number,
  rop: number
): Promise<{ raw_qty: number; adjusted_qty: number }> {
  const sku = await db
    .select({
      moq: skus.moq,
      pack_size: skus.pack_size,
    })
    .from(skus)
    .where(eq(skus.sku_id, skuId))
    .limit(1);

  if (!sku[0]) return { raw_qty: 0, adjusted_qty: 0 };

  const { moq, pack_size } = sku[0];
  
  let rawQty = Math.max(0, rop - onHandQty);
  
  // Apply MOQ
  if (rawQty > 0 && rawQty < moq) {
    rawQty = moq;
  }
  
  // Round up to pack size
  const adjustedQty = rawQty > 0 ? Math.ceil(rawQty / pack_size) * pack_size : 0;
  
  return { raw_qty: rawQty, adjusted_qty: adjustedQty };
}

/**
 * Get inventory summary for a SKU
 */
export async function getInventorySummary(
  regionId: number,
  skuId: number
): Promise<{
  total_on_hand: number;
  total_reserved: number;
  available: number;
  locations: Array<{ location_id: number; on_hand: number; reserved: number }>;
}> {
  const inventoryData = await db
    .select({
      location_id: inventory.location_id,
      on_hand_qty: inventory.on_hand_qty,
      reserved_qty: inventory.reserved_qty,
    })
    .from(inventory)
    .where(
      and(
        eq(inventory.region_id, regionId),
        eq(inventory.sku_id, skuId)
      )
    );

  const totalOnHand = inventoryData.reduce((sum, inv) => sum + inv.on_hand_qty, 0);
  const totalReserved = inventoryData.reduce((sum, inv) => sum + inv.reserved_qty, 0);

  return {
    total_on_hand: totalOnHand,
    total_reserved: totalReserved,
    available: totalOnHand - totalReserved,
    locations: inventoryData.map(inv => ({
      location_id: inv.location_id,
      on_hand: inv.on_hand_qty,
      reserved: inv.reserved_qty,
    })),
  };
}

/**
 * Update inventory after movement
 */
export async function updateInventoryFromMovement(
  regionId: number,
  locationId: number,
  skuId: number,
  qtyDelta: number
): Promise<void> {
  const existing = await db
    .select()
    .from(inventory)
    .where(
      and(
        eq(inventory.location_id, locationId),
        eq(inventory.sku_id, skuId)
      )
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(inventory)
      .set({
        on_hand_qty: existing[0].on_hand_qty + qtyDelta,
        updated_at_utc: new Date().toISOString(),
      })
      .where(eq(inventory.inventory_id, existing[0].inventory_id));
  } else {
    await db.insert(inventory).values({
      region_id: regionId,
      location_id: locationId,
      sku_id: skuId,
      on_hand_qty: Math.max(0, qtyDelta),
      reserved_qty: 0,
      updated_at_utc: new Date().toISOString(),
    });
  }
}

/**
 * Calculate daily usage rate from historical orders
 */
export async function calculateDailyRate(
  skuId: number,
  regionId: number,
  days: number = 30
): Promise<number> {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);
  
  // This would query order_lines and sum qty
  // Simplified version - actual implementation would join orders and order_lines
  const result = await db
    .select({
      total_qty: sql<number>`SUM(${movements.qty})`,
    })
    .from(movements)
    .where(
      and(
        eq(movements.region_id, regionId),
        eq(movements.sku_id, skuId),
        eq(movements.movement_type, 'OUT'),
        gte(movements.created_at_utc, sinceDate.toISOString())
      )
    );

  const totalQty = result[0]?.total_qty || 0;
  return totalQty / days;
}
