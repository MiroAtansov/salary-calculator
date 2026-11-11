import { formatEur, formatPercent, round2 } from '../lib/money'
import { PRESET_KEYS, RATE_PRESETS, STATUTORY_2026, type PricingRates } from '../lib/rates'
import { NumberField } from './NumberField'
import styles from './RatesPanel.module.css'

interface RatesPanelProps {
  rates: PricingRates
  onChange: (rates: PricingRates) => void
}

const s = STATUTORY_2026

const pick = (rates: PricingRates) => Object.fromEntries(PRESET_KEYS.map((key) => [key, rates[key]]))

/** Editable pricing assumptions, shared by both calculators. */
export function RatesPanel({ rates, onChange }: RatesPanelProps) {
  const set = (key: keyof PricingRates) => (value: number | null) => onChange({ ...rates, [key]: value ?? 0 })
  const setPercent = (key: 'overheadRate' | 'markupRate' | 'hourlyMarkupRate') => (value: number | null) =>
    onChange({ ...rates, [key]: round2(value ?? 0) / 100 })
  const activePreset = RATE_PRESETS.find((p) =>
    PRESET_KEYS.every((key) => p.rates[key] === rates[key]),
  )

  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>
        <span className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 5h8M15 5h2M3 10h2M9 10h8M3 15h10M17 15h0" />
            <circle cx="13" cy="5" r="2" />
            <circle cx="7" cy="10" r="2" />
            <circle cx="15" cy="15" r="2" />
          </svg>
        </span>
        <span className={styles.text}>
          <span className={styles.title}>Pricing assumptions</span>
          <span className={styles.current}>
            {activePreset ? activePreset.label : 'Custom'}: {formatPercent(rates.overheadRate)} overhead,{' '}
            {formatPercent(rates.markupRate)} markup, {formatPercent(rates.hourlyMarkupRate)} hourly markup
          </span>
        </span>
        <span className={styles.action} aria-hidden="true">
          <span className={styles.whenClosed}>Edit</span>
          <span className={styles.whenOpen}>Close</span>
          <span className={styles.chevron} />
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
              onClick={() => onChange({ ...rates, ...pick(preset.rates) })}
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

        <div className={styles.grid}>
          <NumberField
            label="Hours per month"
            unit="h"
            value={rates.hoursPerMonth}
            onChange={set('hoursPerMonth')}
            min={0}
            hint="Hourly cost = monthly cost before markup / these hours"
          />
          <NumberField label="Hours per day" unit="h" value={rates.hoursPerDay} onChange={set('hoursPerDay')} min={0} />
          <NumberField
            label="Hourly markup"
            unit="%"
            value={round2(rates.hourlyMarkupRate * 100)}
            onChange={setPercent('hourlyMarkupRate')}
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
