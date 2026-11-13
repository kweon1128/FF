// FF 도구의 공통 부품. 모양의 기준은 DESIGN.md의 components 항목.

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useEffect } from 'react'
import { Check as CheckIcon } from 'lucide-react'

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

/**
 * 색 견본의 바탕. 색 뒤에 회색과 흰색의 바둑판 무늬를 깔아서, 반투명한 색이면 무늬가 비쳐 보이게 한다.
 * 불투명한 색이면 무늬가 가려져 색만 보인다. paint는 색 값이나 그러데이션, cell은 무늬 한 칸의 크기(px).
 */
export function swatchBackground(paint: string, cell = 8) {
  const top = paint.includes('gradient(') ? paint : `linear-gradient(${paint}, ${paint})`
  return `${top}, repeating-conic-gradient(#d9d9d9 0% 25%, #ffffff 0% 50%) 0 0 / ${cell * 2}px ${cell * 2}px`
}

/**
 * 체크박스와 그 옆의 글자. 브라우저의 기본 체크박스는 화면 배율에 따라 글자와 높이가 어긋나 보여서, 상자를 직접 그린다.
 * 상자는 16px이고 글자 줄의 세로 한가운데에 놓인다. 글자가 두 줄이 되면 첫 줄에 맞춘다.
 */
export function Check({
  checked,
  disabled,
  onChange,
  children,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <label className={`flex items-start gap-2 ${disabled ? 'text-ink-faint' : ''}`}>
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {/* 글자 한 줄의 높이(20px)만큼의 자리 안에서 상자를 가운데에 둔다. 위아래로 2px씩 남아 정확히 가운데다. */}
      <span className="flex h-5 shrink-0 items-center outline-selection peer-focus-visible:[&>span]:outline-2">
        <span
          className={`flex size-4 items-center justify-center rounded-sm border outline-offset-1 outline-selection ${
            checked ? 'border-ink bg-ink text-white' : 'border-ink-faint bg-canvas'
          } ${disabled ? 'opacity-40' : ''}`}
        >
          {checked && <CheckIcon size={12} strokeWidth={3} />}
        </span>
      </span>
      <span className="min-w-0">{children}</span>
    </label>
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
      <span className="mb-1 block text-sm font-[550] text-ink-faint">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-sm text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-sm text-ink-faint">{hint}</span>
      ) : null}
    </label>
  )
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block max-w-full rounded-sm bg-hover px-1.5 py-0.5 font-mono text-sm break-all text-ink">
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
  /** 오류 내용처럼 꼭 알려야 할 때만 쓴다. 쓰는 법을 설명하는 문구는 넣지 않는다. */
  body?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <p className="font-[650]">{title}</p>
      {body && <p className="mt-1 text-ink-soft">{body}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

export function Modal({
  title,
  wide,
  onClose,
  children,
}: {
  title: string
  /** 내용이 많은 창(단축키 목록)은 넓게 연다. */
  wide?: boolean | 'lg' | 'xl'
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    // 창 안에서 연 색 선택 창이 떠 있으면 Esc는 그것만 닫는다. 이 창까지 함께 닫히면 고르던 것이 사라진다.
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !document.querySelector('[role="dialog"][aria-label="색 선택"]') && onClose()
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
        className={`${wide === 'xl' ? 'w-[1440px]' : wide === 'lg' ? 'w-[1160px]' : wide ? 'w-[720px]' : 'w-[360px]'} max-w-[calc(100vw-48px)] rounded-lg border border-hairline bg-canvas p-6 shadow-dialog`}
      >
        <h2 className="mb-4 text-base font-[650]">{title}</h2>
        {children}
      </div>
    </div>
  )
}
