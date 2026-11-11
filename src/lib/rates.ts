/** Bulgarian statutory payroll rates for 2026, as used in "Salary Calculator 2026.xlsx". */
export interface StatutoryRates {
  /** Monthly cap on income subject to social security, in EUR. */
  maxInsurableIncome: number
  employeeSocialRate: number
  employerSocialRate: number
  incomeTaxRate: number
}

export const STATUTORY_2026: StatutoryRates = {
  maxInsurableIncome: 2300,
  employeeSocialRate: 0.1378,
  employerSocialRate: 0.1892,
  incomeTaxRate: 0.1,
}

/** Company pricing assumptions layered on top of payroll cost. Amounts are EUR per FTE per month. */
export interface PricingRates {
  benefitsPerFte: number
  insurancePerFte: number
  rentPerFte: number
  overheadRate: number
  markupRate: number
  /** Markup on top of the hourly cost (monthly cost before markup / hours per month). */
  hourlyMarkupRate: number
  /** Billable hours in a month, used for the hourly rate. */
  hoursPerMonth: number
  /** Hours in a working day, used for durations in days. */
  hoursPerDay: number
}

/** Rates from the salary calculator and the "NEW" sheet of the BOT calculator. */
export const STANDARD_RATES: PricingRates = {
  benefitsPerFte: 51.13,
  insurancePerFte: 50,
  rentPerFte: 135,
  overheadRate: 0.04,
  markupRate: 0.14,
  hourlyMarkupRate: 0.14,
  hoursPerMonth: 145,
  hoursPerDay: 8,
}

/** Rates from the single-position "BOT" template sheet of the BOT calculator. */
export const BOT_TEMPLATE_RATES: PricingRates = {
  ...STANDARD_RATES,
  rentPerFte: 200,
  overheadRate: 0.05,
  markupRate: 0.2,
  hourlyMarkupRate: 0.2,
}

export const RATE_PRESETS = [
  { id: 'standard', label: 'Standard', rates: STANDARD_RATES },
  { id: 'bot-template', label: 'BOT template', rates: BOT_TEMPLATE_RATES },
] as const

/** The rates a preset sets. Working time (hours per month and day) is kept when switching presets. */
export const PRESET_KEYS = [
  'benefitsPerFte',
  'insurancePerFte',
  'rentPerFte',
  'overheadRate',
  'markupRate',
  'hourlyMarkupRate',
] as const satisfies readonly (keyof PricingRates)[]

/** Rates saved by an older version may lack newer settings; fill them in from the standard rates. */
export function normalizeRates(stored: Partial<PricingRates> | null | undefined): PricingRates {
  return { ...STANDARD_RATES, ...stored }
}
