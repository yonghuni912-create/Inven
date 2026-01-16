import { db } from '@/db'
import { movements, inventory } from '@/db/schema'
import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { from_location_id, to_location_id, sku_id, qty, reason } = body

    if (!from_location_id || !to_location_id || !sku_id || !qty) {
      return NextResponse.json({ message: '필수 필드가 누락되었습니다.' }, { status: 400 })
    }

    // Check if source has enough inventory
    const sourceInventory = await db
      .select()
      .from(inventory)
      .where(and(eq(inventory.location_id, from_location_id), eq(inventory.sku_id, sku_id)))
      .limit(1)

    if (!sourceInventory[0] || sourceInventory[0].on_hand_qty < qty) {
      return NextResponse.json({ message: '출발지에 충분한 재고가 없습니다.' }, { status: 400 })
    }

    // Get region_id from source inventory
    const region_id = sourceInventory[0].region_id

    // Create transfer movement
    await db.insert(movements).values({
      region_id,
      movement_type: 'TRANSFER',
      sku_id,
      from_location_id,
      to_location_id,
      qty,
      reason: reason || 'Manual transfer',
    })

    // Update source inventory (decrease)
    await db
      .update(inventory)
      .set({ 
        on_hand_qty: sourceInventory[0].on_hand_qty - qty,
        updated_at_utc: new Date().toISOString()
      })
      .where(eq(inventory.inventory_id, sourceInventory[0].inventory_id))

    // Update or create destination inventory (increase)
    const destInventory = await db
      .select()
      .from(inventory)
      .where(and(eq(inventory.location_id, to_location_id), eq(inventory.sku_id, sku_id)))
      .limit(1)

    if (destInventory[0]) {
      await db
        .update(inventory)
        .set({ 
          on_hand_qty: destInventory[0].on_hand_qty + qty,
          updated_at_utc: new Date().toISOString()
        })
        .where(eq(inventory.inventory_id, destInventory[0].inventory_id))
    } else {
      await db.insert(inventory).values({
        region_id,
        location_id: to_location_id,
        sku_id,
        on_hand_qty: qty,
        reserved_qty: 0,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || '이동 실패' }, { status: 500 })
  }
}
