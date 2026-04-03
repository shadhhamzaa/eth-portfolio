/*
MOD003      ALPHA_V API DATA - Fetches financial data from Financial Modeling Prep API for a given stock ticker.
            Returns key figures needed for Shariah compliance checks — mainly income statement data.
 */
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY
const POLYGON_API_KEY = process.env.POLYGON_API_KEY

export type FinancialData = {
  ticker: string
  companyName: string
  sector: string
  totalRevenue: number
  interestIncome: number
  totalDebt: number
  totalAssets: number
}

export async function fetchFinancialData(ticker: string): Promise<FinancialData | null> {
  try {
    // Fetch company details — gives us name and sector
    const detailsRes = await fetch(
      `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${POLYGON_API_KEY}`
    )
    const detailsData = await detailsRes.json()
    const details = detailsData.results
    if (!details) return null

    // Fetch financials — gives us revenue, debt, assets
    const financialsRes = await fetch(
      `https://api.polygon.io/vX/reference/financials?ticker=${ticker}&limit=1&apiKey=${POLYGON_API_KEY}`
    )
    const financialsData = await financialsRes.json()
    const financials = financialsData.results?.[0]?.financials

    const incomeStatement = financials?.income_statement
    const balanceSheet = financials?.balance_sheet

    return {
      ticker,
      companyName: details.name || ticker,
      sector: details.sic_description || 'Unknown',
      totalRevenue: incomeStatement?.revenues?.value || 0,
      interestIncome: incomeStatement?.interest_expense?.value || 0,
      totalDebt: balanceSheet?.long_term_debt?.value || 0,
      totalAssets: balanceSheet?.assets?.value || 0,
    }
  } catch (error) {
    console.error(`Failed to fetch data for ${ticker}:`, error)
    return null
  }
}

// CHANGED: switched to previous close endpoint which is available on free tier
export async function fetchCurrentPrice(ticker: string): Promise<number> {
  try {
    const res = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`
    )
    const data = await res.json()
    return data.results?.[0]?.c || 0  // c = closing price
  } catch {
    return 0
  }
}


// ADDED: fetches last 12 months of dividends and sums them up per share
export async function fetchDividends(ticker: string): Promise<DividendData> {
  try {
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const fromDate = oneYearAgo.toISOString().split('T')[0]

    const res = await fetch(
      `https://api.polygon.io/v3/reference/dividends?ticker=${ticker}&ex_dividend_date.gte=${fromDate}&limit=10&apiKey=${POLYGON_API_KEY}`
    )
    const data = await res.json()

    // Sum all dividend payments over the last year
    const annualDividendPerShare = (data.results || []).reduce(
      (sum: number, d: { cash_amount: number }) => sum + (d.cash_amount || 0), 0
    )

    return { ticker, annualDividendPerShare }
  } catch (error) {
    console.error(`Failed to fetch dividends for ${ticker}:`, error)
    return { ticker, annualDividendPerShare: 0 }
  }
}