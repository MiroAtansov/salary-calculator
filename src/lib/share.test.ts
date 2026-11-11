import { describe, expect, it } from 'vitest'
import { createPosition } from './bot'
import { buildExport, formatCell } from './export'
import { createItem } from './items'
import { offerSummary } from './offer'
import { STANDARD_RATES } from './rates'
import { approvalEmail, decodeShare, encodeShare, mailtoUrl, shareTokenFromHash, shareUrl } from './share'

const positions = [createPosition({ title: 'Payroll Admin', ftes: 3, baseSalary: 5660, socialSecurity: 1071 })]
const items = [createItem({ name: 'HR system', quantity: 3, unitCost: 20, markupRate: 0.25, billing: 'month', duration: 12 })]
const meta = { title: 'HR outsourcing', client: 'Acme' }
const offer = offerSummary(positions, items, STANDARD_RATES)

describe('share link', () => {
  it('round-trips a calculation', async () => {
    const token = await encodeShare({ positions, items, rates: STANDARD_RATES, meta })
    expect(token).toMatch(/^[\w-]+$/)
    expect(await decodeShare(token)).toEqual({ positions, items, rates: STANDARD_RATES, meta })
  })

  it('rejects damaged tokens', async () => {
    expect(await decodeShare('not-a-token')).toBeNull()
  })

  it('reads the token from the hash', () => {
    const url = shareUrl('abc', { origin: 'https://x.test', pathname: '/calc/' })
    expect(url).toBe('https://x.test/calc/#q=abc')
    expect(shareTokenFromHash('#q=abc')).toBe('abc')
    expect(shareTokenFromHash('')).toBeNull()
  })
})

describe('approval email', () => {
  it('summarises revenue, cost and margin with the link', () => {
    const email = approvalEmail(meta, offer, 'https://x.test/#q=abc', 'Hi Maria')
    expect(email.subject).toBe('Approval: HR outsourcing – Acme')
    expect(email.body).toContain('Hi Maria')
    expect(email.body).toContain('Gross margin:')
    expect(email.body).toContain('- HR system (3, 12 months)')
    expect(email.body).toContain('https://x.test/#q=abc')
    expect(approvalEmail(meta, offer, 'l', '', false).body).not.toContain('HR system')
    expect(mailtoUrl('boss@firm.com', email)).toMatch(/^mailto:boss@firm\.com\?subject=Approval/)
  })
})

describe('exports', () => {
  it('keeps costs and margins out of the client export', () => {
    const doc = buildExport('client', { meta, offer, rates: STANDARD_RATES })
    const headers = doc.tables.flatMap((t) => t.header).join(' ')
    expect(headers).not.toMatch(/Cost|GM|Markup/i)
    expect(doc.tables[0].rows).toHaveLength(2)
    expect(doc.tables[0].total?.at(-1)?.value).toBeCloseTo(offer.totals.revenue, 6)
    expect(doc.fileName).toMatch(/^hr-outsourcing-acme-client-\d{4}-\d{2}-\d{2}\.xlsx$/)
  })

  it('shows every cost in the internal export', () => {
    const doc = buildExport('internal', { meta, offer, rates: STANDARD_RATES })
    expect(doc.tables.map((t) => t.title)).toEqual([
      'Offer: revenue and gross margin',
      'Positions: monthly cost breakdown',
      'Products, services and licenses',
      'Pricing assumptions',
    ])
    const breakdown = doc.tables[1].rows.map((r) => r[0].value)
    expect(breakdown).toContain('Markup')
    expect(breakdown).toContain('Hourly rate per FTE')
  })

  it('formats cells for the PDF', () => {
    expect(formatCell({ value: 1234.5, format: 'eur' })).toBe('€1,234.50')
    expect(formatCell({ value: 0.2, format: 'percent' })).toBe('20%')
    expect(formatCell({ value: null })).toBe('')
  })
})
