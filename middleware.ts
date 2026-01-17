import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'inven-secret-key-change-in-production')

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth/login', '/api/auth/seed-admin', '/api/admin/seed', '/api/health']
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Check for auth token
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    // Redirect to login page
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  try {
    // Verify JWT token
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch {
    // Token is invalid, redirect to login
    const loginUrl = new URL('/login', request.url)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('auth-token')
    return response
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
  ]
}
