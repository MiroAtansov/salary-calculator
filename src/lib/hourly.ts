import type { PricingRates } from './rates'

export interface HourlyRate {
  /** Monthly cost before markup, divided by the billable hours in a month. */
  hourlyCost: number
  hourlyMarkup: number
  hourlyRate: number
}

/** Hourly rate for one person, from their monthly cost before markup. */
export function hourlyRate(monthlyCostBeforeMarkup: number, rates: PricingRates): HourlyRate {
  const hourlyCost = rates.hoursPerMonth > 0 ? monthlyCostBeforeMarkup / rates.hoursPerMonth : 0
  const hourlyMarkup = hourlyCost * rates.hourlyMarkupRate
  return { hourlyCost, hourlyMarkup, hourlyRate: hourlyCost + hourlyMarkup }
}
