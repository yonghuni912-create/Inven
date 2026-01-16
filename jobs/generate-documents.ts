/**
 * Generate documents job
 * - Picking lists
 * - Packing lists
 * - PO drafts
 */

import { db } from '../db';
import { 
  orders,
  orderLines,
  stores,
  skus,
  replenishmentRecommendations,
  documents
} from '../db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { todayInTimezone } from '../lib/datetime';

export async function run(region: any) {
  console.log(`  Generating documents for region ${region.name}`);
  const docDate = todayInTimezone(region.timezone);

  try {
    // Generate picking list data
    const pickingList = await generatePickingList(region, docDate);
    
    // Generate PO draft data
    const poDraft = await generatePODraft(region, docDate);

    return {
      message: 'Documents generated',
      picking_list: pickingList,
      po_draft: poDraft,
    };
  } catch (error) {
    console.error('Error generating documents:', error);
    throw error;
  }
}

async function generatePickingList(region: any, docDate: string) {
  // Get today's orders
  const todaysOrders = await db
    .select({
      order_id: orders.order_id,
      order_number: orders.order_number,
      store_name: stores.store_name,
      order_type: orders.order_type,
    })
    .from(orders)
    .leftJoin(stores, eq(orders.store_id, stores.store_id))
    .where(
      and(
        eq(orders.region_id, region.region_id),
        gte(orders.order_date_at_utc, docDate)
      )
    );

  // Aggregate items across all orders
  const itemsMap = new Map();

  for (const order of todaysOrders) {
    const lines = await db
      .select({
        sku_code: skus.sku_code,
        name: skus.name,
        qty: orderLines.qty,
      })
      .from(orderLines)
      .leftJoin(skus, eq(orderLines.sku_id, skus.sku_id))
      .where(eq(orderLines.order_id, order.order_id));

    for (const line of lines) {
      const key = line.sku_code;
      if (itemsMap.has(key)) {
        itemsMap.get(key).qty += line.qty;
      } else {
        itemsMap.set(key, { ...line });
      }
    }
  }

  const fileName = `picking-list-${region.name}-${docDate}.txt`;

  // Create simple text document
  let content = `PICKING LIST - ${region.name}\n`;
  content += `Date: ${docDate}\n`;
  content += `Total Orders: ${todaysOrders.length}\n\n`;
  content += `SKU Code\t\tProduct Name\t\tQty\n`;
  content += `${'='.repeat(60)}\n`;

  for (const [_, item] of itemsMap) {
    content += `${item.sku_code}\t\t${item.name}\t\t${item.qty}\n`;
  }

  // Save document record
  await db.insert(documents).values({
    region_id: region.region_id,
    document_type: 'PICKING_LIST',
    document_date: docDate,
    file_name: fileName,
    file_url: `documents/${fileName}`, // Would save to actual storage
    status: 'GENERATED',
    generated_at_utc: new Date().toISOString(),
  });

  return fileName;
}

async function generatePODraft(region: any, docDate: string) {
  // Get replenishment recommendations
  const recommendations = await db
    .select({
      sku_code: skus.sku_code,
      name: skus.name,
      recommended_qty: replenishmentRecommendations.recommended_qty,
      adjusted_qty: replenishmentRecommendations.adjusted_qty,
      priority: replenishmentRecommendations.priority,
    })
    .from(replenishmentRecommendations)
    .innerJoin(skus, eq(replenishmentRecommendations.sku_id, skus.sku_id))
    .where(
      and(
        eq(replenishmentRecommendations.region_id, region.region_id),
        eq(replenishmentRecommendations.recommendation_date, docDate)
      )
    );

  if (recommendations.length === 0) {
    console.log('  No recommendations to generate PO');
    return null;
  }

  const fileName = `po-draft-${region.name}-${docDate}.txt`;

  // Create simple text document
  let content = `PURCHASE ORDER DRAFT - ${region.name}\n`;
  content += `Date: ${docDate}\n\n`;
  content += `SKU Code\t\tProduct Name\t\tQty\t\tPriority\n`;
  content += `${'='.repeat(70)}\n`;

  for (const item of recommendations) {
    content += `${item.sku_code}\t\t${item.name}\t\t${item.adjusted_qty}\t\t${item.priority}\n`;
  }

  // Save document record
  await db.insert(documents).values({
    region_id: region.region_id,
    document_type: 'PO_DRAFT',
    document_date: docDate,
    file_name: fileName,
    file_url: `documents/${fileName}`, // Would save to actual storage
    status: 'GENERATED',
    generated_at_utc: new Date().toISOString(),
  });

  return fileName;
}
