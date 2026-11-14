// FF 도구의 공통 부품. 모양의 기준은 DESIGN.md의 components 항목.

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useEffect } from 'react'
import { Check as CheckIcon } from 'lucide-react'
import { stepValue } from './lib/tokens'

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
      className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-md text-sm font-[550] whitespace-nowrap outline-selection focus-visible:outline-2 focus-visible:outline-offset-1 disabled:opacity-50 ${BUTTON_STYLES[variant]} ${className}`}
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

/**
 * 숫자에 단위가 붙는 값의 칸(17px, 0.02em, 200ms). 단위는 숫자 바로 뒤에 붙여 보여 주되 고칠 수 없게 고정하고, 숫자만 고친다.
 * 단위까지 직접 적게 하면 17처럼 숫자만 적었을 때 값이 되지 않고, 단위를 지우다 만 값이 저장된다.
 * 숫자 칸의 폭을 적힌 글자 수에 맞춰서 단위가 숫자에 붙어 다닌다. 칸의 빈 곳을 눌러도 숫자를 고칠 수 있다.
 */
export function UnitInput({
  label,
  digits,
  unit,
  invalid = false,
  negative = false,
  small = false,
  strong = false,
  placeholder,
  title,
  onDigits,
  onBlur,
}: {
  label: string
  /** 칸에 적힌 숫자(단위 없이). */
  digits: string
  unit: string
  invalid?: boolean
  /** 음수도 받을지(글자 사이 간격). */
  negative?: boolean
  /** 견본의 줄 안에 놓는 작은 칸. 고칠 수 있는 자리라는 것이 보이도록 테두리와 흰 바탕을 늘 둔다. */
  small?: boolean
  /** 숫자를 진하고 굵게 보일지(직접 정한 값). */
  strong?: boolean
  placeholder?: string
  title?: string
  onDigits: (digits: string) => void
  onBlur?: () => void
}) {
  const box = small
    ? `h-6 rounded-sm bg-canvas px-1 font-mono text-xs hover:border-ink-faint ${invalid ? 'border-danger' : 'border-hairline'}`
    : `h-8 w-full rounded-md bg-canvas px-2 text-sm ${invalid ? 'border-danger focus-within:border-danger' : 'border-hairline'}`
  return (
    <label title={title} className={`flex cursor-text items-center border focus-within:border-selection ${box}`}>
      <input
        aria-label={label}
        inputMode="decimal"
        placeholder={placeholder}
        className={`bg-transparent tabular-nums outline-none placeholder:text-ink-faint ${small && !strong ? 'text-ink-soft' : 'text-ink'} ${strong ? 'font-[650]' : ''}`}
        // 칸의 폭은 적힌 글자 수만큼이다. 그래야 단위가 숫자 바로 뒤에 온다.
        style={{ width: `${Math.max(1, (digits || placeholder || '').length)}ch` }}
        value={digits}
        // 숫자와 소수점(음수를 받으면 맨 앞의 -)만 받는다. 단위를 함께 적거나 붙여 넣어도 숫자만 남는다.
        onChange={(e) => {
          const raw = e.target.value
          const sign = negative && raw.trim().startsWith('-') ? '-' : ''
          onDigits(sign + raw.replace(/[^\d.]/g, ''))
        }}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') return e.currentTarget.blur()
          // ↑↓로 1씩(소수는 0.1씩, Shift는 10배) 올리고 내린다. 음수를 받지 않으면 0 아래로는 내려가지 않는다.
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
          const next = stepValue(digits || placeholder || '', e.key === 'ArrowUp' ? 1 : -1, e.shiftKey)
          if (next === null || (!negative && Number(next) < 0)) return
          e.preventDefault()
          onDigits(next)
        }}
      />
      <span aria-hidden className={`select-none ${small ? '' : 'text-ink-soft'}`}>
        {unit}
      </span>
    </label>
  )
}

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
    <span className="inline-block max-w-full rounded-sm bg-hover px-1 font-mono text-sm break-all text-ink">
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
