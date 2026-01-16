import { db } from '@/db';
import { skus, lots, deadstockRisk } from '@/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { daysToExpiry } from './datetime';
import { calculateDailyRate } from './inventory-calculations';

/**
 * Analyze deadstock risk for all expiry-managed SKUs
 */
export async function analyzeDeadstockRisk(
  regionId: number,
  analysisDate: string = new Date().toISOString().split('T')[0]
): Promise<void> {
  // Get all expiry-managed SKUs
  const expiryManagedSkus = await db
    .select({
      sku_id: skus.sku_id,
      sku_code: skus.sku_code,
      name: skus.name,
    })
    .from(skus)
    .where(
      and(
        eq(skus.expiry_managed, true),
        eq(skus.active, true)
      )
    );

  for (const sku of expiryManagedSkus) {
    // Get all lots for this SKU
    const skuLots = await db
      .select()
      .from(lots)
      .where(
        and(
          eq(lots.region_id, regionId),
          eq(lots.sku_id, sku.sku_id),
          eq(lots.lot_status, 'AVAILABLE')
        )
      );

    // Calculate daily consumption rate
    const dailyRate = await calculateDailyRate(sku.sku_id, regionId, 30);

    for (const lot of skuLots) {
      if (!lot.expiry_date || lot.qty <= 0) continue;

      const daysLeft = daysToExpiry(lot.expiry_date);
      
      // Only analyze if within 180 days
      if (daysLeft < 0 || daysLeft > 180) continue;

      const expectedConsume = dailyRate * daysLeft;
      const expectedLeftover = lot.qty - expectedConsume;

      let riskLevel: 'HIGH' | 'MED' | 'LOW' = 'LOW';
      let suggestedAction = 'MONITOR';

      if (daysLeft <= 150 && expectedLeftover > 0) {
        riskLevel = 'HIGH';
        
        if (daysLeft <= 30) {
          suggestedAction = 'PROMO_URGENT';
        } else if (daysLeft <= 60) {
          suggestedAction = 'PROMO';
        } else if (daysLeft <= 90) {
          suggestedAction = 'BUNDLE';
        } else {
          suggestedAction = 'STOP_PURCHASE';
        }
      } else if (daysLeft <= 120 && expectedLeftover > lot.qty * 0.5) {
        riskLevel = 'MED';
        suggestedAction = 'MONITOR_CLOSELY';
      }

      // Save risk analysis
      await db.insert(deadstockRisk).values({
        region_id: regionId,
        sku_id: sku.sku_id,
        lot_id: lot.lot_id,
        analysis_date: analysisDate,
        expiry_date: lot.expiry_date,
        days_to_expiry: daysLeft,
        current_qty: lot.qty,
        expected_consume: expectedConsume,
        expected_leftover: expectedLeftover,
        risk_level: riskLevel,
        suggested_action: suggestedAction,
        calculated_at_utc: new Date().toISOString(),
      });
    }
  }
}

/**
 * Get high-risk deadstock items
 */
export async function getHighRiskDeadstock(
  regionId: number,
  analysisDate: string = new Date().toISOString().split('T')[0]
): Promise<Array<{
  sku_code: string;
  name: string;
  lot_code: string;
  expiry_date: string;
  days_to_expiry: number;
  current_qty: number;
  expected_leftover: number;
  suggested_action: string;
}>> {
  const result = await db
    .select({
      sku_code: skus.sku_code,
      name: skus.name,
      lot_code: lots.lot_code,
      expiry_date: deadstockRisk.expiry_date,
      days_to_expiry: deadstockRisk.days_to_expiry,
      current_qty: deadstockRisk.current_qty,
      expected_leftover: deadstockRisk.expected_leftover,
      suggested_action: deadstockRisk.suggested_action,
    })
    .from(deadstockRisk)
    .innerJoin(skus, eq(deadstockRisk.sku_id, skus.sku_id))
    .leftJoin(lots, eq(deadstockRisk.lot_id, lots.lot_id))
    .where(
      and(
        eq(deadstockRisk.region_id, regionId),
        eq(deadstockRisk.analysis_date, analysisDate),
        eq(deadstockRisk.risk_level, 'HIGH')
      )
    );

  return result as any[];
}
