import { hourlyRate, type HourlyRate } from './hourly'
import { round2 } from './money'
import { STATUTORY_2026, type PricingRates, type StatutoryRates } from './rates'

/** Employee contributions at the insurable income cap (316.94 EUR in 2026). */
function employeeSocialCap(s: StatutoryRates): number {
  return round2(s.maxInsurableIncome * s.employeeSocialRate)
}

/** Net salary above which the employee contributions are capped (1784.75 EUR in 2026). */
export function cappedNetThreshold(s: StatutoryRates = STATUTORY_2026): number {
  return round2(s.maxInsurableIncome * (1 - s.employeeSocialRate) * (1 - s.incomeTaxRate))
}

/** "Net calculator" sheet, B3. */
export function grossFromNet(net: number, s: StatutoryRates = STATUTORY_2026): number {
  const afterTax = net / (1 - s.incomeTaxRate)
  return round2(
    net > cappedNetThreshold(s) ? afterTax + employeeSocialCap(s) : afterTax / (1 - s.employeeSocialRate),
  )
}

export interface NetBreakdown {
  gross: number
  employeeSocialSecurity: number
  incomeTax: number
  net: number
}

/** Splits a gross salary into what the employee pays and takes home. */
export function netFromGross(gross: number, s: StatutoryRates = STATUTORY_2026): NetBreakdown {
  const employeeSocialSecurity = round2(Math.min(gross, s.maxInsurableIncome) * s.employeeSocialRate)
  const incomeTax = round2((gross - employeeSocialSecurity) * s.incomeTaxRate)
  return { gross, employeeSocialSecurity, incomeTax, net: round2(gross - employeeSocialSecurity - incomeTax) }
}

/**
 * Breakdown for a net salary the user typed in. Income tax absorbs the cent of rounding left over
 * from `grossFromNet`, so the net shown is exactly the net entered.
 */
export function breakdownForNet(net: number, s: StatutoryRates = STATUTORY_2026): NetBreakdown {
  const gross = grossFromNet(net, s)
  const { employeeSocialSecurity } = netFromGross(gross, s)
  return { gross, employeeSocialSecurity, incomeTax: round2(gross - employeeSocialSecurity - net), net }
}

/** "Social Security***" row: employer contributions, capped at the max insurable income. */
export function employerSocialSecurity(gross: number, s: StatutoryRates = STATUTORY_2026): number {
  return round2(Math.min(gross, s.maxInsurableIncome) * s.employerSocialRate)
}

export interface ProfileCost {
  gross: number
  benefits: number
  employerSocialSecurity: number
  insurance: number
  payrollCost: number
  rent: number
  overhead: number
  markup: number
  costPerProfile: number
  annualPayrollCost: number
  annualCostPerProfile: number
  /** Hourly rate from the cost before markup. */
  hourly: HourlyRate
}

/** "Net calculator" B3:B11 and "FLC" B3:B6 — monthly cost of one profile from its gross salary. */
export function profileCost(
  gross: number,
  rates: PricingRates,
  s: StatutoryRates = STATUTORY_2026,
): ProfileCost {
  const benefits = rates.benefitsPerFte
  const insurance = rates.insurancePerFte
  const ss = employerSocialSecurity(gross, s)
  const payrollCost = gross + benefits + ss + insurance
  const overhead = payrollCost * rates.overheadRate
  const markup = payrollCost * rates.markupRate
  const costPerProfile = payrollCost + rates.rentPerFte + overhead + markup

  return {
    gross,
    benefits,
    employerSocialSecurity: ss,
    insurance,
    payrollCost,
    rent: rates.rentPerFte,
    overhead,
    markup,
    costPerProfile,
    annualPayrollCost: payrollCost * 12,
    annualCostPerProfile: costPerProfile * 12,
    hourly: hourlyRate(costPerProfile - markup, rates),
  }
}
