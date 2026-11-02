import { useId, useState, type ReactNode } from 'react'
import { parseAmount } from '../lib/money'
import styles from './NumberField.module.css'

interface NumberFieldProps {
  label: ReactNode
  value: number | null
  onChange: (value: number | null) => void
  /** Shown inside the field, e.g. "€" or "%". */
  unit?: string
  placeholder?: string
  hint?: ReactNode
  min?: number
  /** Allow clearing the field to `null` instead of resetting it to `min ?? 0`. */
  nullable?: boolean
  hideLabel?: boolean
  size?: 'regular' | 'large'
}

function toDraft(value: number | null) {
  return value === null ? '' : String(value)
}

export function NumberField({
  label,
  value,
  onChange,
  unit,
  placeholder,
  hint,
  min,
  nullable = false,
  hideLabel = false,
  size = 'regular',
}: NumberFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState(() => toDraft(value))
  const [focused, setFocused] = useState(false)

  // While typing, keep the user's text (e.g. "12," or "0.0"); otherwise show the current value.
  const shown = focused ? draft : toDraft(value)

  function commit(raw: string) {
    const parsed = parseAmount(raw)
    if (parsed === null) {
      onChange(nullable ? null : (min ?? 0))
      return
    }
    onChange(min !== undefined ? Math.max(min, parsed) : parsed)
  }

  return (
    <div className={styles.field} data-size={size}>
      <label htmlFor={id} className={hideLabel ? styles.visuallyHidden : styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        <input
          id={id}
          className={styles.input}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={shown}
          placeholder={placeholder}
          onFocus={() => {
            setDraft(toDraft(value))
            setFocused(true)
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            setDraft(e.target.value)
            const parsed = parseAmount(e.target.value)
            if (parsed !== null || e.target.value.trim() === '') commit(e.target.value)
          }}
        />
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  )
}
