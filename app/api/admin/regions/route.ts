import { db } from '@/db'
import { regions } from '@/db/schema'
import { NextRequest, NextResponse } from 'next/server'
import { encrypt } from '@/lib/encryption'

export async function GET() {
  try {
    const result = await db.select().from(regions)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, timezone, run_days, analytics_time, docs_time, shop_domain, admin_token, webhook_secret, store_match_method } = body

    if (!name || !timezone || !shop_domain || !admin_token || !webhook_secret) {
      return NextResponse.json({ message: '필수 필드가 누락되었습니다.' }, { status: 400 })
    }

    const result = await db.insert(regions).values({
      name,
      timezone,
      run_days: run_days || 'Mon,Tue,Wed,Thu,Fri',
      analytics_time: analytics_time || '06:00',
      docs_time: docs_time || '07:00',
      shop_domain,
      admin_token_enc: encrypt(admin_token),
      webhook_secret_enc: encrypt(webhook_secret),
      store_match_method: store_match_method || 'CUSTOMER',
      active: true,
    })

    return NextResponse.json({ success: true, id: result.lastInsertRowid })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || '저장 실패' }, { status: 500 })
  }
}
