import { useId, useState, type ReactNode } from 'react'
import { DURATION_UNITS } from '../lib/duration'
import type { Billing } from '../lib/items'
import { parseAmount } from '../lib/money'
import fieldStyles from './NumberField.module.css'
import styles from './DurationField.module.css'

interface DurationFieldProps<U extends Billing> {
  label: string
  amount: number
  unit: U
  onChange: (amount: number, unit: U) => void
  /** Offer "One-off" as a unit, which hides the amount. */
  allowOneOff?: U extends 'one-off' ? boolean : never
  hint?: ReactNode
}

/** Amount plus unit: hours, days or months (or one-off). */
export function DurationField<U extends Billing>({ label, amount, unit, onChange, allowOneOff, hint }: DurationFieldProps<U>) {
  const id = useId()
  const [draft, setDraft] = useState(String(amount))
  const [focused, setFocused] = useState(false)
  const oneOff = unit === 'one-off'
  const options = [
    ...(allowOneOff ? [{ value: 'one-off', label: 'One-off' }] : []),
    ...DURATION_UNITS.map((u) => ({ value: u.value, label: allowOneOff ? `Per ${u.singular}` : u.label })),
  ]

  return (
    <div className={fieldStyles.field}>
      <label htmlFor={oneOff ? `${id}-unit` : id} className={fieldStyles.label}>
        {label}
      </label>
      <div className={styles.row}>
        {!oneOff && (
          <div className={fieldStyles.control}>
            <input
              id={id}
              className={fieldStyles.input}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={focused ? draft : String(amount)}
              onFocus={() => {
                setDraft(String(amount))
                setFocused(true)
              }}
              onBlur={() => setFocused(false)}
              onChange={(e) => {
                setDraft(e.target.value)
                const parsed = parseAmount(e.target.value)
                if (parsed !== null) onChange(Math.max(0, parsed), unit)
                else if (e.target.value.trim() === '') onChange(0, unit)
              }}
            />
          </div>
        )}
        <select
          id={`${id}-unit`}
          aria-label={oneOff ? undefined : `${label} unit`}
          className={styles.select}
          value={unit}
          onChange={(e) => onChange(amount, e.target.value as U)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {hint && <p className={fieldStyles.hint}>{hint}</p>}
    </div>
  )
}
