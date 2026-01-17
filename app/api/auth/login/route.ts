import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'inven-secret-key-change-in-production')

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// Ensure admin user exists on first login attempt
async function ensureAdminExists() {
  const adminEmail = 'admin@bbq.com'
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1)

  if (!existing) {
    try {
      await db.insert(users).values({
        email: adminEmail,
        password_hash: hashPassword('admin123'),
        name: 'BBQ Admin',
        role: 'ADMIN',
        active: true,
      })
      console.log('Admin user created automatically')
    } catch (e) {
      console.error('Failed to create admin:', e)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력하세요.' }, { status: 400 })
    }

    // Auto-create admin if not exists
    await ensureAdminExists()

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    // Check password
    const passwordHash = hashPassword(password)
    if (user.password_hash !== passwordHash) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    // Check if active
    if (!user.active) {
      return NextResponse.json({ error: '비활성화된 계정입니다.' }, { status: 403 })
    }

    // Create JWT token
    const token = await new SignJWT({
      userId: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '로그인 처리 중 오류가 발생했습니다.', details: String(error) }, { status: 500 })
  }
}
