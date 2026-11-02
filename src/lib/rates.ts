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
}

/** Rates from the salary calculator and the "NEW" sheet of the BOT calculator. */
export const STANDARD_RATES: PricingRates = {
  benefitsPerFte: 51.13,
  insurancePerFte: 50,
  rentPerFte: 135,
  overheadRate: 0.04,
  markupRate: 0.14,
}

/** Rates from the single-position "BOT" template sheet of the BOT calculator. */
export const BOT_TEMPLATE_RATES: PricingRates = {
  ...STANDARD_RATES,
  rentPerFte: 200,
  overheadRate: 0.05,
  markupRate: 0.2,
}

export const RATE_PRESETS = [
  { id: 'standard', label: 'Standard', rates: STANDARD_RATES },
  { id: 'bot-template', label: 'BOT template', rates: BOT_TEMPLATE_RATES },
] as const
