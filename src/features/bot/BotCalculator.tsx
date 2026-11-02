import { BuildUpBar } from '../../components/BuildUpBar'
import { Ledger, type LedgerLine } from '../../components/Ledger'
import { RatesPanel } from '../../components/RatesPanel'
import { usePersistentState } from '../../hooks/usePersistentState'
import { createPosition, teamCost, type Position } from '../../lib/bot'
import { formatEur, formatPercent } from '../../lib/money'
import type { PricingRates } from '../../lib/rates'
import { BreakdownTable } from './BreakdownTable'
import { PositionEditor } from './PositionEditor'
import styles from './BotCalculator.module.css'

interface BotCalculatorProps {
  rates: PricingRates
  onRatesChange: (rates: PricingRates) => void
}

export function BotCalculator({ rates, onRatesChange }: BotCalculatorProps) {
  const [positions, setPositions] = usePersistentState<Position[]>('bot.positions', () => [createPosition()])
  const team = teamCost(positions, rates)
  const { totals } = team
  const titles = positions.map((p, i) => p.title.trim() || `Position ${i + 1}`)

  const update = (id: string, patch: Partial<Position>) =>
    setPositions((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const remove = (id: string) => setPositions((list) => list.filter((p) => p.id !== id))
  const add = () => setPositions((list) => [...list, createPosition()])

  const extras = totals.travel + totals.accommodation + totals.equipment
  const ledger: LedgerLine[] = [
    { kind: 'item', label: 'Base salary', value: totals.baseSalary, tone: 'salary' },
    { kind: 'item', label: 'Benefits', value: totals.benefits, tone: 'employer' },
    { kind: 'item', label: 'Social security', value: totals.socialSecurity, tone: 'employer' },
    { kind: 'item', label: 'Health and other insurance', value: totals.insurance, tone: 'employer' },
    ...(['travel', 'accommodation', 'equipment'] as const)
      .filter((key) => totals[key] !== 0)
      .map((key): LedgerLine => ({
        kind: 'item',
        label: { travel: 'Travel expenses', accommodation: 'Accommodation', equipment: 'Equipment' }[key],
        value: totals[key],
        tone: 'extras',
      })),
    { kind: 'item', label: 'Rent and telecoms', value: totals.rent, tone: 'operations' },
    { kind: 'item', label: 'Corporate overhead', note: formatPercent(rates.overheadRate), value: totals.overhead, tone: 'operations' },
    { kind: 'item', label: 'Markup', note: formatPercent(rates.markupRate), value: totals.markup, tone: 'markup' },
    { kind: 'subtotal', label: 'Total monthly cost', value: totals.costPerProfile },
    ...(totals.adjustment !== 0
      ? [{ kind: 'item', label: 'Previous-month adjustment', value: totals.adjustment } as LedgerLine]
      : []),
    { kind: 'total', label: 'Amount for invoice', value: totals.invoiceAmount },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <section className={styles.positions} aria-labelledby="positions-heading">
          <h2 id="positions-heading" className={styles.heading}>
            Positions
          </h2>
          {team.positions.map((cost, i) => (
            <PositionEditor
              key={cost.position.id}
              cost={cost}
              fallbackTitle={`Position ${i + 1}`}
              onChange={(patch) => update(cost.position.id, patch)}
              onRemove={positions.length > 1 ? () => remove(cost.position.id) : undefined}
            />
          ))}
          <button type="button" className={styles.add} onClick={add}>
            Add position
          </button>
        </section>

        <aside className={styles.summary} aria-labelledby="team-total" aria-live="polite">
          <div className={styles.card}>
            <div className={styles.headline}>
              <h2 id="team-total" className={styles.resultLabel}>
                Amount for invoice, monthly
              </h2>
              <p className={styles.price}>{formatEur(totals.invoiceAmount)}</p>
              <p className={styles.meta}>
                {totals.ftes} {totals.ftes === 1 ? 'FTE' : 'FTEs'} in {positions.length}{' '}
                {positions.length === 1 ? 'position' : 'positions'}
                {totals.ftes > 0 && <>, {formatEur(totals.costPerProfile / totals.ftes)} per FTE</>}
              </p>
            </div>
            <BuildUpBar
              segments={[
                { key: 'salary', label: 'Base salary', value: totals.baseSalary, tone: 'salary' },
                {
                  key: 'employer',
                  label: 'Employer costs',
                  value: totals.benefits + totals.socialSecurity + totals.insurance,
                  tone: 'employer',
                },
                { key: 'extras', label: 'Travel and equipment', value: extras, tone: 'extras' },
                { key: 'operations', label: 'Rent and overhead', value: totals.rent + totals.overhead, tone: 'operations' },
                { key: 'markup', label: 'Markup', value: totals.markup, tone: 'markup' },
              ]}
            />
            <Ledger lines={ledger} />
          </div>
          <RatesPanel rates={rates} onChange={onRatesChange} />
        </aside>
      </div>

      <BreakdownTable team={team} titles={titles} />
    </div>
  )
}
