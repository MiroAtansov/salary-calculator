import { useId, type CSSProperties, type ReactNode } from 'react'
import { NumberField } from './NumberField'
import styles from './SliderField.module.css'

interface SliderFieldProps {
  label: ReactNode
  value: number
  onChange: (value: number) => void
  min: number
  /** The slider's range; the number field accepts values beyond it. */
  max: number
  step: number
  unit?: string
  hint?: ReactNode
  size?: 'regular' | 'large'
}

/** A number field paired with a slider for quick what-if exploration. */
export function SliderField({ label, value, onChange, min, max, step, unit, hint, size }: SliderFieldProps) {
  const sliderId = useId()
  const fill = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))

  return (
    <div className={styles.wrapper}>
      <NumberField
        label={label}
        value={value}
        onChange={(v) => onChange(v ?? min)}
        min={min}
        unit={unit}
        hint={hint}
        size={size}
      />
      <input
        id={sliderId}
        className={styles.slider}
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(value, max)}
        aria-label={typeof label === 'string' ? `${label} slider` : undefined}
        style={{ '--fill': `${fill}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
