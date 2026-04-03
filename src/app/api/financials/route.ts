/*
MOD003      ALPHA_V API DATA -  Server-side API route that receives a ticker from the frontend and returns financial data from FMP. 
            Keeps the FMP API key secure on the server.
MOD004      Shariah compliance engine  - runs compliance check on fetched financial data and returns combined result
MOD005      Tazkiyah Calculator   - Server-side API route that returns financial data, compliance result and tazkiyah amount.
*/

import { NextRequest, NextResponse } from 'next/server'
import { fetchFinancialData, fetchDividends  } from '@/lib/fmp'         
import { checkCompliance } from '@/lib/compliance'      //MOD004 Shariah compliance engine
import { calculateTazkiyah } from '@/lib/tazkiyah'      //MOD005 Tazkiyah Calculator
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)


export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get('ticker')

  // MOD005 - Tazkiyah Calculator : dividends param — how much the user received in dividends for this stock
  // CHANGED: quantity now passed in so we can calculate total dividends received
  const quantity = parseFloat(request.nextUrl.searchParams.get('quantity') || '0')

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 })
  }



  // Step 1 — check cache in Supabase
  const { data: cached } = await supabase
    .from('compliance_cache')
    .select('*')
    .eq('ticker', ticker)
    .single()

  // Step 2 — if cache exists and is less than 30 days old, return it
  if (cached) {
    const fetchedAt = new Date(cached.fetched_at)
    const ageInDays = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24)

    if (ageInDays < 30) {
        const dividendData = await fetchDividends(ticker)
        const dividendsReceived = dividendData.annualDividendPerShare * quantity
        const tazkiyah = calculateTazkiyah(ticker, dividendsReceived, cached.haram_income_percentage)
        return NextResponse.json({
            ticker: cached.ticker,
            companyName: cached.company_name,
            sector: cached.sector,
            compliance: {
                status: cached.compliance_status,
                haramIncomePercentage: cached.haram_income_percentage,
                reason: cached.reason,
            },
            dividendsReceived: parseFloat(dividendsReceived.toFixed(2)),
            tazkiyah,
            fromCache: true,
        })
    }
  }

  // Step 3 — cache miss or expired, fetch fresh data from Polygon.io
  const data = await fetchFinancialData(ticker)
  if (!data) {
    return NextResponse.json({ error: 'Could not fetch data' }, { status: 404 })
  }
    
  const compliance = checkCompliance(data)      // MOD004 run compliance check and attach result to response
   // ADDED: fetch dividends and calculate total received based on quantity held
  const dividendData = await fetchDividends(ticker)
  const dividendsReceived = dividendData.annualDividendPerShare * quantity
  // MOD005: calculate tazkiyah using haram income % from compliance result
  const tazkiyah = calculateTazkiyah(ticker, dividendsReceived, compliance.haramIncomePercentage) 

  
    // Step 4 — save result to cache for next time
  await supabase.from('compliance_cache').upsert({
    ticker,
    company_name: data.companyName,
    sector: data.sector,
    total_revenue: data.totalRevenue,
    interest_income: data.interestIncome,
    total_debt: data.totalDebt,
    total_assets: data.totalAssets,
    compliance_status: compliance.status,
    haram_income_percentage: compliance.haramIncomePercentage,
    reason: compliance.reason,
    fetched_at: new Date().toISOString(),
  }, { onConflict: 'ticker' })

   return NextResponse.json({ ...data, compliance, dividendsReceived, tazkiyah, fromCache: false })
}

