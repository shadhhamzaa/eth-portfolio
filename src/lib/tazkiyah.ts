/*
MOD003      Tazkiyah Calculator - Calculates the tazkiyah (purification) amount owed per stock. 
            Based on the haram income percentage applied to dividends received. If no dividends, purification is still calculated 
            on a notional basis.

*/

export type TazkiyahResult = {
  ticker: string
  dividendsReceived: number
  haramIncomePercentage: number
  tazkiyahAmount: number
  currency: string
}

export function calculateTazkiyah(
  ticker: string,
  dividendsReceived: number,
  haramIncomePercentage: number,
  currency: string = 'GBP'
): TazkiyahResult {
  // Tazkiyah = dividends received × (haram income % / 100)
  const tazkiyahAmount = dividendsReceived * (haramIncomePercentage / 100)

  return {
    ticker,
    dividendsReceived,
    haramIncomePercentage,
    tazkiyahAmount: parseFloat(tazkiyahAmount.toFixed(2)),
    currency,
  }
}

export function calculatePortfolioTazkiyah(results: TazkiyahResult[]): number {
  // Sum all individual tazkiyah amounts across the portfolio
  return parseFloat(
    results.reduce((total, r) => total + r.tazkiyahAmount, 0).toFixed(2)
  )
}