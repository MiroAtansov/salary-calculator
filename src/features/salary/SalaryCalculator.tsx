import { BuildUpBar } from '../../components/BuildUpBar'
import { Ledger } from '../../components/Ledger'
import { RatesPanel } from '../../components/RatesPanel'
import { SegmentedControl } from '../../components/SegmentedControl'
import { SliderField } from '../../components/SliderField'
import { usePersistentState } from '../../hooks/usePersistentState'
import { formatEur, formatPercent } from '../../lib/money'
import { STATUTORY_2026, type PricingRates } from '../../lib/rates'
import { breakdownForNet, netFromGross, profileCost } from '../../lib/salary'
import styles from './SalaryCalculator.module.css'

type Mode = 'net' | 'gross'

const MODES = [
  { value: 'net', label: 'Net salary' },
  { value: 'gross', label: 'Gross salary' },
] as const

interface SalaryCalculatorProps {
  rates: PricingRates
  onRatesChange: (rates: PricingRates) => void
}

export function SalaryCalculator({ rates, onRatesChange }: SalaryCalculatorProps) {
  const [mode, setMode] = usePersistentState<Mode>('salary.mode', 'net')
  const [amount, setAmount] = usePersistentState('salary.amount', 1500)

  const pay = mode === 'net' ? breakdownForNet(amount) : netFromGross(amount)
  const cost = profileCost(pay.gross, rates)
  const s = STATUTORY_2026

  // Keep the same person when switching sides: the field shows the other figure of the current salary.
  function switchMode(next: Mode) {
    if (next === mode) return
    setAmount(next === 'gross' ? pay.gross : pay.net)
    setMode(next)
  }

  return (
    <div className={styles.layout}>
      <section className={styles.inputs} aria-labelledby="salary-inputs">
        <h2 id="salary-inputs" className={styles.heading}>
          Salary
        </h2>
        <SegmentedControl label="Start from" options={MODES} value={mode} onChange={switchMode} />
        <SliderField
          label={mode === 'net' ? 'Net monthly salary' : 'Gross monthly salary'}
          value={amount}
          onChange={setAmount}
          min={0}
          max={8000}
          step={50}
          unit="€"
          size="large"
          hint={
            mode === 'net' ? `Gross salary: ${formatEur(pay.gross)}` : `Take-home pay: ${formatEur(pay.net)}`
          }
        />
        <RatesPanel rates={rates} onChange={onRatesChange} />
      </section>

      <section className={styles.result} aria-labelledby="salary-result" aria-live="polite">
        <div className={styles.headline}>
          <h2 id="salary-result" className={styles.resultLabel}>
            Monthly price per profile
          </h2>
          <p className={styles.price}>{formatEur(cost.costPerProfile)}</p>
          <dl className={styles.stats}>
            <div>
              <dt>Per year</dt>
              <dd>{formatEur(cost.annualCostPerProfile)}</dd>
            </div>
            <div>
              <dt>Payroll cost per year</dt>
              <dd>{formatEur(cost.annualPayrollCost)}</dd>
            </div>
          </dl>
        </div>

        <BuildUpBar
          segments={[
            { key: 'net', label: 'Take-home pay', value: pay.net, tone: 'salary' },
            {
              key: 'deductions',
              label: 'Employee tax and contributions',
              value: pay.incomeTax + pay.employeeSocialSecurity,
              tone: 'deductions',
            },
            {
              key: 'employer',
              label: 'Employer costs',
              value: cost.employerSocialSecurity + cost.benefits + cost.insurance,
              tone: 'employer',
            },
            { key: 'operations', label: 'Rent and overhead', value: cost.rent + cost.overhead, tone: 'operations' },
            { key: 'markup', label: 'Markup', value: cost.markup, tone: 'markup' },
          ]}
        />

        <Ledger
          lines={[
            { kind: 'item', label: 'Net salary', value: pay.net, tone: 'salary' },
            { kind: 'item', label: 'Income tax', note: formatPercent(s.incomeTaxRate), value: pay.incomeTax, tone: 'deductions' },
            {
              kind: 'item',
              label: 'Employee social security',
              note: formatPercent(s.employeeSocialRate),
              value: pay.employeeSocialSecurity,
              tone: 'deductions',
            },
            { kind: 'subtotal', label: 'Gross salary', value: pay.gross },
            {
              kind: 'item',
              label: 'Employer social security',
              note: formatPercent(s.employerSocialRate),
              value: cost.employerSocialSecurity,
              tone: 'employer',
            },
            {
              kind: 'item',
              label: 'Benefits',
              note: 'Food vouchers, social expenses, sport cards',
              value: cost.benefits,
              tone: 'employer',
            },
            { kind: 'item', label: 'Health and other insurance', value: cost.insurance, tone: 'employer' },
            { kind: 'subtotal', label: 'Payroll cost', value: cost.payrollCost },
            { kind: 'item', label: 'Rent and telecoms', value: cost.rent, tone: 'operations' },
            {
              kind: 'item',
              label: 'Corporate overhead',
              note: `${formatPercent(rates.overheadRate)} of payroll cost`,
              value: cost.overhead,
              tone: 'operations',
            },
            {
              kind: 'item',
              label: 'Markup',
              note: `${formatPercent(rates.markupRate)} of payroll cost`,
              value: cost.markup,
              tone: 'markup',
            },
            { kind: 'total', label: 'Price per profile', value: cost.costPerProfile },
          ]}
        />
      </section>
    </div>
  )
}
