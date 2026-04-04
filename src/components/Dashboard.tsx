/*
MOD006      Dashboard UI - Fetches portfolio holdings from Supabase, runs compliance checks on each stock, and displays a summary
            with per-stock compliance badges and tazkiyah totals.
 */

'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import type { PortfolioRow } from '@/lib/supabase'

type StockWithCompliance = PortfolioRow & {
  complianceStatus: 'halal' | 'doubtful' | 'haram' | 'loading' | 'error'
  reason: string
  tazkiyahAmount: number
  haramIncomePercentage: number
  currentPrice: number
  currentValue: number
}

// Badge colours for each compliance status
const statusStyles = {
  halal: 'bg-green-100 text-green-800',
  doubtful: 'bg-yellow-100 text-yellow-800',
  haram: 'bg-red-100 text-red-800',
  loading: 'bg-gray-100 text-gray-500',
  error: 'bg-gray-100 text-gray-400',
}

export default function Dashboard() {
  const supabase = createSupabaseBrowser()
  const [holdings, setHoldings] = useState<StockWithCompliance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHoldings()
  }, [])

  const loadHoldings = async () => {
    // ADDED: get current user and filter holdings by their user_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return setLoading(false)

    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)

    if (error || !data) return setLoading(false)

    // Step 2 — set holdings with loading status while we fetch compliance
    const initial: StockWithCompliance[] = data.map(row => ({
      ...row,
      complianceStatus: 'loading',
      reason: '',
      tazkiyahAmount: 0,
      haramIncomePercentage: 0,
      currentPrice: 0,
      currentValue: 0,
    }))
    setHoldings(initial)
    setLoading(false)

    // Step 3 — fetch compliance for each stock one by one
    // CHANGED: added 15 second delay between requests to avoid Alpha Vantage rate limiting, free teir supports 5 requests per min
    for (const row of data) {
      try {
        const res = await fetch(`/api/financials?ticker=${row.stock_ticker}&quantity=${row.quantity}`)
        const json = await res.json()

        if (!json.compliance || !json.tazkiyah) {
          setHoldings(prev =>
            prev.map(h =>
              h.stock_ticker === row.stock_ticker
                ? { ...h, complianceStatus: 'error', reason: 'Could not fetch compliance data' }
                : h
            )
          )
        } else {
          setHoldings(prev =>
            prev.map(h =>
              h.stock_ticker === row.stock_ticker
                ? {
                    ...h,
                    complianceStatus: json.compliance.status,
                    reason: json.compliance.reason,
                    tazkiyahAmount: json.tazkiyah.tazkiyahAmount,
                    haramIncomePercentage: json.compliance.haramIncomePercentage,
                    currentPrice: json.currentPrice || 0,
                    currentValue: json.currentValue || 0,
                  }
                : h
            )
          )
        }
      } catch {
        setHoldings(prev =>
          prev.map(h =>
            h.stock_ticker === row.stock_ticker
              ? { ...h, complianceStatus: 'error', reason: 'Failed to fetch' }
              : h
          )
        )
      }

      // ADDED: wait 15 seconds between each request to stay within free tier limit
      await new Promise(resolve => setTimeout(resolve, 15000))
    }
  }
  // Calculate summary stats
  const totalHoldings = holdings.length
  const halalCount = holdings.filter(h => h.complianceStatus === 'halal').length
  const doubtfulCount = holdings.filter(h => h.complianceStatus === 'doubtful').length
  const haramCount = holdings.filter(h => h.complianceStatus === 'haram').length
  const complianceScore = totalHoldings > 0 ? Math.round((halalCount / totalHoldings) * 100) : 0
  const totalTazkiyah = holdings.reduce((sum, h) => sum + h.tazkiyahAmount, 0)
  const totalPortfolioValue = holdings.reduce((sum, h) => sum + h.currentValue, 0) // ADDED: total portfolio value across all holdings
  const totalPnL = holdings.reduce((sum, h) => sum + ((h.currentPrice - h.average_price) * h.quantity), 0) // ADDED: total portfolio P&L across all holdings

  if (loading) return <p className="text-gray-500">Loading portfolio...</p>
  if (holdings.length === 0) return (
    <p className="text-gray-500">No holdings found. <a href="/upload" className="underline">Upload your portfolio</a></p>
  )

  return (
    <div className="space-y-8">

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-sm text-gray-500">Portfolio Value</p>
            <p className="text-3xl font-bold text-gray-900">£{totalPortfolioValue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-sm text-gray-500">Total P&L</p>
            <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>£{totalPnL.toFixed(2)}
            </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-500">Compliance Score</p>
          <p className="text-3xl font-bold text-gray-900">{complianceScore}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-500">Tazkiyah Owed</p>
          <p className="text-3xl font-bold text-gray-900">£{totalTazkiyah.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-500">Halal Holdings</p>
          <p className="text-3xl font-bold text-green-600">{halalCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-500">Haram / Doubtful</p>
          <p className="text-3xl font-bold text-red-500">{haramCount + doubtfulCount}</p>
        </div>
      </div>

      {/* Holdings table */}
    <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
                <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">Ticker</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">Quantity</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">Avg Price</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">Current Price</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">Value</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">P&L</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">Reason</th>
                    
                </tr>
            </thead>
            <tbody>
                {holdings.map((holding, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono font-bold">{holding.stock_ticker}</td>
                        <td className="px-6 py-4 text-gray-700">{holding.stock_name}</td>
                        <td className="px-6 py-4 text-gray-700">{holding.quantity}</td>
                        <td className="px-6 py-4 text-gray-700">£{holding.average_price}</td>
                        <td className="px-6 py-4 text-gray-700">${holding.currentPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-gray-700">£{holding.currentValue.toFixed(2)}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[holding.complianceStatus]}`}>
                                {holding.complianceStatus}
                            </span>
                        </td>
                        <td className={`px-6 py-4 font-medium ${(holding.currentPrice - holding.average_price) * holding.quantity >= 0 ? 
                        'text-green-600' : 'text-red-500'}`}>£{((holding.currentPrice - holding.average_price) * holding.quantity).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">{holding.reason}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
</div>
)
}