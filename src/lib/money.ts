/** Mirrors Excel's ROUND(x, 2): halves round away from zero, and float noise like 1.005 → 100.49999 is ignored. */
export function round2(value: number): number {
  const sign = Math.sign(value)
  return (sign * Math.round(Number((Math.abs(value) * 100).toPrecision(15)))) / 100
}

const LOCALE = 'en-IE'

const eurFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const wholeEurFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  maximumFractionDigits: 2,
})

export function formatEur(value: number): string {
  return eurFormatter.format(value)
}

export function formatEurWhole(value: number): string {
  return wholeEurFormatter.format(value)
}

export function formatPercent(rate: number): string {
  return percentFormatter.format(rate)
}

/** Parses user input that may use a comma or dot as decimal separator and spaces as grouping. */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[\s€]/g, '').replace(',', '.')
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}
