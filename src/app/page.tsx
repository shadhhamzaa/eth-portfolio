/*
MOD009      Landing page upgrade. 
*/

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-8">
      <h1 className="text-5xl font-bold text-gray-900 mb-4">Eth Portfolio</h1>
      <p className="text-lg text-gray-500 max-w-md mb-8">
        Check your stock portfolio for Shariah compliance, calculate your tazkiyah, and invest with confidence.
      </p>

      <div className="flex gap-4">
        <Link
          href="/upload"
          className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Upload Portfolio
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-white text-black border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          View Dashboard
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full text-left">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-2xl mb-2">📂</p>
          <h3 className="font-semibold text-gray-900 mb-1">Upload CSV</h3>
          <p className="text-sm text-gray-500">Import your holdings directly from Trading 212 or any broker CSV export.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-2xl mb-2">✅</p>
          <h3 className="font-semibold text-gray-900 mb-1">Check Compliance</h3>
          <p className="text-sm text-gray-500">Every stock is screened against AAOIFI Shariah standards automatically.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-2xl mb-2">🕌</p>
          <h3 className="font-semibold text-gray-900 mb-1">Calculate Tazkiyah</h3>
          <p className="text-sm text-gray-500">Know exactly how much to purify based on your dividends received.</p>
        </div>
      </div>
    </main>
  )
}