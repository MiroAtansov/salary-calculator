import { useEffect, useId, useRef, useState } from 'react'
import { TextField } from '../../components/TextField'
import { usePersistentState } from '../../hooks/usePersistentState'
import { buildExport, type ExportInput } from '../../lib/export'
import {
  approvalEmail,
  encodeShare,
  MAILTO_LIMIT,
  mailtoUrl,
  shareUrl,
  type ApprovalEmail,
  type SharedOffer,
} from '../../lib/share'
import { downloadXlsx } from '../../lib/xlsx'
import styles from './ApprovalDialog.module.css'

interface ApprovalDialogProps {
  open: boolean
  onClose: () => void
  shared: SharedOffer
  exportInput: ExportInput
}

type Status = { tone: 'ok' | 'error'; text: string } | null

/**
 * Sends the full calculation to an approver by email: a summary, a link that reopens the exact
 * calculation, and the internal Excel export to attach. The approver approves by replying.
 */
export function ApprovalDialog({ open, onClose, shared, exportInput }: ApprovalDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  const [to, setTo] = usePersistentState('approval.to', '')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<Status>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setStatus(null)
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  async function link(): Promise<string> {
    return shareUrl(await encodeShare(shared), window.location)
  }

  /** The full email if its mailto link fits, otherwise the one without the line summary. */
  async function email(): Promise<{ message: ApprovalEmail; fits: boolean }> {
    const url = await link()
    const full = approvalEmail(exportInput.meta, exportInput.offer, url, note)
    if (mailtoUrl(to, full).length <= MAILTO_LIMIT) return { message: full, fits: true }
    const short = approvalEmail(exportInput.meta, exportInput.offer, url, note, false)
    return { message: short, fits: mailtoUrl(to, short).length <= MAILTO_LIMIT }
  }

  async function run(action: () => Promise<string>) {
    setBusy(true)
    try {
      setStatus({ tone: 'ok', text: await action() })
    } catch {
      setStatus({ tone: 'error', text: 'That did not work. Try again, or copy the link instead.' })
    } finally {
      setBusy(false)
    }
  }

  const openEmail = () =>
    run(async () => {
      const { message, fits } = await email()
      await downloadXlsx(buildExport('internal', exportInput))
      if (!fits) {
        await navigator.clipboard.writeText(`${message.subject}\n\n${message.body}`)
        return 'This calculation is too large for an email link, so the email text was copied instead. Paste it into a new email and attach the downloaded Excel file.'
      }
      window.location.href = mailtoUrl(to, message)
      return 'Your email app should open. Attach the downloaded internal Excel file before sending.'
    })

  const copyLink = () =>
    run(async () => {
      await navigator.clipboard.writeText(await link())
      return 'Link copied. Anyone with the link can see this calculation, including all costs.'
    })

  const copyText = () =>
    run(async () => {
      const { message } = await email()
      await navigator.clipboard.writeText(`${message.subject}\n\n${message.body}`)
      return 'Email text copied.'
    })

  return (
    <dialog ref={ref} className={styles.dialog} onClose={onClose} aria-labelledby={`${id}-title`}>
      <div className={styles.body}>
        <h2 id={`${id}-title`} className={styles.title}>
          Send for approval
        </h2>
        <p className={styles.lead}>
          The approver gets the revenue, cost and margin, a link to the full calculation and the internal Excel
          export. Send the offer to the client once they reply with their approval.
        </p>

        <TextField
          label="Approver's email"
          type="email"
          value={to}
          onChange={setTo}
          placeholder="name@company.com"
          autoComplete="email"
        />
        <div className={styles.field}>
          <label htmlFor={`${id}-note`} className={styles.label}>
            Note <span>(optional)</span>
          </label>
          <textarea
            id={`${id}-note`}
            className={styles.textarea}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {status && (
          <p className={styles.status} data-tone={status.tone} role={status.tone === 'error' ? 'alert' : 'status'}>
            {status.text}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={openEmail} disabled={busy || to.trim() === ''}>
            Open email
          </button>
          <button type="button" className={styles.secondary} onClick={copyLink} disabled={busy}>
            Copy link
          </button>
          <button type="button" className={styles.secondary} onClick={copyText} disabled={busy}>
            Copy email text
          </button>
          <button type="button" className={styles.ghost} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  )
}
