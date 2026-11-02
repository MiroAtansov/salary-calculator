import type { ReactNode } from 'react'
import { formatEur } from '../lib/money'
import type { Tone } from './BuildUpBar'
import styles from './Ledger.module.css'

export type LedgerLine =
  | { kind: 'item'; label: ReactNode; value: number; tone?: Tone; note?: string }
  | { kind: 'subtotal'; label: ReactNode; value: number }
  | { kind: 'total'; label: ReactNode; value: number }

/** Line-by-line cost build-up: items add up into subtotals, ending in the total. */
export function Ledger({ lines }: { lines: LedgerLine[] }) {
  return (
    <dl className={styles.ledger}>
      {lines.map((line, i) => (
        <div key={i} className={styles.row} data-kind={line.kind}>
          <dt className={styles.label}>
            {line.kind === 'item' && line.tone && (
              <span className={styles.swatch} data-tone={line.tone} aria-hidden="true" />
            )}
            {line.label}
            {line.kind === 'item' && line.note && <span className={styles.note}>{line.note}</span>}
          </dt>
          <dd className={styles.value}>{formatEur(line.value)}</dd>
        </div>
      ))}
    </dl>
  )
}
