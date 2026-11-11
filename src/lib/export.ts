import { BREAKDOWN_ROWS, lineAmounts, teamCost } from './bot'
import { formatDuration, unitName } from './duration'
import { itemKindLabel } from './items'
import { formatEur, formatPercent } from './money'
import { itemName, kindLabel, positionName, type Offer, type OfferLine, type OfferMeta } from './offer'
import type { PricingRates } from './rates'
import { offerLabel } from './share'

/** Internal: every cost, markup and margin. Client: final prices only. */
export type ExportVariant = 'internal' | 'client'

export type CellFormat = 'text' | 'eur' | 'percent' | 'number'

export interface ExportCell {
  value: string | number | null
  format?: CellFormat
}

export interface ExportTable {
  title: string
  header: string[]
  rows: ExportCell[][]
  /** Totals, shown in bold under the rows. */
  total?: ExportCell[]
}

export interface ExportDocument {
  variant: ExportVariant
  title: string
  subtitle: string
  tables: ExportTable[]
  fileName: string
}

export interface ExportInput {
  meta: OfferMeta
  offer: Offer
  rates: PricingRates
  date?: Date
}

const text = (value: string | null): ExportCell => ({ value, format: 'text' })
const eur = (value: number): ExportCell => ({ value, format: 'eur' })
const percent = (value: number): ExportCell => ({ value, format: 'percent' })
const num = (value: number): ExportCell => ({ value, format: 'number' })
const empty: ExportCell = { value: null }

/** What the unit price is for, e.g. "per FTE per month". */
export function priceUnit(line: OfferLine): string {
  const who = line.kind === 'position' ? 'per FTE' : 'per unit'
  return line.duration ? `${who} per ${unitName(line.duration.unit)}` : `${who}, one-off`
}

function durationText(line: OfferLine): string {
  return line.duration ? formatDuration(line.duration) : 'One-off'
}

function clientTable(offer: Offer): ExportTable {
  return {
    title: 'Offer',
    header: ['Item', 'Type', 'Quantity', 'Duration', 'Unit price', 'Price basis', 'Total price'],
    rows: offer.lines.map((l) => [
      text(l.name),
      text(kindLabel(l.kind)),
      num(l.quantity),
      text(durationText(l)),
      eur(l.unitPrice),
      text(priceUnit(l)),
      eur(l.revenue),
    ]),
    total: [text('Total'), empty, empty, empty, empty, empty, eur(offer.totals.revenue)],
  }
}

function internalOfferTable(offer: Offer): ExportTable {
  const { totals } = offer
  return {
    title: 'Offer: revenue and gross margin',
    header: ['Item', 'Type', 'Quantity', 'Duration', 'Unit price', 'Price basis', 'Cost', 'Revenue', 'GM', 'GM %'],
    rows: offer.lines.map((l) => [
      text(l.name),
      text(kindLabel(l.kind)),
      num(l.quantity),
      text(durationText(l)),
      eur(l.unitPrice),
      text(priceUnit(l)),
      eur(l.cost),
      eur(l.revenue),
      eur(l.gm),
      percent(l.gmRate),
    ]),
    total: [text('Total'), empty, empty, empty, empty, empty, eur(totals.cost), eur(totals.revenue), eur(totals.gm), percent(totals.gmRate)],
  }
}

function breakdownTable(offer: Offer, rates: PricingRates): ExportTable {
  const team = teamCost(
    offer.positions.map((p) => p.position),
    rates,
  )
  const columns = team.positions.map(lineAmounts)
  return {
    title: 'Positions: monthly cost breakdown',
    header: ['', ...team.positions.map((p, i) => positionName(p.position, i)), 'Total'],
    rows: [
      [text('FTEs'), ...columns.map((c) => num(c.ftes)), num(team.totals.ftes)],
      ...BREAKDOWN_ROWS.map((row) => [
        text(row.label),
        ...columns.map((c) => eur(c[row.key])),
        eur(team.totals[row.key]),
      ]),
      [text('Hourly cost per FTE'), ...team.positions.map((p) => eur(p.hourly.hourlyCost)), empty],
      [text('Hourly rate per FTE'), ...team.positions.map((p) => eur(p.hourly.hourlyRate)), empty],
    ],
  }
}

function itemsTable(offer: Offer): ExportTable {
  return {
    title: 'Products, services and licenses',
    header: ['Item', 'Type', 'Quantity', 'Unit cost', 'Billing', 'Duration', 'Cost', 'Markup %', 'Revenue', 'GM'],
    rows: offer.items.map((c, i) => [
      text(itemName(c.item, i)),
      text(itemKindLabel(c.item.kind)),
      num(c.item.quantity),
      eur(c.item.unitCost),
      text(c.item.billing === 'one-off' ? 'One-off' : `Per ${unitName(c.item.billing)}`),
      text(c.item.billing === 'one-off' ? '' : formatDuration({ amount: c.item.duration, unit: c.item.billing })),
      eur(c.cost),
      percent(c.item.markupRate),
      eur(c.revenue),
      eur(c.gm),
    ]),
  }
}

function assumptionsTable(rates: PricingRates): ExportTable {
  return {
    title: 'Pricing assumptions',
    header: ['Assumption', 'Value'],
    rows: [
      [text('Rent and telecoms per FTE'), eur(rates.rentPerFte)],
      [text('Benefits per FTE'), eur(rates.benefitsPerFte)],
      [text('Health insurance per FTE'), eur(rates.insurancePerFte)],
      [text('Corporate overhead'), percent(rates.overheadRate)],
      [text('Markup (monthly, on payroll)'), percent(rates.markupRate)],
      [text('Hourly markup'), percent(rates.hourlyMarkupRate)],
      [text('Hours per month'), num(rates.hoursPerMonth)],
      [text('Hours per day'), num(rates.hoursPerDay)],
    ],
  }
}

function slug(value: string): string {
  return (
    value
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'offer'
  )
}

export function buildExport(variant: ExportVariant, { meta, offer, rates, date = new Date() }: ExportInput): ExportDocument {
  const tables =
    variant === 'client'
      ? [clientTable(offer)]
      : [
          internalOfferTable(offer),
          ...(offer.positions.length > 0 ? [breakdownTable(offer, rates)] : []),
          ...(offer.items.length > 0 ? [itemsTable(offer)] : []),
          assumptionsTable(rates),
        ]
  const day = date.toISOString().slice(0, 10)

  return {
    variant,
    title: offerLabel(meta),
    subtitle:
      variant === 'client'
        ? `Prices in EUR, excluding VAT · ${day}`
        : `Internal cost calculation, not for the client · ${day}`,
    tables,
    fileName: `${slug(offerLabel(meta))}-${variant}-${day}.xlsx`,
  }
}

/** Display text of a cell, as used in the PDF. */
export function formatCell(cell: ExportCell): string {
  if (cell.value === null) return ''
  if (typeof cell.value === 'string') return cell.value
  switch (cell.format) {
    case 'eur':
      return formatEur(cell.value)
    case 'percent':
      return formatPercent(cell.value)
    default:
      return new Intl.NumberFormat('en-IE', { maximumFractionDigits: 2 }).format(cell.value)
  }
}
