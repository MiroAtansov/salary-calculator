import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { BuildUpBar } from '../../components/BuildUpBar'
import { Ledger, type LedgerLine } from '../../components/Ledger'
import { RatesPanel } from '../../components/RatesPanel'
import { TextField } from '../../components/TextField'
import { usePersistentState } from '../../hooks/usePersistentState'
import { createPosition, normalizePosition, teamCost, type Position } from '../../lib/bot'
import type { ExportVariant } from '../../lib/export'
import { createItem, normalizeItem, type Item } from '../../lib/items'
import { formatEur, formatPercent } from '../../lib/money'
import { EMPTY_META, itemName, offerSummary, positionName, type OfferMeta } from '../../lib/offer'
import type { PricingRates } from '../../lib/rates'
import type { SharedOffer } from '../../lib/share'
import { ApprovalDialog } from './ApprovalDialog'
import { BreakdownTable } from './BreakdownTable'
import { ExportMenu } from './ExportMenu'
import { ItemEditor } from './ItemEditor'
import { OfferTable } from './OfferTable'
import { PositionEditor } from './PositionEditor'
import { PrintView } from './PrintView'
import styles from './BotCalculator.module.css'

type Setter<T> = Dispatch<SetStateAction<T>>

interface BotCalculatorProps {
  rates: PricingRates
  onRatesChange: (rates: PricingRates) => void
}

/** The BOT tab with the user's own calculation, kept in local storage. */
export function BotCalculator({ rates, onRatesChange }: BotCalculatorProps) {
  const [positions, setPositions] = usePersistentState<Position[]>('bot.positions', () => [createPosition()])
  const [items, setItems] = usePersistentState<Item[]>('bot.items', [])
  const [meta, setMeta] = usePersistentState<OfferMeta>('bot.meta', EMPTY_META)

  // Data saved by an older version lacks newer fields such as the duration.
  const current = useMemo(
    () => ({ positions: positions.map(normalizePosition), items: items.map(normalizeItem), meta: { ...EMPTY_META, ...meta } }),
    [positions, items, meta],
  )

  return (
    <OfferWorkspace
      {...current}
      setPositions={setPositions}
      setItems={setItems}
      setMeta={setMeta}
      rates={rates}
      onRatesChange={onRatesChange}
    />
  )
}

interface SharedBotCalculatorProps {
  shared: SharedOffer
  onChange: (shared: SharedOffer) => void
  onSave: () => void
  onClose: () => void
}

/** A calculation opened from a link: edited in memory until the user saves it as their own. */
export function SharedBotCalculator({ shared, onChange, onSave, onClose }: SharedBotCalculatorProps) {
  function setter<K extends 'positions' | 'items' | 'meta'>(key: K): Setter<SharedOffer[K]> {
    return (action) =>
      onChange({ ...shared, [key]: typeof action === 'function' ? action(shared[key]) : action })
  }

  return (
    <OfferWorkspace
      positions={shared.positions}
      items={shared.items}
      meta={shared.meta}
      setPositions={setter('positions')}
      setItems={setter('items')}
      setMeta={setter('meta')}
      rates={shared.rates}
      onRatesChange={(rates) => onChange({ ...shared, rates })}
      banner={
        <div className={styles.banner} role="status">
          <p>
            <strong>Shared calculation.</strong> You opened this from a link; changes here are not saved.
          </p>
          <div className={styles.bannerActions}>
            <button type="button" className={styles.primary} onClick={onSave}>
              Save as my calculation
            </button>
            <button type="button" className={styles.secondary} onClick={onClose}>
              Close
            </button>
          </div>
          <p className={styles.bannerNote}>Saving replaces the calculation and pricing assumptions stored in this browser.</p>
        </div>
      }
    />
  )
}

interface OfferWorkspaceProps {
  positions: Position[]
  items: Item[]
  meta: OfferMeta
  setPositions: Setter<Position[]>
  setItems: Setter<Item[]>
  setMeta: Setter<OfferMeta>
  rates: PricingRates
  onRatesChange: (rates: PricingRates) => void
  banner?: ReactNode
}

