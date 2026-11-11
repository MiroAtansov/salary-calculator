import type { DurationUnit } from './duration'

export type ItemKind = 'product' | 'service' | 'license'

export const ITEM_KINDS = [
  { value: 'product', label: 'Product' },
  { value: 'service', label: 'Service' },
  { value: 'license', label: 'License' },
] as const satisfies readonly { value: ItemKind; label: string }[]

/** How the unit cost is charged: once, or per hour, day or month of the duration. */
export type Billing = 'one-off' | DurationUnit

/** A product, service or license sold alongside the team, priced as cost plus markup. */
export interface Item {
  id: string
  kind: ItemKind
  name: string
  quantity: number
  /** Cost of one unit, once or per billing period. */
  unitCost: number
  markupRate: number
  billing: Billing
  /** Number of billing periods; ignored when billing is one-off. */
  duration: number
}

export interface ItemCost {
  item: Item
  /** Billing periods charged: 1 for one-off items. */
  periods: number
  /** Price of one unit for one billing period. */
  unitPrice: number
  cost: number
  markup: number
  revenue: number
  gm: number
  gmRate: number
}

export function itemCost(item: Item): ItemCost {
  const periods = item.billing === 'one-off' ? 1 : item.duration
  const cost = item.quantity * item.unitCost * periods
  const markup = cost * item.markupRate
  const revenue = cost + markup
  return {
    item,
    periods,
    unitPrice: item.unitCost * (1 + item.markupRate),
    cost,
    markup,
    revenue,
    gm: markup,
    gmRate: revenue !== 0 ? markup / revenue : 0,
  }
}

export function itemKindLabel(kind: ItemKind): string {
  return ITEM_KINDS.find((k) => k.value === kind)!.label
}

export function createItem(overrides: Partial<Item> = {}): Item {
  return {
    id: crypto.randomUUID(),
    kind: 'license',
    name: '',
    quantity: 1,
    unitCost: 0,
    markupRate: 0.2,
    billing: 'month',
    duration: 1,
    ...overrides,
  }
}

/** Items saved by an older version get any newer fields from the defaults. */
export function normalizeItem(stored: Partial<Item>): Item {
  return { ...createItem(), ...stored }
}
