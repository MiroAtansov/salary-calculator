import { formatEurWhole, formatPercent } from '../lib/money'
import styles from './BuildUpBar.module.css'

export type Tone = 'salary' | 'deductions' | 'employer' | 'extras' | 'operations' | 'markup'

export interface Segment {
  key: string
  label: string
  value: number
  tone: Tone
}

/** Stacked bar showing which share of the client price each cost layer makes up. */
export function BuildUpBar({ segments }: { segments: Segment[] }) {
  const visible = segments.filter((s) => s.value > 0)
  const total = visible.reduce((sum, s) => sum + s.value, 0)

  return (
    <figure className={styles.figure}>
      <div className={styles.bar} role="img" aria-label="Share of the price per cost layer">
        {visible.map((s) => (
          <span
            key={s.key}
            className={styles.segment}
            data-tone={s.tone}
            style={{ flexGrow: s.value }}
            title={`${s.label}: ${formatEurWhole(s.value)}`}
          />
        ))}
      </div>
      <figcaption>
        <ul className={styles.legend}>
          {visible.map((s) => (
            <li key={s.key} className={styles.item}>
              <span className={styles.swatch} data-tone={s.tone} aria-hidden="true" />
              <span className={styles.itemLabel}>{s.label}</span>
              <span className={styles.share}>{formatPercent(total ? s.value / total : 0)}</span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
