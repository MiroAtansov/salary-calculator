import { normalizePosition, type Position } from './bot'
import { formatDuration } from './duration'
import { normalizeItem, type Item } from './items'
import { formatEur, formatPercent } from './money'
import { EMPTY_META, type Offer, type OfferMeta } from './offer'
import { normalizeRates, type PricingRates } from './rates'

/** Everything needed to reopen a calculation from a link. */
export interface SharedOffer {
  positions: Position[]
  items: Item[]
  rates: PricingRates
  meta: OfferMeta
}

const VERSION = 1
export const SHARE_PARAM = 'q'

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

async function transform(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const output = new Blob([bytes as BlobPart]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(output).arrayBuffer())
}

/** Compressed, URL-safe token for a calculation. */
export async function encodeShare(offer: SharedOffer): Promise<string> {
  const json = JSON.stringify({ v: VERSION, ...offer })
  return toBase64Url(await transform(new TextEncoder().encode(json), new CompressionStream('deflate-raw')))
}

/** Reads a token made by `encodeShare`; `null` if it is damaged or from an unknown version. */
export async function decodeShare(token: string): Promise<SharedOffer | null> {
  try {
    const bytes = await transform(fromBase64Url(token), new DecompressionStream('deflate-raw'))
    const data = JSON.parse(new TextDecoder().decode(bytes))
    if (data?.v !== VERSION || !Array.isArray(data.positions)) return null
    return {
      positions: data.positions.map(normalizePosition),
      items: Array.isArray(data.items) ? data.items.map(normalizeItem) : [],
      rates: normalizeRates(data.rates),
      meta: { ...EMPTY_META, ...data.meta },
    }
  } catch {
    return null
  }
}

/** The token in a location hash such as `#q=…`, if any. */
export function shareTokenFromHash(hash: string): string | null {
  return new URLSearchParams(hash.replace(/^#/, '')).get(SHARE_PARAM)
}

export function shareUrl(token: string, location: Pick<Location, 'origin' | 'pathname'>): string {
  return `${location.origin}${location.pathname}#${SHARE_PARAM}=${token}`
}

export function offerLabel(meta: OfferMeta): string {
  return [meta.title.trim() || 'Offer', meta.client.trim()].filter(Boolean).join(' – ')
}

export interface ApprovalEmail {
  subject: string
  body: string
}

/** Approval request text. `withLines` adds one line per position and item. */
export function approvalEmail(
  meta: OfferMeta,
  offer: Offer,
  link: string,
  note: string,
  withLines = true,
): ApprovalEmail {
  const { totals } = offer
  const parts = [
    note.trim(),
    `Please approve the cost calculation for ${offerLabel(meta)} before it is sent to the client.`,
    [
      `Revenue: ${formatEur(totals.revenue)}`,
      `Cost: ${formatEur(totals.cost)}`,
      `Gross margin: ${formatEur(totals.gm)} (${formatPercent(totals.gmRate)})`,
    ].join('\n'),
    withLines
      ? offer.lines
          .map((l) => {
            const duration = l.duration ? `, ${formatDuration(l.duration)}` : ''
            return `- ${l.name} (${l.quantity}${duration}): ${formatEur(l.revenue)}, GM ${formatPercent(l.gmRate)}`
          })
          .join('\n')
      : '',
    `Full calculation: ${link}`,
    'The internal export with all costs is attached.',
  ]
  return { subject: `Approval: ${offerLabel(meta)}`, body: parts.filter(Boolean).join('\n\n') }
}

export function mailtoUrl(to: string, email: ApprovalEmail): string {
  return `mailto:${encodeURIComponent(to.trim()).replace(/%40/g, '@')}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`
}

/** Many mail clients cut off longer mailto links. */
export const MAILTO_LIMIT = 1800
