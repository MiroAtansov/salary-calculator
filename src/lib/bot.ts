import { employerSocialSecurity } from './salary'
import { ONE_MONTH, type Duration } from './duration'
import { hourlyRate, type HourlyRate } from './hourly'
import { STATUTORY_2026, type PricingRates, type StatutoryRates } from './rates'

/** One column of the BOT calculator: a position staffed by one or more FTEs. Amounts are monthly totals for all FTEs. */
export interface Position {
  id: string
  title: string
  ftes: number
  baseSalary: number
  /** Employer social security. `null` means estimate it from the average salary per FTE. */
  socialSecurity: number | null
  travel: number
  accommodation: number
  equipment: number
  /** Previous-month correction: holiday allowance, overtime, new hires, sick leave, vouchers. */
  adjustment: number
  /** How long the position is part of the offer. */
  duration: Duration
}

export interface PositionCost {
  position: Position
  benefits: number
  socialSecurity: number
  socialSecurityIsEstimate: boolean
  insurance: number
  rent: number
  overhead: number
  markup: number
  costPerProfile: number
  costPerFte: number
  invoiceAmount: number
  /** Hourly rate of one FTE, from the cost before markup. */
  hourly: HourlyRate
}

const TOTAL_KEYS = [
  'baseSalary',
  'benefits',
  'socialSecurity',
  'insurance',
  'travel',
  'accommodation',
  'equipment',
  'rent',
  'overhead',
  'markup',
  'costPerProfile',
  'adjustment',
  'invoiceAmount',
] as const

export type TeamTotals = Record<(typeof TOTAL_KEYS)[number] | 'ftes', number>

export interface TeamCost {
  positions: PositionCost[]
  totals: TeamTotals
}

/**
 * The spreadsheet takes employer social security as a manual figure, because it depends on each
 * person's salary. Without that, assume everyone earns the position's average salary.
 */
export function estimateSocialSecurity(
  ftes: number,
  baseSalary: number,
  s: StatutoryRates = STATUTORY_2026,
): number {
  if (ftes <= 0) return 0
  return ftes * employerSocialSecurity(baseSalary / ftes, s)
}

/** One column of the "BOT" / "NEW" sheets, rows 4–16. */
export function positionCost(
  position: Position,
  rates: PricingRates,
  s: StatutoryRates = STATUTORY_2026,
): PositionCost {
  const { ftes, baseSalary, travel, accommodation, equipment, adjustment } = position
  const socialSecurityIsEstimate = position.socialSecurity === null
  const socialSecurity = position.socialSecurity ?? estimateSocialSecurity(ftes, baseSalary, s)
  const benefits = ftes * rates.benefitsPerFte
  const insurance = ftes * rates.insurancePerFte
  const rent = ftes * rates.rentPerFte

  const payroll = baseSalary + benefits + socialSecurity + insurance
  // Overhead also covers travel and accommodation (rows 3–8); markup only applies to payroll (rows 3–6).
  const overhead = (payroll + travel + accommodation) * rates.overheadRate
  const markup = payroll * rates.markupRate
  const costPerProfile = payroll + travel + accommodation + equipment + rent + overhead + markup

  return {
    position,
    benefits,
    socialSecurity,
    socialSecurityIsEstimate,
    insurance,
    rent,
    overhead,
    markup,
    costPerProfile,
    costPerFte: ftes > 0 ? costPerProfile / ftes : 0,
    invoiceAmount: costPerProfile + adjustment,
    hourly: hourlyRate(ftes > 0 ? (costPerProfile - markup) / ftes : 0, rates),
  }
}

const AMOUNT_KEYS = ['ftes', ...TOTAL_KEYS] as const

/** Every summable figure of one position, inputs and results alike. */
export function lineAmounts(cost: PositionCost): TeamTotals {
  const merged = { ...cost.position, ...cost }
  return Object.fromEntries(AMOUNT_KEYS.map((key) => [key, merged[key]])) as TeamTotals
}

export function teamCost(
  positions: Position[],
  rates: PricingRates,
  s: StatutoryRates = STATUTORY_2026,
): TeamCost {
  const costs = positions.map((p) => positionCost(p, rates, s))
  const totals = Object.fromEntries(AMOUNT_KEYS.map((key) => [key, 0])) as TeamTotals

  for (const cost of costs) {
    const amounts = lineAmounts(cost)
    for (const key of AMOUNT_KEYS) totals[key] += amounts[key]
  }

  return { positions: costs, totals }
}

export function createPosition(overrides: Partial<Position> = {}): Position {
  return {
    id: crypto.randomUUID(),
    title: '',
    ftes: 1,
    baseSalary: 0,
    socialSecurity: null,
    travel: 0,
    accommodation: 0,
    equipment: 0,
    adjustment: 0,
    duration: ONE_MONTH,
    ...overrides,
  }
}

/** Positions saved by an older version get any newer fields from the defaults. */
export function normalizePosition(stored: Partial<Position>): Position {
  return { ...createPosition(), ...stored }
}

export type BreakdownKey = Exclude<keyof TeamTotals, 'ftes'>

/** Rows of the per-position breakdown, in the same order as the BOT spreadsheet. */
export const BREAKDOWN_ROWS: { key: BreakdownKey; label: string; strong?: boolean }[] = [
  { key: 'baseSalary', label: 'Base salary' },
  { key: 'benefits', label: 'Benefits' },
  { key: 'socialSecurity', label: 'Social security' },
  { key: 'insurance', label: 'Health and other insurance' },
  { key: 'travel', label: 'Travel expenses' },
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'rent', label: 'Rent and telecoms' },
  { key: 'overhead', label: 'Corporate overhead' },
  { key: 'markup', label: 'Markup' },
  { key: 'costPerProfile', label: 'Total monthly cost', strong: true },
  { key: 'adjustment', label: 'Previous-month adjustment' },
  { key: 'invoiceAmount', label: 'Amount for invoice', strong: true },
]
