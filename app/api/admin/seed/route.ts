import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export async function GET() {
  try {
    const adminEmail = 'admin@bbq.com'
    
    // Check if admin already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1)

    if (existing) {
      return NextResponse.json({ 
        message: 'Admin user already exists', 
        user_id: existing.user_id,
        email: existing.email 
      })
    }

    // Create admin user
    const [newAdmin] = await db.insert(users).values({
      email: adminEmail,
      password_hash: hashPassword('admin123'),
      name: 'BBQ Admin',
      role: 'ADMIN',
      active: true,
    }).returning()

    return NextResponse.json({ 
      message: 'Admin user created successfully',
      user_id: newAdmin.user_id,
      email: newAdmin.email,
    })
  } catch (error) {
    console.error('Seed admin error:', error)
    return NextResponse.json({ 
      error: 'Failed to seed admin user', 
      details: String(error) 
    }, { status: 500 })
  }
}
