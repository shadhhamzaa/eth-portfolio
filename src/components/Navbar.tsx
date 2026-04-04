/*
MOD008      Portfolio value - Calculate total portfolio value and Simple navigation bar shown on every page — links between home, upload and dashboard.
MOD011   -   Supabase Auth  - added auth state — shows login or logout button based on session



*/
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'                 //useRouter MOD011   -   Supabase Auth    
import { useEffect, useState } from 'react'                             //MOD011   -   Supabase Auth 
import { createSupabaseBrowser } from '@/lib/supabase-browser'          //MOD011   -   Supabase Auth 
import type { Session } from '@supabase/supabase-js'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createSupabaseBrowser()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // ADDED: check if user is logged in on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email || null)
    }
    getUser()

    // ADDED: listen for auth changes so navbar updates instantly on login/logout
    /*
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null)
    })
    */
    // CHANGED: added explicit type to _event parameter to fix TypeScript error
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
  setUserEmail(session?.user?.email || null)
  })


    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const links = [
    { href: '/', label: 'Home' },
    { href: '/upload', label: 'Upload' },
    { href: '/dashboard', label: 'Dashboard' },
  ]
  return (
    <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
      <span className="font-bold text-lg tracking-tight">Eth Portfolio</span>

      <div className="flex items-center gap-6">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium transition-colors ${
              pathname === link.href
                ? 'text-black border-b-2 border-black pb-0.5'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            {link.label}
          </Link>
        ))}

        {/* MOD011: show user email and logout if logged in, login button if not */}
        {userEmail ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium px-4 py-1.5 border rounded-lg hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}