function OfferWorkspace({
  positions,
  items,
  meta,
  setPositions,
  setItems,
  setMeta,
  rates,
  onRatesChange,
  banner,
}: OfferWorkspaceProps) {
  const [printing, setPrinting] = useState<ExportVariant | null>(null)
  const [approvalOpen, setApprovalOpen] = useState(false)

  const team = teamCost(positions, rates)
  const offer = offerSummary(positions, items, rates)
  const { totals } = team
  const titles = positions.map(positionName)

  const updatePosition = (id: string, patch: Partial<Position>) =>
    setPositions((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const updateItem = (id: string, patch: Partial<Item>) =>
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const canRemovePosition = positions.length > 1 || items.length > 0

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

  const exportInput = { meta, offer, rates }

  return (
    <div className={styles.page}>
      {banner}

      <section className={styles.details} aria-label="Offer details">
        <TextField
          label="Offer name"
          value={meta.title}
          placeholder="e.g. HR operations team"
          onChange={(title) => setMeta((m) => ({ ...m, title }))}
        />
        <TextField
          label="Client"
          value={meta.client}
          placeholder="Client name"
          onChange={(client) => setMeta((m) => ({ ...m, client }))}
        />
      </section>

      <div className={styles.layout}>
        <div className={styles.lines}>
          <section className={styles.positions} aria-labelledby="positions-heading">
            <h2 id="positions-heading" className={styles.heading}>
              Positions
            </h2>
            {team.positions.map((cost, i) => (
              <PositionEditor
                key={cost.position.id}
                cost={cost}
                line={offer.lines[i]}
                rates={rates}
                fallbackTitle={`Position ${i + 1}`}
                onChange={(patch) => updatePosition(cost.position.id, patch)}
                onRemove={
                  canRemovePosition ? () => setPositions((list) => list.filter((p) => p.id !== cost.position.id)) : undefined
                }
              />
            ))}
            <button type="button" className={styles.add} onClick={() => setPositions((list) => [...list, createPosition()])}>
              Add position
            </button>
          </section>

          <section className={styles.positions} aria-labelledby="items-heading">
            <div>
              <h2 id="items-heading" className={styles.heading}>
                Products, services and licenses
              </h2>
              <p className={styles.sectionNote}>Cost plus markup gives the revenue; the markup is the gross margin.</p>
            </div>
            {offer.items.map((cost, i) => (
              <ItemEditor
                key={cost.item.id}
                cost={cost}
                fallbackName={itemName({ ...cost.item, name: '' }, i)}
                onChange={(patch) => updateItem(cost.item.id, patch)}
                onRemove={() => {
                  setItems((list) => list.filter((it) => it.id !== cost.item.id))
                  if (positions.length === 0 && items.length === 1) setPositions([createPosition()])
                }}
              />
            ))}
            <button type="button" className={styles.add} onClick={() => setItems((list) => [...list, createItem()])}>
              Add product, service or license
            </button>
          </section>
        </div>

        <aside className={styles.summary} aria-label="Totals" aria-live="polite">
          <div className={styles.card}>
            <div className={styles.headline}>
              <h2 id="offer-total" className={styles.resultLabel}>
                Offer revenue
              </h2>
              <p className={styles.price}>{formatEur(offer.totals.revenue)}</p>
              <p className={styles.meta}>
                {offer.lines.length} {offer.lines.length === 1 ? 'line' : 'lines'}, each over its own duration
              </p>
            </div>
            <dl className={styles.offerStats}>
              <div>
                <dt>Cost</dt>
                <dd>{formatEur(offer.totals.cost)}</dd>
              </div>
              <div>
                <dt>Gross margin</dt>
                <dd>{formatEur(offer.totals.gm)}</dd>
              </div>
              <div>
                <dt>GM %</dt>
                <dd>{formatPercent(offer.totals.gmRate)}</dd>
              </div>
            </dl>
            <ExportMenu
              input={exportInput}
              onPrint={setPrinting}
              onSendForApproval={() => setApprovalOpen(true)}
            />
          </div>

          {positions.length > 0 && (
            <div className={styles.card}>
              <div className={styles.headline}>
                <h2 id="team-total" className={styles.resultLabel}>
                  Positions: amount for invoice, monthly
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
          )}
          <RatesPanel rates={rates} onChange={onRatesChange} />
        </aside>
      </div>

      <OfferTable offer={offer} />
      {positions.length > 0 && <BreakdownTable team={team} titles={titles} />}

      <ApprovalDialog
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        shared={{ positions, items, rates, meta }}
        exportInput={exportInput}
      />
      {printing && <PrintView variant={printing} input={exportInput} onDone={() => setPrinting(null)} />}
    </div>
  )
}
