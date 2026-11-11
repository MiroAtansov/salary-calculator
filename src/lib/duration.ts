import type { PricingRates } from './rates'

export type DurationUnit = 'hour' | 'day' | 'month'

export interface Duration {
  amount: number
  unit: DurationUnit
}

export const DURATION_UNITS = [
  { value: 'hour', label: 'Hours', singular: 'hour', plural: 'hours' },
  { value: 'day', label: 'Days', singular: 'day', plural: 'days' },
  { value: 'month', label: 'Months', singular: 'month', plural: 'months' },
] as const satisfies readonly { value: DurationUnit; label: string; singular: string; plural: string }[]

export const ONE_MONTH: Duration = { amount: 1, unit: 'month' }

export function toHours(duration: Duration, rates: PricingRates): number {
  const perUnit = { hour: 1, day: rates.hoursPerDay, month: rates.hoursPerMonth }[duration.unit]
  return duration.amount * perUnit
}

const amountFormatter = new Intl.NumberFormat('en-IE', { maximumFractionDigits: 2 })

export function unitName(unit: DurationUnit, amount = 1): string {
  const info = DURATION_UNITS.find((u) => u.value === unit)!
  return amount === 1 ? info.singular : info.plural
}

export function formatDuration(duration: Duration): string {
  return `${amountFormatter.format(duration.amount)} ${unitName(duration.unit, duration.amount)}`
}
