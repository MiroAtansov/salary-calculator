import { positionCost, type Position, type PositionCost } from './bot'
import { toHours, type Duration } from './duration'
import { itemCost, itemKindLabel, type Item, type ItemCost, type ItemKind } from './items'
import type { PricingRates } from './rates'

export type OfferLineKind = 'position' | ItemKind

/** One line of the offer, priced over its whole duration. */
export interface OfferLine {
  id: string
  kind: OfferLineKind
  name: string
  /** FTEs for a position, units for an item. */
  quantity: number
  /** `null` for one-off items. */
  duration: Duration | null
  /** Price of one FTE or unit per duration unit (or once, for one-off items). */
  unitPrice: number
  cost: number
  revenue: number
  /** Gross margin: the markup. Rent, overhead, travel and equipment count as cost. */
  gm: number
  gmRate: number
}

export interface OfferTotals {
  cost: number
  revenue: number
  gm: number
  gmRate: number
}

export interface Offer {
  positions: PositionCost[]
  items: ItemCost[]
  lines: OfferLine[]
  totals: OfferTotals
}

/** Offer details used in exports and the approval email. */
export interface OfferMeta {
  title: string
  client: string
}

export const EMPTY_META: OfferMeta = { title: '', client: '' }

export function positionName(position: Position, index: number): string {
  return position.title.trim() || `Position ${index + 1}`
}

export function itemName(item: Item, index: number): string {
  return item.name.trim() || `${itemKindLabel(item.kind)} ${index + 1}`
}

export function kindLabel(kind: OfferLineKind): string {
  return kind === 'position' ? 'Position' : itemKindLabel(kind)
}

/**
 * A position over its duration. Months use the monthly price; hours and days use the hourly rate,
 * so they carry the hourly markup instead. The previous-month adjustment is a billing correction and
 * is not part of the offer.
 */
export function positionLine(cost: PositionCost, name: string, rates: PricingRates): OfferLine {
  const { position, hourly } = cost
  const { duration, ftes } = position

  let unitPrice: number
  let revenue: number
  let lineCost: number
  if (duration.unit === 'month') {
    unitPrice = cost.costPerFte
    revenue = cost.costPerProfile * duration.amount
    lineCost = (cost.costPerProfile - cost.markup) * duration.amount
  } else {
    const hours = toHours(duration, rates)
    unitPrice = hourly.hourlyRate * (duration.unit === 'day' ? rates.hoursPerDay : 1)
    revenue = hourly.hourlyRate * ftes * hours
    lineCost = hourly.hourlyCost * ftes * hours
  }

  const gm = revenue - lineCost
  return {
    id: position.id,
    kind: 'position',
    name,
    quantity: ftes,
    duration,
    unitPrice,
    cost: lineCost,
    revenue,
    gm,
    gmRate: revenue !== 0 ? gm / revenue : 0,
  }
}

export function itemLine(cost: ItemCost, name: string): OfferLine {
  const { item } = cost
  return {
    id: item.id,
    kind: item.kind,
    name,
    quantity: item.quantity,
    duration: item.billing === 'one-off' ? null : { amount: item.duration, unit: item.billing },
    unitPrice: cost.unitPrice,
    cost: cost.cost,
    revenue: cost.revenue,
    gm: cost.gm,
    gmRate: cost.gmRate,
  }
}

export function offerSummary(positions: Position[], items: Item[], rates: PricingRates): Offer {
  const positionCosts = positions.map((p) => positionCost(p, rates))
  const itemCosts = items.map(itemCost)
  const lines = [
    ...positionCosts.map((c, i) => positionLine(c, positionName(c.position, i), rates)),
    ...itemCosts.map((c, i) => itemLine(c, itemName(c.item, i))),
  ]

  const cost = lines.reduce((sum, l) => sum + l.cost, 0)
  const revenue = lines.reduce((sum, l) => sum + l.revenue, 0)
  const gm = revenue - cost
  return {
    positions: positionCosts,
    items: itemCosts,
    lines,
    totals: { cost, revenue, gm, gmRate: revenue !== 0 ? gm / revenue : 0 },
  }
}
