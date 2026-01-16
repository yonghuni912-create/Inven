import { db } from '@/db'
import { routes } from '@/db/schema'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const result = await db.select().from(routes)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { region_id, name, active_days, cutoff_time, active } = body

    if (!region_id || !name) {
      return NextResponse.json({ message: '필수 필드가 누락되었습니다.' }, { status: 400 })
    }

    const result = await db.insert(routes).values({
      region_id,
      name,
      active_days: active_days || 'Mon,Wed,Fri',
      cutoff_time,
      active: active !== false,
    })

    return NextResponse.json({ success: true, id: result.lastInsertRowid })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || '저장 실패' }, { status: 500 })
  }
}
