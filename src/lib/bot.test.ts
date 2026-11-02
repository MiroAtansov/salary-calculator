import { describe, expect, it } from 'vitest'
import { createPosition, estimateSocialSecurity, positionCost, teamCost } from './bot'
import { BOT_TEMPLATE_RATES, STANDARD_RATES } from './rates'

// Columns of the "NEW" sheet in "BOT Calculator.xlsx", with its computed results.
const NEW_SHEET = [
  { title: 'Teamlead', ftes: 2, baseSalary: 8194, socialSecurity: 870, travel: 0, adjustment: 11, cost: 11204.1868 },
  { title: 'HR Admin', ftes: 8, baseSalary: 16954, socialSecurity: 3201, travel: 0, adjustment: 54, cost: 25817.5672 },
  { title: 'Operations Resource Planner', ftes: 3, baseSalary: 7936, socialSecurity: 1305, travel: 0, adjustment: 11, cost: 11667.3802 },
  { title: 'Recruiting Admin', ftes: 3, baseSalary: 6330, socialSecurity: 1179, travel: 0, adjustment: 27, cost: 9623.6202 },
  { title: 'Payroll Admin', ftes: 3, baseSalary: 5660, socialSecurity: 1071, travel: 0, adjustment: 31, cost: 8705.5802 },
  { title: 'Roster Admin', ftes: 20, baseSalary: 38051, socialSecurity: 7097, travel: 1305, adjustment: -87, cost: 59718.508 },
  { title: 'Junior Vacation Planner', ftes: 3, baseSalary: 2901, socialSecurity: 549, travel: 0, adjustment: 82, cost: 4834.0002 },
  { title: 'T&A Admin', ftes: 2, baseSalary: 1815, socialSecurity: 60, travel: 0, adjustment: 0, cost: 2721.1668 },
  { title: 'Production Forecast and Data Analyst', ftes: 2, baseSalary: 5309, socialSecurity: 870, travel: 0, adjustment: -72, cost: 7799.8868 },
  { title: 'IT Application Specialist', ftes: 1, baseSalary: 4552, socialSecurity: 435, travel: 0, adjustment: 0, cost: 6138.9934 },
]

describe('NEW sheet', () => {
  const positions = NEW_SHEET.map(({ cost: _cost, ...p }) => createPosition(p))
  const team = teamCost(positions, STANDARD_RATES)

  it.each(NEW_SHEET.map((row, i) => ({ ...row, i })))('$title costs $cost', ({ i, cost, adjustment }) => {
    expect(team.positions[i].costPerProfile).toBeCloseTo(cost, 6)
    expect(team.positions[i].invoiceAmount).toBeCloseTo(cost + adjustment, 6)
  })

  it('totals the amount for invoice', () => {
    expect(team.totals.invoiceAmount).toBeCloseTo(148287.8898, 6)
    expect(team.totals.ftes).toBe(47)
  })
})

describe('BOT template sheet', () => {
  it('matches the empty template', () => {
    const result = positionCost(createPosition({ socialSecurity: 0 }), BOT_TEMPLATE_RATES)
    expect(result.overhead).toBeCloseTo(5.0565, 6)
    expect(result.markup).toBeCloseTo(20.226, 6)
    expect(result.invoiceAmount).toBeCloseTo(326.4125, 6)
  })

  it('applies overhead to travel and accommodation but not equipment', () => {
    const result = positionCost(
      createPosition({
        ftes: 3,
        baseSalary: 7500,
        socialSecurity: 1305,
        travel: 400,
        accommodation: 250,
        equipment: 90,
        adjustment: -40,
      }),
      BOT_TEMPLATE_RATES,
    )
    expect(result.overhead).toBeCloseTo(487.9195, 6)
    expect(result.markup).toBeCloseTo(1821.678, 6)
    expect(result.costPerProfile).toBeCloseTo(12757.9875, 6)
    expect(result.invoiceAmount).toBeCloseTo(12717.9875, 6)
  })
})

describe('estimateSocialSecurity', () => {
  it('caps each FTE at the max insurable income', () => {
    // 4097 per FTE is above the 2300 cap, so each pays 435.16.
    expect(estimateSocialSecurity(2, 8194)).toBeCloseTo(870.32, 6)
  })

  it('is used when no manual figure is given', () => {
    const result = positionCost(createPosition({ ftes: 1, baseSalary: 1000 }), STANDARD_RATES)
    expect(result.socialSecurityIsEstimate).toBe(true)
    expect(result.socialSecurity).toBe(189.2)
  })

  it('is zero for a position without FTEs', () => {
    expect(estimateSocialSecurity(0, 1000)).toBe(0)
  })
})
