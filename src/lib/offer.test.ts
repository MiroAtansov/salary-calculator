import { describe, expect, it } from 'vitest'
import { createPosition, positionCost } from './bot'
import { formatDuration, toHours } from './duration'
import { hourlyRate } from './hourly'
import { createItem, itemCost } from './items'
import { offerSummary } from './offer'
import { BOT_TEMPLATE_RATES, normalizeRates, STANDARD_RATES } from './rates'
import { profileCost } from './salary'

// 1 FTE at 1,000 gross with Standard rates: payroll 1,290.33, price 1,657.5894, markup 180.6462.
const oneFte = () => createPosition({ ftes: 1, baseSalary: 1000 })

describe('hourly rate', () => {
  it('divides the cost before markup by 145 hours and adds the hourly markup', () => {
    const { hourlyCost, hourlyMarkup, hourlyRate: rate } = hourlyRate(1450, STANDARD_RATES)
    expect(hourlyCost).toBe(10)
    expect(hourlyMarkup).toBeCloseTo(1.4, 10)
    expect(rate).toBeCloseTo(11.4, 10)
  })

  it('is zero without hours', () => {
    expect(hourlyRate(1450, { ...STANDARD_RATES, hoursPerMonth: 0 }).hourlyRate).toBe(0)
  })

  it('is per FTE for a position', () => {
    const cost = positionCost(createPosition({ ftes: 2, baseSalary: 2000 }), STANDARD_RATES)
    expect(cost.hourly.hourlyCost).toBeCloseTo(10.1858151724, 9)
    expect(cost.hourly.hourlyRate).toBeCloseTo(11.6118292966, 9)
  })

  it('matches the single profile calculation', () => {
    const { hourly } = profileCost(1000, STANDARD_RATES)
    expect(hourly.hourlyCost).toBeCloseTo(1476.9432 / 145, 9)
    expect(hourly.hourlyRate).toBeCloseTo(11.6118292966, 9)
  })
})

describe('durations', () => {
  it('converts days and months to hours', () => {
    expect(toHours({ amount: 10, unit: 'day' }, STANDARD_RATES)).toBe(80)
    expect(toHours({ amount: 2, unit: 'month' }, STANDARD_RATES)).toBe(290)
    expect(toHours({ amount: 5, unit: 'hour' }, STANDARD_RATES)).toBe(5)
  })

  it('formats singular and plural', () => {
    expect(formatDuration({ amount: 1, unit: 'month' })).toBe('1 month')
    expect(formatDuration({ amount: 2.5, unit: 'day' })).toBe('2.5 days')
  })
})

describe('items', () => {
  it('prices licenses as cost plus markup over the duration', () => {
    const cost = itemCost(createItem({ quantity: 3, unitCost: 20, markupRate: 0.25, billing: 'month', duration: 12 }))
    expect(cost.cost).toBe(720)
    expect(cost.revenue).toBe(900)
    expect(cost.gm).toBe(180)
    expect(cost.gmRate).toBe(0.2)
    expect(cost.unitPrice).toBe(25)
  })

  it('charges one-off items once whatever the duration', () => {
    const cost = itemCost(createItem({ quantity: 2, unitCost: 500, markupRate: 0.1, billing: 'one-off', duration: 6 }))
    expect(cost.cost).toBe(1000)
    expect(cost.revenue).toBeCloseTo(1100, 10)
  })
})

describe('offer', () => {
  it('prices a position in months at the monthly price, with the markup as GM', () => {
    const { lines } = offerSummary([{ ...oneFte(), duration: { amount: 6, unit: 'month' } }], [], STANDARD_RATES)
    expect(lines[0].revenue).toBeCloseTo(9945.5364, 6)
    expect(lines[0].gm).toBeCloseTo(1083.8772, 6)
    expect(lines[0].unitPrice).toBeCloseTo(1657.5894, 6)
  })

  it('prices a position in hours or days at the hourly rate', () => {
    const hours = offerSummary([{ ...oneFte(), duration: { amount: 80, unit: 'hour' } }], [], STANDARD_RATES)
    expect(hours.lines[0].revenue).toBeCloseTo(928.9463437241, 6)
    expect(hours.lines[0].cost).toBeCloseTo(814.8652137931, 6)

    const days = offerSummary(
      [createPosition({ ftes: 2, baseSalary: 2000, duration: { amount: 10, unit: 'day' } })],
      [],
      STANDARD_RATES,
    )
    expect(days.lines[0].revenue).toBeCloseTo(1857.8926874483, 6)
    expect(days.lines[0].unitPrice).toBeCloseTo(11.6118292966 * 8, 6)
  })

  it('leaves the previous-month adjustment out of the offer', () => {
    const { lines } = offerSummary([{ ...oneFte(), adjustment: 500 }], [], STANDARD_RATES)
    expect(lines[0].revenue).toBeCloseTo(1657.5894, 6)
  })

  it('totals positions and items', () => {
    const offer = offerSummary(
      [oneFte()],
      [createItem({ quantity: 3, unitCost: 20, markupRate: 0.25, billing: 'month', duration: 12 })],
      STANDARD_RATES,
    )
    expect(offer.totals.revenue).toBeCloseTo(1657.5894 + 900, 6)
    expect(offer.totals.gm).toBeCloseTo(180.6462 + 180, 6)
    expect(offer.totals.cost).toBeCloseTo(offer.totals.revenue - offer.totals.gm, 6)
    expect(offer.totals.gmRate).toBeCloseTo(offer.totals.gm / offer.totals.revenue, 10)
    expect(offer.lines.map((l) => l.name)).toEqual(['Position 1', 'License 1'])
  })

  it('handles an empty offer', () => {
    expect(offerSummary([], [], STANDARD_RATES).totals).toEqual({ cost: 0, revenue: 0, gm: 0, gmRate: 0 })
  })
})

describe('normalizeRates', () => {
  it('fills settings missing from rates saved before hourly rates existed', () => {
    const { hourlyMarkupRate: _a, hoursPerMonth: _b, hoursPerDay: _c, ...old } = BOT_TEMPLATE_RATES
    expect(normalizeRates(old)).toEqual({ ...BOT_TEMPLATE_RATES, hourlyMarkupRate: 0.14 })
  })
})
