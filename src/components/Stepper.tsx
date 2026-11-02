import { useId } from 'react'
import { parseAmount } from '../lib/money'
import styles from './Stepper.module.css'

interface StepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
}

/** Whole-number input with − / + buttons, for headcounts. */
export function Stepper({ label, value, onChange, min = 0 }: StepperProps) {
  const id = useId()
  const set = (next: number) => onChange(Math.max(min, Math.round(next)))

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        <button
          type="button"
          className={styles.button}
          onClick={() => set(value - 1)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          id={id}
          className={styles.input}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => set(parseAmount(e.target.value) ?? min)}
        />
        <button type="button" className={styles.button} onClick={() => set(value + 1)} aria-label={`Increase ${label}`}>
          +
        </button>
      </div>
    </div>
  )
}
