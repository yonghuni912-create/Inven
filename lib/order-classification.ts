import { db } from '@/db';
import { routes, storeRoutes } from '@/db/schema';
import { eq, and, lte, or, isNull, gte } from 'drizzle-orm';
import { getDayOfWeek } from './datetime';

/**
 * Determine order type based on route and date
 */
export async function classifyOrderType(
  regionId: number,
  storeId: number | null,
  orderDate: Date,
  timezone: string
): Promise<{
  order_type: 'REGULAR' | 'EMERGENCY' | 'EXTRA';
  suggested_reason?: string;
}> {
  if (!storeId) {
    return {
      order_type: 'EMERGENCY',
      suggested_reason: 'Store not matched - requires manual assignment',
    };
  }

  const dayOfWeek = getDayOfWeek(orderDate, timezone);
  const dateStr = orderDate.toISOString().split('T')[0];

  // Get active route for this store on this date
  const activeRoutes = await db
    .select({
      route_id: routes.route_id,
      route_name: routes.name,
      active_days: routes.active_days,
    })
    .from(routes)
    .innerJoin(storeRoutes, eq(routes.route_id, storeRoutes.route_id))
    .where(
      and(
        eq(routes.region_id, regionId),
        eq(storeRoutes.store_id, storeId),
        eq(routes.active, true),
        lte(storeRoutes.effective_from, dateStr),
        or(
          isNull(storeRoutes.effective_to),
          gte(storeRoutes.effective_to, dateStr)
        )
      )
    );

  for (const route of activeRoutes) {
    const activeDays = route.active_days.split(',').map(d => d.trim());
    if (activeDays.includes(dayOfWeek)) {
      return { order_type: 'REGULAR' };
    }
  }

  // Not on regular route schedule
  return {
    order_type: 'EMERGENCY',
    suggested_reason: `Order placed outside regular route schedule (${dayOfWeek})`,
  };
}

/**
 * Get today's active routes for a region
 */
export async function getTodaysRoutes(
  regionId: number,
  timezone: string
): Promise<{ route_id: number; name: string; store_count: number }[]> {
  const today = new Date();
  const dayOfWeek = getDayOfWeek(today, timezone);
  const dateStr = today.toISOString().split('T')[0];

  const activeRoutes = await db
    .select({
      route_id: routes.route_id,
      name: routes.name,
      active_days: routes.active_days,
    })
    .from(routes)
    .where(
      and(
        eq(routes.region_id, regionId),
        eq(routes.active, true)
      )
    );

  const todaysRoutes = activeRoutes.filter(route => {
    const days = route.active_days.split(',').map(d => d.trim());
    return days.includes(dayOfWeek);
  });

  // Count stores for each route
  const result = [];
  for (const route of todaysRoutes) {
    const storeCount = await db
      .select({ count: storeRoutes.store_id })
      .from(storeRoutes)
      .where(
        and(
          eq(storeRoutes.route_id, route.route_id),
          lte(storeRoutes.effective_from, dateStr),
          or(
            isNull(storeRoutes.effective_to),
            gte(storeRoutes.effective_to, dateStr)
          )
        )
      );

    result.push({
      route_id: route.route_id,
      name: route.name,
      store_count: storeCount.length,
    });
  }

  return result;
}
