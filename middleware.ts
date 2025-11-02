import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect renter routes
  if (req.nextUrl.pathname.startsWith('/my-bookings') || 
      req.nextUrl.pathname.startsWith('/favorites') ||
      req.nextUrl.pathname.startsWith('/profile')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Protect owner routes
  if (req.nextUrl.pathname.startsWith('/owner')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Check if user is owner
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (user?.role !== 'owner' && user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/my-bookings/:path*',
    '/favorites/:path*',
    '/profile/:path*',
    '/owner/:path*',
    '/admin/:path*'
  ]
}

