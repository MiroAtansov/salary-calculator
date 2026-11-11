import { formatDuration } from '../../lib/duration'
import { priceUnit } from '../../lib/export'
import { formatEur, formatPercent } from '../../lib/money'
import { kindLabel, type Offer } from '../../lib/offer'
import styles from './BreakdownTable.module.css'

/** Every position and item over its duration, with revenue and gross margin. */
export function OfferTable({ offer }: { offer: Offer }) {
  const { lines, totals } = offer

  return (
    <section className={styles.section} aria-labelledby="offer-heading">
      <h2 id="offer-heading" className={styles.heading}>
        Offer: revenue and gross margin
      </h2>
      <div className={styles.scroller} tabIndex={0} role="region" aria-labelledby="offer-heading">
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.rowHead}>
                Item
              </th>
              <th scope="col" className={styles.left}>
                Type
              </th>
              <th scope="col">Qty</th>
              <th scope="col">Duration</th>
              <th scope="col">Unit price</th>
              <th scope="col">Cost</th>
              <th scope="col">Revenue</th>
              <th scope="col">GM</th>
              <th scope="col">GM %</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id}>
                <th scope="row" className={styles.rowHead}>
                  {l.name}
                </th>
                <td className={styles.left}>{kindLabel(l.kind)}</td>
                <td>{l.quantity}</td>
                <td>{l.duration ? formatDuration(l.duration) : 'One-off'}</td>
                <td title={priceUnit(l)}>{formatEur(l.unitPrice)}</td>
                <td>{formatEur(l.cost)}</td>
                <td>{formatEur(l.revenue)}</td>
                <td>{formatEur(l.gm)}</td>
                <td>{formatPercent(l.gmRate)}</td>
              </tr>
            ))}
            <tr data-strong>
              <th scope="row" className={styles.rowHead}>
                Total
              </th>
              <td colSpan={4} />
              <td>{formatEur(totals.cost)}</td>
              <td>{formatEur(totals.revenue)}</td>
              <td>{formatEur(totals.gm)}</td>
              <td>{formatPercent(totals.gmRate)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
