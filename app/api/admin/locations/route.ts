import { db } from '@/db'
import { locations } from '@/db/schema'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const result = await db.select().from(locations)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }
}
