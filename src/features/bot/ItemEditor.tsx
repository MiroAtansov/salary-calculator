import { useId } from 'react'
import { DurationField } from '../../components/DurationField'
import { PencilIcon, TrashIcon } from '../../components/Icons'
import { NumberField } from '../../components/NumberField'
import { SegmentedControl } from '../../components/SegmentedControl'
import { Stepper } from '../../components/Stepper'
import { unitName } from '../../lib/duration'
import { ITEM_KINDS, type Item, type ItemCost } from '../../lib/items'
import { formatEur, formatPercent, round2 } from '../../lib/money'
import styles from './PositionEditor.module.css'

interface ItemEditorProps {
  cost: ItemCost
  fallbackName: string
  onChange: (patch: Partial<Item>) => void
  onRemove: () => void
}

/** A product, service or license: unit cost plus markup gives revenue and gross margin. */
export function ItemEditor({ cost, fallbackName, onChange, onRemove }: ItemEditorProps) {
  const nameId = useId()
  const { item } = cost

  return (
    <article className={styles.card} aria-label={item.name || fallbackName}>
      <header className={styles.header}>
        <label htmlFor={nameId} className={styles.visuallyHidden}>
          Name
        </label>
        <label htmlFor={nameId} className={styles.titleField}>
          <input
            id={nameId}
            className={styles.title}
            value={item.name}
            placeholder={fallbackName}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <PencilIcon />
        </label>
        <button type="button" className={styles.remove} onClick={onRemove}>
          <TrashIcon />
          Remove
        </button>
      </header>

      <SegmentedControl label="Type" options={ITEM_KINDS} value={item.kind} onChange={(kind) => onChange({ kind })} />

      <div className={styles.itemFields}>
        <Stepper label="Quantity" value={item.quantity} onChange={(quantity) => onChange({ quantity })} />
        <NumberField
          label={item.billing === 'one-off' ? 'Unit cost' : `Unit cost per ${unitName(item.billing)}`}
          unit="€"
          value={item.unitCost}
          onChange={(unitCost) => onChange({ unitCost: unitCost ?? 0 })}
          min={0}
        />
        <DurationField
          label="Billing and duration"
          amount={item.duration}
          unit={item.billing}
          allowOneOff
          onChange={(duration, billing) => onChange({ duration, billing })}
        />
        <NumberField
          label="Markup"
          unit="%"
          value={round2(item.markupRate * 100)}
          onChange={(value) => onChange({ markupRate: round2(value ?? 0) / 100 })}
          min={0}
        />
      </div>

      <footer className={styles.footer}>
        <div>
          <span>Cost</span>
          <strong>{formatEur(cost.cost)}</strong>
        </div>
        <div>
          <span>Revenue</span>
          <strong>{formatEur(cost.revenue)}</strong>
        </div>
        <div>
          <span>GM</span>
          <strong>
            {formatEur(cost.gm)} · {formatPercent(cost.gmRate)}
          </strong>
        </div>
      </footer>
    </article>
  )
}
