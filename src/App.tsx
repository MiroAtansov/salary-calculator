import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { BotCalculator, SharedBotCalculator } from './features/bot/BotCalculator'
import { SalaryCalculator } from './features/salary/SalaryCalculator'
import { usePersistentState, writeStored } from './hooks/usePersistentState'
import { normalizeRates, STANDARD_RATES, type PricingRates } from './lib/rates'
import { decodeShare, shareTokenFromHash, type SharedOffer } from './lib/share'
import styles from './App.module.css'

const TABS = [
  { id: 'profile', label: 'Single profile' },
  { id: 'bot', label: 'BOT team' },
] as const

type TabId = (typeof TABS)[number]['id']

function clearHash() {
  history.replaceState(null, '', window.location.pathname + window.location.search)
}

export default function App() {
  const [tab, setTab] = usePersistentState<TabId>('app.tab', 'profile')
  const [storedRates, setRates] = usePersistentState<PricingRates>('app.rates', STANDARD_RATES)
  const rates = normalizeRates(storedRates)
  const [shared, setShared] = useState<SharedOffer | null>(null)
  const [linkError, setLinkError] = useState(false)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // A link from "Send for approval" carries the whole calculation in the hash.
  useEffect(() => {
    let cancelled = false
    async function open() {
      const token = shareTokenFromHash(window.location.hash)
      if (!token) return
      const offer = await decodeShare(token)
      if (cancelled) return
      setLinkError(offer === null)
      setShared(offer)
      if (offer) setTab('bot')
    }
    void open()
    window.addEventListener('hashchange', open)
    return () => {
      cancelled = true
      window.removeEventListener('hashchange', open)
    }
  }, [setTab])

  function closeShared() {
    setShared(null)
    clearHash()
  }

  function saveShared() {
    if (!shared) return
    writeStored('bot.positions', shared.positions)
    writeStored('bot.items', shared.items)
    writeStored('bot.meta', shared.meta)
    setRates(shared.rates)
    closeShared()
  }

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

      {linkError && (
        <p className={styles.linkError} role="alert">
          This link could not be opened. It may be incomplete; ask for it to be sent again.{' '}
          <button
            type="button"
            onClick={() => {
              setLinkError(false)
              clearHash()
            }}
          >
            Dismiss
          </button>
        </p>
      )}

      <main id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'profile' ? (
          <SalaryCalculator rates={rates} onRatesChange={setRates} />
        ) : shared ? (
          <SharedBotCalculator shared={shared} onChange={setShared} onSave={saveShared} onClose={closeShared} />
        ) : (
          <BotCalculator rates={rates} onRatesChange={setRates} />
        )}
      </main>
    </div>
  )
}
