import { db } from '@/db'
import { skuPrices } from '@/db/schema'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sku_id, price_type, currency, unit_price, effective_from, effective_to } = body

    if (!sku_id || !price_type || !unit_price || !effective_from) {
      return NextResponse.json({ message: '필수 필드가 누락되었습니다.' }, { status: 400 })
    }

    const result = await db.insert(skuPrices).values({
      sku_id,
      price_type,
      currency: currency || 'CAD',
      unit_price,
      effective_from,
      effective_to: effective_to || null,
    })

    return NextResponse.json({ success: true, id: result.lastInsertRowid })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || '저장 실패' }, { status: 500 })
  }
}
