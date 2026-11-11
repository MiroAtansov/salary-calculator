import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { buildExport, formatCell, type ExportInput, type ExportVariant } from '../../lib/export'
import styles from './PrintView.module.css'

interface PrintViewProps {
  variant: ExportVariant
  input: ExportInput
  onDone: () => void
}

/** Renders an export for the browser's print dialog, where it can be saved as PDF. */
export function PrintView({ variant, input, onDone }: PrintViewProps) {
  const doc = buildExport(variant, input)
  const pdfName = doc.fileName.replace(/\.xlsx$/, '')

  useEffect(() => {
    // The PDF gets its default file name from the page title.
    const title = document.title
    document.title = pdfName
    const frame = requestAnimationFrame(() => {
      window.print()
      document.title = title
      onDone()
    })
    return () => {
      cancelAnimationFrame(frame)
      document.title = title
    }
  }, [pdfName, onDone])

  return createPortal(
    <div className={styles.sheet}>
      <header className={styles.header}>
        <h1>{doc.title}</h1>
        <p>{doc.subtitle}</p>
      </header>
      {doc.tables.map((table) => (
        <section key={table.title} className={styles.section}>
          {doc.tables.length > 1 && <h2>{table.title}</h2>}
          <table>
            <thead>
              <tr>
                {table.header.map((h, i) => (
                  <th key={i} data-text={table.rows[0]?.[i]?.format === 'text' || undefined}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} data-text={cell.format === 'text' || undefined}>
                      {formatCell(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {table.total && (
              <tfoot>
                <tr>
                  {table.total.map((cell, c) => (
                    <td key={c} data-text={cell.format === 'text' || undefined}>
                      {formatCell(cell)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </section>
      ))}
    </div>,
    document.body,
  )
}
