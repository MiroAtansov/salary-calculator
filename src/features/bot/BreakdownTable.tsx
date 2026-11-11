import { BREAKDOWN_ROWS, lineAmounts, type TeamCost } from '../../lib/bot'
import { formatEur, formatEurWhole } from '../../lib/money'
import styles from './BreakdownTable.module.css'

export function BreakdownTable({ team, titles }: { team: TeamCost; titles: string[] }) {
  const columns = team.positions.map((p) => ({ id: p.position.id, amounts: lineAmounts(p) }))

  return (
    <section className={styles.section} aria-labelledby="breakdown-heading">
      <h2 id="breakdown-heading" className={styles.heading}>
        Monthly breakdown by position
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
            {BREAKDOWN_ROWS.map((row) => (
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
            {(['hourlyCost', 'hourlyRate'] as const).map((key) => (
              <tr key={key} className={styles.hourlyRow}>
                <th scope="row" className={styles.rowHead}>
                  {key === 'hourlyCost' ? 'Hourly cost per FTE' : 'Hourly rate per FTE'}
                </th>
                {team.positions.map((p) => (
                  <td key={p.position.id}>{formatEur(p.hourly[key])}</td>
                ))}
                <td className={styles.totalCol} aria-label="Not summed">
                  –
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
