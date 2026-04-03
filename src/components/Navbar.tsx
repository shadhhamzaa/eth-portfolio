/*
MOD008      Portfolio value - Calculate total portfolio value and Simple navigation bar shown on every page — links between home, upload and dashboard.


*/
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/upload', label: 'Upload' },
    { href: '/dashboard', label: 'Dashboard' },
  ]
    return (
    <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
      {/* Logo / Brand */}
      <span className="font-bold text-lg tracking-tight">Eth Portfolio</span>

      {/* Nav links */}
      <div className="flex gap-6">
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
      </div>
    </nav>
  )
}
