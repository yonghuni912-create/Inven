/**
 * Daily analytics job
 * - Calculate daily usage rates
 * - Update ABC classification
 * - Calculate ROP and recommendations
 * - Analyze deadstock risk
 * - Send alerts to Slack
 */

import { db } from '../db';
import { 
  skus, 
  forecast, 
  replenishmentRecommendations,
  emergencyKpiDaily,
  orders
} from '../db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { calculateDailyRate, calculateROP, calculateRecommendedQty, getInventorySummary } from '../lib/inventory-calculations';
import { analyzeDeadstockRisk, getHighRiskDeadstock } from '../lib/deadstock-analysis';
import { sendSlackNotification, formatStockoutAlert, formatDeadstockAlert } from '../lib/slack';
import { todayInTimezone } from '../lib/datetime';

export async function run(region: any) {
  console.log(`  Running daily analytics for region ${region.name}`);
  const analysisDate = todayInTimezone(region.timezone);

  try {
    // 1. Calculate daily usage rates
    await calculateUsageRates(region, analysisDate);

    // 2. Calculate replenishment recommendations
    const recommendations = await calculateReplenishments(region, analysisDate);

    // 3. Analyze deadstock risk
    await analyzeDeadstockRisk(region.region_id, analysisDate);

    // 4. Calculate emergency order KPIs
    await calculateEmergencyKPIs(region, analysisDate);

    // 5. Send alerts to Slack
    await sendAlerts(region, analysisDate, recommendations);

    return {
      message: 'Analytics completed',
      recommendations_generated: recommendations.length,
    };
  } catch (error) {
    console.error('Error in daily analytics:', error);
    throw error;
  }
}

async function calculateUsageRates(region: any, analysisDate: string) {
  const activeSkus = await db
    .select()
    .from(skus)
    .where(eq(skus.active, true));

  for (const sku of activeSkus) {
    const rate30 = await calculateDailyRate(sku.sku_id, region.region_id, 30);
    const rate60 = await calculateDailyRate(sku.sku_id, region.region_id, 60);
    const rate90 = await calculateDailyRate(sku.sku_id, region.region_id, 90);

    // Use most conservative (minimum) rate
    const dailyRateUsed = Math.min(rate30, rate60, rate90);

    // Save forecast
    await db.insert(forecast).values({
      region_id: region.region_id,
      sku_id: sku.sku_id,
      forecast_date: analysisDate,
      daily_rate_30: rate30,
      daily_rate_60: rate60,
      daily_rate_90: rate90,
      daily_rate_used: dailyRateUsed,
      calculated_at_utc: new Date().toISOString(),
    });
  }
}

async function calculateReplenishments(region: any, analysisDate: string) {
  const recommendations: any[] = [];

  const activeSkus = await db
    .select()
    .from(skus)
    .where(eq(skus.active, true));

  for (const sku of activeSkus) {
    // Get latest forecast
    const latestForecast = await db
      .select()
      .from(forecast)
      .where(
        and(
          eq(forecast.sku_id, sku.sku_id),
          eq(forecast.region_id, region.region_id),
          eq(forecast.forecast_date, analysisDate)
        )
      )
      .limit(1);

    if (!latestForecast[0]) continue;

    const dailyRate = latestForecast[0].daily_rate_used || 0;

    // Get inventory
    const inventorySummary = await getInventorySummary(region.region_id, sku.sku_id);
    const onHand = inventorySummary.available;

    // Calculate ROP
    const rop = await calculateROP(sku.sku_id, dailyRate);

    // Calculate recommended qty
    const { raw_qty, adjusted_qty } = await calculateRecommendedQty(sku.sku_id, onHand, rop);

    // Determine priority
    let priority = 'LOW';
    if (onHand < rop * 0.5) {
      priority = 'HIGH';
    } else if (onHand < rop) {
      priority = 'MEDIUM';
    }

    // Save recommendation
    await db.insert(replenishmentRecommendations).values({
      region_id: region.region_id,
      sku_id: sku.sku_id,
      recommendation_date: analysisDate,
      on_hand_qty: onHand,
      daily_rate: dailyRate,
      rop: rop,
      recommended_qty: raw_qty,
      adjusted_qty: adjusted_qty,
      priority: priority,
      calculated_at_utc: new Date().toISOString(),
    });

    if (priority === 'HIGH') {
      recommendations.push({
        sku_code: sku.sku_code,
        name: sku.name,
        on_hand: onHand,
        rop: rop,
      });
    }
  }

  return recommendations;
}

async function calculateEmergencyKPIs(region: any, analysisDate: string) {
  // Count orders by type for the date
  const stats = await db
    .select({
      total: sql<number>`COUNT(*)`,
      emergency: sql<number>`COUNT(CASE WHEN ${orders.order_type} = 'EMERGENCY' THEN 1 END)`,
      extra: sql<number>`COUNT(CASE WHEN ${orders.order_type} = 'EXTRA' THEN 1 END)`,
      regular: sql<number>`COUNT(CASE WHEN ${orders.order_type} = 'REGULAR' THEN 1 END)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.region_id, region.region_id),
        gte(orders.order_date_at_utc, analysisDate)
      )
    );

  const total = stats[0]?.total || 0;
  const emergencyRate = total > 0 ? (stats[0].emergency || 0) / total : 0;

  await db.insert(emergencyKpiDaily).values({
    region_id: region.region_id,
    kpi_date: analysisDate,
    total_orders: total,
    emergency_orders: stats[0]?.emergency || 0,
    extra_orders: stats[0]?.extra || 0,
    regular_orders: stats[0]?.regular || 0,
    emergency_rate: emergencyRate,
    calculated_at_utc: new Date().toISOString(),
  });
}

async function sendAlerts(region: any, analysisDate: string, stockoutRisks: any[]) {
  if (!region.slack_webhook_url) {
    console.log('  No Slack webhook configured, skipping alerts');
    return;
  }

  // Send stockout alerts
  if (stockoutRisks.length > 0) {
    const alert = formatStockoutAlert(region.name, stockoutRisks);
    await sendSlackNotification(region.slack_webhook_url, alert);
  }

  // Send deadstock alerts
  const deadstockItems = await getHighRiskDeadstock(region.region_id, analysisDate);
  if (deadstockItems.length > 0) {
    const alert = formatDeadstockAlert(region.name, deadstockItems);
    await sendSlackNotification(region.slack_webhook_url, alert);
  }
}
