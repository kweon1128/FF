// FF 도구의 공통 부품. 모양의 기준은 DESIGN.md의 components 항목.

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useEffect } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white px-3 hover:bg-ink/85',
  secondary: 'bg-canvas text-ink px-3 border border-hairline hover:bg-hover',
  ghost: 'text-ink-soft px-2 hover:bg-hover hover:text-ink',
  danger: 'text-danger px-2 hover:bg-hover',
}

export function Button({
  variant = 'secondary',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md text-sm leading-none font-[550] whitespace-nowrap outline-selection focus-visible:outline-2 focus-visible:outline-offset-1 disabled:opacity-50 ${BUTTON_STYLES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export const inputClass =
  'h-8 w-full rounded-md border border-hairline bg-canvas px-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-selection'

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string | null
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-[550] text-ink-faint">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-faint">{hint}</span>
      ) : null}
    </label>
  )
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block max-w-full rounded-sm bg-hover px-1.5 py-0.5 font-mono text-xs break-all text-ink">
      {children}
    </span>
  )
}

export function EmptyState({
  title,
  body,
  children,
}: {
  title: string
  body: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <p className="font-[650]">{title}</p>
      <p className="mt-1 text-ink-soft">{body}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-[360px] rounded-lg border border-hairline bg-canvas p-6 shadow-dialog"
      >
        <h2 className="mb-4 text-base font-[650]">{title}</h2>
        {children}
      </div>
    </div>
  )
}
