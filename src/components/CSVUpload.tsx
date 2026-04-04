/* User MODS
MOD001 - FILE UPLOAD  Component to Browse, Pick and Save the file in memory and then read the file
MOD002 - SUPABASE INTEGRATION -   Bringing in portfolio rows to integrate with supabase
MOD010 - TRADING212 CSV CONSIDERATION - Upgrading for Trading212 CSVs.
MOD011 - SUPABASE AUTH 


// ADDED: get supabase browser client to fetch current user
const supabase = createSupabaseBrowser()
*/ 
'use client'                                                                 //Run this code in the browser and not on the server

import { useState } from 'react'
//import { supabase, PortfolioRow } from '@/lib/supabase'
import { createSupabaseBrowser } from '@/lib/supabase-browser'            //MOD011 - SUPABASE AUTH 
import type { PortfolioRow } from '@/lib/supabase'



//MOD001 Start
export default function CSVUpload() { 
  
  const supabase = createSupabaseBrowser()
  /*
  const [file, setFile] = useState<File | null>(null)                       //The file here stores uploaded file   Use state - Data
  const [preview, setPreview] = useState<string[][]>([])                    //The preview here stores data inside file (stock csv)
  */

  // MOD011 - SUPABASE AUTH  Changing the code as now Auth is in place. 
  const [preview, setPreview] = useState<string[][]>([])              
  const [parsed, setParsed] = useState<PortfolioRow[]>([])
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

    // MOD002    parsed state — stores cleaned portfolio rows ready to send to Supabase
  //const [parsed, setParsed] = useState<PortfolioRow[]>([])

  // MOD002     status state — tracks save progress to show feedback to the user
  //const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  
  // CSV creating duplicates from multiple uploads, so clearning database everytime a new upload goes in
  const [clearStatus, setClearStatus] = useState<'idle' | 'clearing' | 'cleared'>('idle')  
/*
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {    //runs when user selects a file
    const selected = e.target.files?.[0]                                    //Get the file the user picked
    if (!selected) return
     // Auto-clear the supabase DB just before a new file is uploaded to avoid duplicates 
    await supabase.from('portfolios').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setFile(selected)                                                       //Save the file in memory
    parseCSV(selected)                                                      // read file
  }
*/

// MOD011 : only delete current user's rows, not everyone's
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const selected = e.target.files?.[0]
  if (!selected) return

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('portfolios').delete().eq('user_id', user.id)
  }

  parseCSV(selected)
}
  const parseCSV = (file: File) => {
    const reader = new FileReader()                                     //built-in browser tool: Open and read file
    reader.onload = (e) => {                                            //runs after file is read
      const text = e.target?.result as string                           // converts to text
      const rows = text.trim().split('\n').map(row => row.split(','))   // formats content
      setPreview(rows)
      
      // MOD002   header mapping — normalises column names to lowercase so we can
      // handle different CSV formats (e.g. "Ticker" vs "ticker" vs "Symbol")
      const headers = rows[0].map(h => h.trim().toLowerCase().replace(/"/g, '')) //they have "action, so replaced with blank aka removed

      // ADDED: temporary debug log
      console.log('Headers detected:', headers)
      console.log('Is Trading 212:', headers.includes('action'))
      console.log('First header raw:', JSON.stringify(headers[0]))
      // MOD010: Trading 212 parser — detects if this is a T212 export by checking
      // for 'action' column which is unique to Trading212 transaction history csv format 
      const isTrading212 = headers.includes('action')

      if (isTrading212) {
        // Group transactions by ticker
        const holdingsMap: Record<string, { totalShares: number, totalCost: number, name: string }> = {}
        rows.slice(1).forEach(row => {
          const obj: Record<string, string> = {}
          headers.forEach((h, i) => { obj[h] = row[i]?.trim().replace(/"/g, '') || '' })
          const action = obj['action']?.toLowerCase()
          const ticker = obj['ticker']
          const name = obj['name']
          const shares = parseFloat(obj['no. of shares'] || '0')
          const price = parseFloat(obj['price / share'] || '0')
          
          // Only process buy and sell actions, skip deposits and other rows
          if (!ticker || (!action.includes('buy') && !action.includes('sell'))) return

          if (!holdingsMap[ticker]) {
            holdingsMap[ticker] = { totalShares: 0, totalCost: 0, name }
          }
          
          if (action.includes('buy')) {
            // MOD010: accumulate shares and cost for average price calculation
            holdingsMap[ticker].totalShares += shares
            holdingsMap[ticker].totalCost += shares * price
          } else if (action.includes('sell')) {
            // MOD010: reduce shares on sell, adjust cost proportionally
            const avgPrice = holdingsMap[ticker].totalCost / holdingsMap[ticker].totalShares
            holdingsMap[ticker].totalShares -= shares
            holdingsMap[ticker].totalCost -= shares * avgPrice
          }
        })
        // MOD010: convert map to PortfolioRow array, filter out fully sold positions
        const dataRows = Object.entries(holdingsMap)
          .filter(([, h]) => h.totalShares > 0.0001)
          .map(([ticker, h]) => ({
            stock_ticker: ticker,
            stock_name: h.name,
            quantity: parseFloat(h.totalShares.toFixed(6)),
            average_price: parseFloat((h.totalCost / h.totalShares).toFixed(2)),
          } as PortfolioRow))

        setParsed(dataRows)
         } else {
        // MOD010: fallback to generic parser for non Trading 212 CSVs

        const dataRows = rows.slice(1).map(row => {
          const obj: Record<string, string> = {}
          headers.forEach((h, i) => { obj[h] = row[i]?.trim() || '' })
          return {
            stock_ticker: obj['ticker'] || obj['symbol'] || '',
            stock_name: obj['name'] || obj['company'] || '',
            quantity: parseFloat(obj['quantity'] || obj['shares'] || '0'),
            average_price: parseFloat(obj['average price'] || obj['avg price'] || obj['price'] || '0'),
          } as PortfolioRow
        }).filter(row => row.stock_ticker !== '')

        setParsed(dataRows)
      }
    }
    reader.readAsText(file)
  }
// MOD001 End

// MOD002   saveToSupabase — sends all parsed rows to the portfolios table in one insert call
  const saveToSupabase = async () => {
    if (parsed.length === 0) return
    setStatus('saving')

  // Get current logged in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    setStatus('error')
    return
  }
    // Attach user_id to every row
  const rowsWithUser = parsed.map(row => ({
    ...row,
    user_id: user.id,
  }))


  const { error } = await supabase.from('portfolios').insert(rowsWithUser)
  if (error) {
    console.error(error)
    setStatus('error')
  } else {
    setStatus('saved')
  }
}

  return (
    <div className="mt-8">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select your CSV file
      </label>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-black file:text-white hover:file:bg-gray-800"
      />

      {preview.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <p className="text-sm text-gray-500 mb-2">Preview ({preview.length - 1} rows detected)</p>
          <table className="min-w-full text-sm border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {preview[0].map((header, i) => (
                  <th key={i} className="px-4 py-2 text-left font-medium text-gray-600 border-b">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.slice(1, 6).map((row, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2 text-gray-700">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {/* MOD002 save button and status messages — gives user control over
              when to save and shows clear feedback on success or failure */}
          <button
            onClick={saveToSupabase}
            disabled={status === 'saving'}
            className="mt-4 px-6 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {status === 'saving' ? 'Saving...' : 'Save Portfolio'}
          </button>
          {status === 'saved' && <p className="mt-2 text-green-600 text-sm">✅ Portfolio saved successfully!</p>}
          {status === 'error' && <p className="mt-2 text-red-600 text-sm">❌ Something went wrong. Check the console.</p>}
        </div>
      )}
    </div>
  )
}