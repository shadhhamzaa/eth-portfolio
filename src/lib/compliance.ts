/* MOD004       Shariah compliance engine - Shariah compliance engine — screens stocks based on sector and financial ratios. 
                Uses AAOIFI standards: debt < 33% of assets, interest income < 5% of revenue.Returns a compliance status and 
                haram income percentage for tazkiyah calculation.
*/
import { FinancialData } from './fmp'

export type ComplianceResult = {
  status: 'halal' | 'doubtful' | 'haram'
  haramIncomePercentage: number
  reason: string
}

// Sectors that are outright haram regardless of financials
const HARAM_SECTORS = [
  'alcohol',
  'tobacco',
  'weapons',
  'defence',
  'gambling',
  'casino',
  'adult',
  'pornography',
  'banking',
  'insurance',
  'financials',
  'financial services',     // JP Morgan slipped out in testing as it had financial services, so adding that
  'diversified financials',
// ADDED: Polygon.io SIC descriptions for financial institutions
  'national commercial banks',
  'state commercial banks',
  'savings institutions',
  'credit unions',
  'mortgage bankers',
  'personal credit institutions',
  'federal-sponsored credit agencies',
  'security brokers',
  'investment offices',
  'fire, marine & casualty insurance',
  'life insurance',
  'accident and health insurance',
  'surety insurance',
  'insurance agents',
  'distilled and blended liquors',
  'malt beverages',
  'wines, brandy and brandy spirits',
  'services-miscellaneous amusement',
  'services-racing',
]

// Sectors that are generally considered halal
const HALAL_SECTORS = [
  'technology',
  'healthcare',
  'consumer staples',
  'industrials',
  'utilities',
  'real estate',
  'energy',
  'materials',
  'communication services',
  'consumer discretionary',
]

export function checkCompliance(data: FinancialData): ComplianceResult {
  const sectorLower = data.sector.toLowerCase()

  // Step 1 — Sector screen
  const isHaramSector = HARAM_SECTORS.some(s => sectorLower.includes(s))
  if (isHaramSector) {
    return {
      status: 'haram',
      haramIncomePercentage: 100,
      reason: `Sector "${data.sector}" is not Shariah compliant`,
    }
  }

  // Step 2 — Debt ratio screen (total debt / total assets < 33%)
  const debtRatio = data.totalAssets > 0 ? data.totalDebt / data.totalAssets : 0
  if (debtRatio > 0.33) {
    return {
      status: 'haram',
      haramIncomePercentage: debtRatio * 100,
      reason: `Debt ratio ${(debtRatio * 100).toFixed(1)}% exceeds 33% threshold`,
    }
  }

  // Step 3 — Interest income screen (interest income / revenue < 5%)
  const interestRatio = data.totalRevenue > 0 ? data.interestIncome / data.totalRevenue : 0
  if (interestRatio > 0.05) {
    return {
      status: 'haram',
      haramIncomePercentage: interestRatio * 100,
      reason: `Interest income ${(interestRatio * 100).toFixed(1)}% exceeds 5% threshold`,
    }
  }

  // Step 4 — Doubtful if ratios are close to limits
  if (debtRatio > 0.25 || interestRatio > 0.03) {
    return {
      status: 'doubtful',
      haramIncomePercentage: Math.max(debtRatio, interestRatio) * 100,
      reason: 'Ratios are within limits but approaching thresholds — exercise caution',
    }
  }

  // Step 5 — Passes all screens
  const isKnownHalalSector = HALAL_SECTORS.some(s => sectorLower.includes(s))
  return {
    status: 'halal',
    haramIncomePercentage: interestRatio * 100,
    reason: isKnownHalalSector
      ? `Sector "${data.sector}" is Shariah compliant and ratios are within limits`
      : 'Passes financial screens — verify sector manually',
  }
}