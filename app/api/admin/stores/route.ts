import { db } from '@/db'
import { stores } from '@/db/schema'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const result = await db.select().from(stores)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { region_id, store_name, address_line1, address_line2, city, province, postal_code, country, shopify_customer_id, store_code } = body

    if (!region_id || !store_name) {
      return NextResponse.json({ message: '필수 필드가 누락되었습니다.' }, { status: 400 })
    }

    const result = await db.insert(stores).values({
      region_id,
      store_name,
      address_line1,
      address_line2,
      city,
      province,
      postal_code,
      country,
      shopify_customer_id,
      store_code,
      active: true,
    })

    return NextResponse.json({ success: true, id: result.lastInsertRowid })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || '저장 실패' }, { status: 500 })
  }
}
