import { lineAmounts, type TeamCost, type TeamTotals } from '../../lib/bot'
import { formatEurWhole } from '../../lib/money'
import styles from './BreakdownTable.module.css'

type RowKey = Exclude<keyof TeamTotals, 'ftes'>

// Same rows, in the same order, as the BOT spreadsheet.
const ROWS: { key: RowKey; label: string; strong?: boolean }[] = [
  { key: 'baseSalary', label: 'Base salary' },
  { key: 'benefits', label: 'Benefits' },
  { key: 'socialSecurity', label: 'Social security' },
  { key: 'insurance', label: 'Health and other insurance' },
  { key: 'travel', label: 'Travel expenses' },
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'rent', label: 'Rent and telecoms' },
  { key: 'overhead', label: 'Corporate overhead' },
  { key: 'markup', label: 'Markup' },
  { key: 'costPerProfile', label: 'Total monthly cost', strong: true },
  { key: 'adjustment', label: 'Previous-month adjustment' },
  { key: 'invoiceAmount', label: 'Amount for invoice', strong: true },
]

export function BreakdownTable({ team, titles }: { team: TeamCost; titles: string[] }) {
  const columns = team.positions.map((p) => ({ id: p.position.id, amounts: lineAmounts(p) }))

  return (
    <section className={styles.section} aria-labelledby="breakdown-heading">
      <h2 id="breakdown-heading" className={styles.heading}>
        Breakdown by position
      </h2>
      <div className={styles.scroller} tabIndex={0} role="region" aria-labelledby="breakdown-heading">
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.rowHead}>
                <span className={styles.visuallyHidden}>Cost</span>
              </th>
              {team.positions.map((p, i) => (
                <th key={p.position.id} scope="col">
                  {titles[i]}
                </th>
              ))}
              <th scope="col" className={styles.totalCol}>
                Total
              </th>
            </tr>
            <tr className={styles.ftes}>
              <th scope="row" className={styles.rowHead}>
                FTEs
              </th>
              {columns.map((c) => (
                <td key={c.id}>{c.amounts.ftes}</td>
              ))}
              <td className={styles.totalCol}>{team.totals.ftes}</td>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key} data-strong={row.strong || undefined}>
                <th scope="row" className={styles.rowHead}>
                  {row.label}
                </th>
                {columns.map((c) => (
                  <td key={c.id}>{formatEurWhole(c.amounts[row.key])}</td>
                ))}
                <td className={styles.totalCol}>{formatEurWhole(team.totals[row.key])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
