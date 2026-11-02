import { useRef, type KeyboardEvent } from 'react'
import { BotCalculator } from './features/bot/BotCalculator'
import { SalaryCalculator } from './features/salary/SalaryCalculator'
import { usePersistentState } from './hooks/usePersistentState'
import { STANDARD_RATES, type PricingRates } from './lib/rates'
import styles from './App.module.css'

const TABS = [
  { id: 'profile', label: 'Single profile' },
  { id: 'bot', label: 'BOT team' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function App() {
  const [tab, setTab] = usePersistentState<TabId>('app.tab', 'profile')
  const [rates, setRates] = usePersistentState<PricingRates>('app.rates', STANDARD_RATES)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Arrow keys move between tabs, as in the WAI-ARIA tabs pattern.
  function onTabKeyDown(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    const index = TABS.findIndex((t) => t.id === tab)
    const next = TABS[(index + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length]
    setTab(next.id)
    tabRefs.current[next.id]?.focus()
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Pricing calculator</h1>
          <p className={styles.subtitle}>Monthly client price for a salary or a BOT team, at 2026 payroll rates.</p>
        </div>
        <div className={styles.tabs} role="tablist" aria-label="Calculator" onKeyDown={onTabKeyDown}>
          {TABS.map((t) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el
              }}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              className={styles.tab}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'profile' ? (
          <SalaryCalculator rates={rates} onRatesChange={setRates} />
        ) : (
          <BotCalculator rates={rates} onRatesChange={setRates} />
        )}
      </main>
    </div>
  )
}
