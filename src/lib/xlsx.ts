import type { Cell, Sheet } from 'write-excel-file/browser'
import type { ExportCell, ExportDocument, ExportTable } from './export'

const FORMATS = { eur: '#,##0.00 [$€-1809]', percent: '0.00%', number: '#,##0.##' } as const

function toCell(cell: ExportCell, bold = false): Cell {
  if (cell.value === null) return null
  const style = bold ? { fontWeight: 'bold' as const } : {}
  if (typeof cell.value === 'string') return { value: cell.value, type: String, ...style }
  const format = cell.format && cell.format !== 'text' ? FORMATS[cell.format] : undefined
  return { value: cell.value, type: Number, format, ...style }
}

/** Sheet names: at most 31 characters, without : \ / ? * [ ]. */
function sheetName(title: string, used: Set<string>): string {
  const base = title.replace(/[:\\/?*[\]]/g, ' ').slice(0, 28).trim()
  let name = base
  for (let n = 2; used.has(name); n++) name = `${base} ${n}`
  used.add(name)
  return name
}

function toSheet(doc: ExportDocument, table: ExportTable, first: boolean, used: Set<string>): Sheet<never> {
  const head = first
    ? [[{ value: doc.title, type: String, fontWeight: 'bold' as const }], [{ value: doc.subtitle, type: String }], []]
    : []
  const header = table.header.map((h) => ({ value: h, type: String, fontWeight: 'bold' as const }))
  const rows = table.rows.map((r) => r.map((c) => toCell(c)))
  const total = table.total ? [table.total.map((c) => toCell(c, true))] : []

  const widths = table.header.map((h, i) =>
    Math.min(
      40,
      Math.max(10, h.length + 2, ...table.rows.map((r) => String(r[i]?.value ?? '').length + 4)),
    ),
  )

  return {
    sheet: sheetName(table.title.replace(/:.*/, ''), used),
    data: [...head, header, ...rows, ...total] as Sheet<never>['data'],
    columns: widths.map((width) => ({ width })),
  }
}

/** Downloads the export as an .xlsx file. The library is only loaded when needed. */
export async function downloadXlsx(doc: ExportDocument): Promise<void> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const used = new Set<string>()
  const sheets = doc.tables.map((t, i) => toSheet(doc, t, i === 0, used))
  await writeXlsxFile(sheets).toFile(doc.fileName)
}
