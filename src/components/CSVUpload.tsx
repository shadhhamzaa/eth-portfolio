/* User MODS
MOD001 - FILE UPLOAD  Component to Browse, Pick and Save the file in memory and then read the file
MOD002 - SUPABASE INTEGRATION -   Bringing in portfolio rows to integrate with supabase



*/ 
'use client'                                                                 //Run this code in the browser and not on the server

import { useState } from 'react'
import { supabase, PortfolioRow } from '@/lib/supabase'

//MOD001 Start
export default function CSVUpload() { 
  const [file, setFile] = useState<File | null>(null)                       //The file here stores uploaded file   Use state - Data
  const [preview, setPreview] = useState<string[][]>([])                    //The preview here stores data inside file (stock csv)


    // MOD002    parsed state — stores cleaned portfolio rows ready to send to Supabase
  const [parsed, setParsed] = useState<PortfolioRow[]>([])

  // MOD002     status state — tracks save progress to show feedback to the user
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {    //runs when user selects a file
    const selected = e.target.files?.[0]                                    //Get the file the user picked
    if (!selected) return                                                   //If no file → stop
    setFile(selected)                                                       //Save the file in memory
    parseCSV(selected)                                                      // read file
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()                                     //built-in browser tool: Open and read file
    reader.onload = (e) => {                                            //runs after file is read
      const text = e.target?.result as string                           // converts to text
      const rows = text.trim().split('\n').map(row => row.split(','))   // formats content
      setPreview(rows)
      
      // MOD002   header mapping — normalises column names to lowercase so we can
      // handle different CSV formats (e.g. "Ticker" vs "ticker" vs "Symbol")
      const headers = rows[0].map(h => h.trim().toLowerCase())
      const dataRows = rows.slice(1).map(row => {
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { obj[h] = row[i]?.trim() || '' })

        // MOD002   maps raw CSV columns to PortfolioRow shape, checks multiple
        // possible column names to handle different broker CSV formats
        return {
          stock_ticker: obj['ticker'] || obj['symbol'] || '',
          stock_name: obj['name'] || obj['company'] || '',
          quantity: parseFloat(obj['quantity'] || obj['shares'] || '0'),
          average_price: parseFloat(obj['average price'] || obj['avg price'] || obj['price'] || '0'),
        } as PortfolioRow
      }).filter(row => row.stock_ticker !== '') // ADDED: removes empty rows with no ticker

      setParsed(dataRows)
    }
    reader.readAsText(file)                                             // reads the formatted
  }
// MOD001 End

// MOD002   saveToSupabase — sends all parsed rows to the portfolios table in one insert call
  const saveToSupabase = async () => {
    if (parsed.length === 0) return
    setStatus('saving')

    const { error } = await supabase.from('portfolios').insert(parsed)

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