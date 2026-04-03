/*
MOD006      Dashboard UI   Main dashboard page — fetches all portfolio holdings from Supabase and displays compliance status, 
scores and tazkiyah summary.

*/

import Dashboard from '@/components/Dashboard'

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-900">Eth Portfolio</h1>
      <p className="text-gray-500 mt-1 mb-8">Your halal investment dashboard</p>
      <Dashboard />
    </main>
  )
}