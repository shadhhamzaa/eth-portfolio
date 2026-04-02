/*
MOD003      ALPHA_V API DATA - Fetches financial data from Financial Modeling Prep API for a given stock ticker.
            Returns key figures needed for Shariah compliance checks — mainly income statement data.
 */
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY

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
    // Fetch company overview — contains sector, debt, revenue and more in one call
    const res = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`
    )
    const data = await res.json()

    // If ticker not found or API limit hit, data will be empty
    if (!data || !data.Symbol) return null

    return {
      ticker: data.Symbol,
      companyName: data.Name,
      sector: data.Sector,
      totalRevenue: parseFloat(data.RevenueTTM) || 0,
      interestIncome: 0, // Alpha Vantage overview doesn't break this out — handled in compliance engine
      totalDebt: parseFloat(data.TotalDebt) || 0, // not always available on free tier
      totalAssets: parseFloat(data.TotalAssets) || 0,
    }
  } catch (error) {
    console.error(`Failed to fetch data for ${ticker}:`, error)
    return null
  }
}
