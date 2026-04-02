/*
MOD003      ALPHA_V API DATA -  Server-side API route that receives a ticker from the frontend and returns financial data from FMP. 
            Keeps the FMP API key secure on the server.
MOD004      Shariah compliance engine  - runs compliance check on fetched financial data and returns combined result
*/

import { NextRequest, NextResponse } from 'next/server'
import { fetchFinancialData } from '@/lib/fmp'
import { checkCompliance } from '@/lib/compliance'      //MOD004 Shariah compliance engine

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get('ticker')

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 })
  }

  const data = await fetchFinancialData(ticker)

  if (!data) {
    return NextResponse.json({ error: 'Could not fetch data' }, { status: 404 })
  }
    
  const compliance = checkCompliance(data)      // MOD004 run compliance check and attach result to response

  return NextResponse.json({ ...data, compliance })
}
