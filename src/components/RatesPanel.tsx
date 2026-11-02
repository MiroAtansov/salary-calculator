import { formatEur, formatPercent, round2 } from '../lib/money'
import { RATE_PRESETS, STATUTORY_2026, type PricingRates } from '../lib/rates'
import { NumberField } from './NumberField'
import styles from './RatesPanel.module.css'

interface RatesPanelProps {
  rates: PricingRates
  onChange: (rates: PricingRates) => void
}

const s = STATUTORY_2026

/** Editable pricing assumptions, shared by both calculators. */
export function RatesPanel({ rates, onChange }: RatesPanelProps) {
  const set = (key: keyof PricingRates) => (value: number | null) => onChange({ ...rates, [key]: value ?? 0 })
  const setPercent = (key: 'overheadRate' | 'markupRate') => (value: number | null) =>
    onChange({ ...rates, [key]: round2(value ?? 0) / 100 })
  const activePreset = RATE_PRESETS.find((p) =>
    (Object.keys(p.rates) as (keyof PricingRates)[]).every((key) => p.rates[key] === rates[key]),
  )

  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>
        <span className={styles.title}>Pricing assumptions</span>
        <span className={styles.current}>
          {activePreset ? activePreset.label : 'Custom'}: {formatPercent(rates.overheadRate)} overhead,{' '}
          {formatPercent(rates.markupRate)} markup
        </span>
      </summary>

      <div className={styles.body}>
        <div className={styles.presets} role="group" aria-label="Presets">
          {RATE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={styles.preset}
              aria-pressed={activePreset?.id === preset.id}
              onClick={() => onChange(preset.rates)}
            >
              {preset.label}
              <span>
                {formatEur(preset.rates.rentPerFte)} rent, {formatPercent(preset.rates.overheadRate)} /{' '}
                {formatPercent(preset.rates.markupRate)}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          <NumberField label="Rent and telecoms per FTE" unit="€" value={rates.rentPerFte} onChange={set('rentPerFte')} min={0} />
          <NumberField label="Benefits per FTE" unit="€" value={rates.benefitsPerFte} onChange={set('benefitsPerFte')} min={0} />
          <NumberField label="Health insurance per FTE" unit="€" value={rates.insurancePerFte} onChange={set('insurancePerFte')} min={0} />
          <NumberField
            label="Corporate overhead"
            unit="%"
            value={round2(rates.overheadRate * 100)}
            onChange={setPercent('overheadRate')}
            min={0}
          />
          <NumberField
            label="Markup"
            unit="%"
            value={round2(rates.markupRate * 100)}
            onChange={setPercent('markupRate')}
            min={0}
          />
        </div>

        <p className={styles.statutory}>
          Payroll uses the 2026 Bulgarian rates: {formatPercent(s.incomeTaxRate)} income tax,{' '}
          {formatPercent(s.employeeSocialRate)} employee and {formatPercent(s.employerSocialRate)} employer social
          security, on income up to {formatEur(s.maxInsurableIncome)} a month.
        </p>
      </div>
    </details>
  )
}
