import { useId } from 'react'
import { DurationField } from '../../components/DurationField'
import { PencilIcon, TrashIcon } from '../../components/Icons'
import { NumberField } from '../../components/NumberField'
import { Stepper } from '../../components/Stepper'
import { estimateSocialSecurity, type Position, type PositionCost } from '../../lib/bot'
import { formatDuration } from '../../lib/duration'
import { formatEur, formatPercent } from '../../lib/money'
import type { OfferLine } from '../../lib/offer'
import type { PricingRates } from '../../lib/rates'
import styles from './PositionEditor.module.css'

interface PositionEditorProps {
  cost: PositionCost
  line: OfferLine
  rates: PricingRates
  fallbackTitle: string
  onChange: (patch: Partial<Position>) => void
  onRemove?: () => void
}

const EXTRAS = [
  { key: 'travel', label: 'Travel expenses' },
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'adjustment', label: 'Previous-month adjustment' },
] as const

export function PositionEditor({ cost, line, rates, fallbackTitle, onChange, onRemove }: PositionEditorProps) {
  const titleId = useId()
  const { position } = cost
  const estimate = estimateSocialSecurity(position.ftes, position.baseSalary)
  const extrasInUse = EXTRAS.filter(({ key }) => position[key] !== 0).length

  return (
    <article className={styles.card} aria-label={position.title || fallbackTitle}>
      <header className={styles.header}>
        <label htmlFor={titleId} className={styles.visuallyHidden}>
          Position title
        </label>
        <label htmlFor={titleId} className={styles.titleField}>
          <input
            id={titleId}
            className={styles.title}
            value={position.title}
            placeholder={fallbackTitle}
            onChange={(e) => onChange({ title: e.target.value })}
          />
          <PencilIcon />
        </label>
        {onRemove && (
          <button type="button" className={styles.remove} onClick={onRemove}>
            <TrashIcon />
            Remove
          </button>
        )}
      </header>

      <div className={styles.fields}>
        <Stepper label="FTEs" value={position.ftes} onChange={(ftes) => onChange({ ftes })} />
        <NumberField
          label="Base salary, all FTEs"
          unit="€"
          value={position.baseSalary}
          onChange={(baseSalary) => onChange({ baseSalary: baseSalary ?? 0 })}
          min={0}
        />
        <NumberField
          label="Employer social security"
          unit="€"
          value={position.socialSecurity}
          placeholder={estimate.toFixed(2)}
          nullable
          min={0}
          onChange={(socialSecurity) => onChange({ socialSecurity })}
          hint={
            cost.socialSecurityIsEstimate ? (
              'Estimated from the average salary'
            ) : (
              <button type="button" className={styles.link} onClick={() => onChange({ socialSecurity: null })}>
                Use estimate of {formatEur(estimate)}
              </button>
            )
          }
        />
      </div>

      <div className={styles.durationRow}>
        <DurationField
          label="Duration in the offer"
          amount={position.duration.amount}
          unit={position.duration.unit}
          onChange={(amount, unit) => onChange({ duration: { amount, unit } })}
          hint={
            position.duration.unit === 'month'
              ? 'Priced at the monthly price'
              : `Priced at the hourly rate, ${rates.hoursPerDay} h per day`
          }
        />
        <dl className={styles.hourly}>
          <div>
            <dt>Hourly cost per FTE</dt>
            <dd>{formatEur(cost.hourly.hourlyCost)}</dd>
          </div>
          <div>
            <dt>Hourly rate, {formatPercent(rates.hourlyMarkupRate)} markup</dt>
            <dd>{formatEur(cost.hourly.hourlyRate)}</dd>
          </div>
        </dl>
      </div>

      <details className={styles.extras} open={extrasInUse > 0 || undefined}>
        <summary>
          Travel, equipment and adjustments
          {extrasInUse > 0 && <span className={styles.count}>{extrasInUse} in use</span>}
        </summary>
        <div className={styles.extrasGrid}>
          {EXTRAS.map(({ key, label }) => (
            <NumberField
              key={key}
              label={label}
              unit="€"
              value={position[key]}
              onChange={(value) => onChange({ [key]: value ?? 0 })}
              min={key === 'adjustment' ? undefined : 0}
              hint={key === 'adjustment' ? 'Holiday allowance, overtime, new hires, sick leave, vouchers' : undefined}
            />
          ))}
        </div>
      </details>

      <footer className={styles.footer}>
        <div>
          <span>Per FTE</span>
          <strong>{formatEur(cost.costPerFte)}</strong>
        </div>
        <div>
          <span>Monthly invoice</span>
          <strong>{formatEur(cost.invoiceAmount)}</strong>
        </div>
        <div>
          <span>Offer, {formatDuration(position.duration)}</span>
          <strong>{formatEur(line.revenue)}</strong>
        </div>
      </footer>
    </article>
  )
}
