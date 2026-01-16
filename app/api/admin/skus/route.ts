import { db } from '@/db'
import { skus } from '@/db/schema'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const result = await db.select().from(skus)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch skus' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sku_code, name, pack_size, moq, lead_time_days, safety_stock_days, expiry_managed, abc_grade, active } = body

    if (!sku_code || !name) {
      return NextResponse.json({ message: 'SKU 코드와 이름은 필수입니다.' }, { status: 400 })
    }

    const result = await db.insert(skus).values({
      sku_code,
      name,
      pack_size: pack_size || 1,
      moq: moq || 1,
      lead_time_days: lead_time_days || 0,
      safety_stock_days: safety_stock_days || 0,
      expiry_managed: expiry_managed || false,
      abc_grade: abc_grade || null,
      active: active !== false,
    })

    return NextResponse.json({ success: true, id: result.lastInsertRowid })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || '저장 실패' }, { status: 500 })
  }
}
