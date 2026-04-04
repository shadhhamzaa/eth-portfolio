/*
MOD011   -   Supabase Auth  - Middleware runs on every request before the page loads, redirects unauthenticated users to login page if they try to access
                               protected routes like /dashboard or /upload
*/


import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // If user is not logged in and tries to access protected routes, redirect to login
  const protectedRoutes = ['/dashboard', '/upload']
  const isProtected = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is already logged in and visits login page, redirect to dashboard
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard', '/upload', '/login']
}