import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  cookies().delete('auth-token')
  return NextResponse.json({ success: true })
}

export async function GET() {
  cookies().delete('auth-token')
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'))
}
