import { useState } from 'react'
import { buildExport, type ExportInput, type ExportVariant } from '../../lib/export'
import { downloadXlsx } from '../../lib/xlsx'
import styles from './BotCalculator.module.css'

interface ExportMenuProps {
  input: ExportInput
  onPrint: (variant: ExportVariant) => void
  onSendForApproval: () => void
}

const VARIANTS = [
  { variant: 'internal', label: 'Internal, with costs', note: 'Full breakdown, markup and margin' },
  { variant: 'client', label: 'Client, prices only', note: 'Final price per position and item' },
] as const

export function ExportMenu({ input, onPrint, onSendForApproval }: ExportMenuProps) {
  const [error, setError] = useState<string | null>(null)

  async function excel(variant: ExportVariant) {
    setError(null)
    try {
      await downloadXlsx(buildExport(variant, input))
    } catch {
      setError('The Excel file could not be created. Try again, or use PDF.')
    }
  }

  return (
    <div className={styles.exports}>
      <h3 className={styles.exportsHeading}>Export</h3>
      {VARIANTS.map(({ variant, label, note }) => (
        <div key={variant} className={styles.exportRow}>
          <div>
            <span className={styles.exportLabel}>{label}</span>
            <span className={styles.exportNote}>{note}</span>
          </div>
          <div className={styles.exportButtons} role="group" aria-label={label}>
            <button type="button" className={styles.secondary} onClick={() => excel(variant)}>
              Excel
            </button>
            <button type="button" className={styles.secondary} onClick={() => onPrint(variant)}>
              PDF
            </button>
          </div>
        </div>
      ))}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="button" className={styles.primary} onClick={onSendForApproval}>
        Send for approval
      </button>
    </div>
  )
}
