// FF 도구의 공통 부품. 모양의 기준은 DESIGN.md의 components 항목.

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useEffect, useRef } from 'react'
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
 * 숫자에 단위가 붙는 값의 칸(17px, 0.02em, 200ms). 단위는 숫자 바로 뒤에 4px 띄워 보여 주되 고칠 수 없게 고정하고, 숫자만 고친다.
 * 딱 붙이면 고칠 수 있는 숫자와 고정된 단위가 한 덩어리로 읽힌다.
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
  fillOnTab = false,
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
  /**
   * 견본의 줄 안에 놓는 작은 칸. 고칠 수 있는 자리라는 것이 보이도록 테두리와 흰 바탕을 늘 둔다.
   * 누르면 숫자가 모두 선택되어 바로 새 값을 적을 수 있고, 숫자를 지우는 동안에도 칸의 폭이 줄지 않는다(적어도 두 글자, placeholder의 길이).
   */
  small?: boolean
  /** 숫자를 진하고 굵게 보일지(직접 정한 값). */
  strong?: boolean
  placeholder?: string
  /**
   * 빈 칸에서 Tab을 누르면 옅게 보이던 값(placeholder)을 채우고 이 칸에 머문다. 다음 칸으로는 한 번 더 눌러야 넘어간다.
   * 채우기와 넘어가기가 한 번에 일어나면 무엇이 적혔는지 보기도 전에 칸을 떠나게 된다.
   */
  fillOnTab?: boolean
  title?: string
  onDigits: (digits: string) => void
  onBlur?: () => void
}) {
  const box = small
    ? `h-6 rounded-sm bg-canvas px-1 font-mono text-xs hover:border-ink-faint ${invalid ? 'border-danger' : 'border-hairline'}`
    : `h-8 w-full rounded-md bg-canvas px-2 text-sm ${invalid ? 'border-danger focus-within:border-danger' : 'border-hairline'}`
  // 마우스로 눌러서 고치기 시작했는지. 누른 손을 뗄 때 브라우저가 방금 한 전체 선택을 풀어 버리지 않게 막는 데 쓴다.
  const picking = useRef(false)
  // 숫자 칸의 폭은 적힌 글자가 실제로 차지하는 폭이다. 그래야 단위가 숫자 바로 뒤에 온다.
  // 글자 수(ch)로 재면 안 된다. 1ch는 숫자 0의 폭인데 소수점과 빼기표는 그보다 좁아서, "-0.01" 같은 값에서 숫자와 단위 사이가 벌어진다.
  // 그래서 같은 글자를 보이지 않게 한 번 더 그려 그 폭을 칸의 폭으로 쓴다. 작은 칸은 지우는 동안 줄어들지 않게 placeholder의 폭도 함께 잰다.
  const ghosts = small ? [digits, placeholder ?? ''] : [digits || placeholder || '']
  const font = `tabular-nums ${strong ? 'font-[650]' : ''}`
  return (
    <label title={title} className={`flex cursor-text items-center gap-1 border focus-within:border-selection ${box}`}>
      <span className={`inline-grid ${small ? 'min-w-[2ch]' : 'min-w-[1ch]'} ${font}`}>
        {ghosts.map((text, i) => (
          <span key={i} aria-hidden className="invisible col-start-1 row-start-1 h-0 overflow-hidden pr-px whitespace-pre">
            {text}
          </span>
        ))}
      <input
        aria-label={label}
        inputMode="decimal"
        placeholder={placeholder}
        className={`col-start-1 row-start-1 w-0 min-w-full bg-transparent outline-none placeholder:text-ink-faint ${font} ${small && !strong ? 'text-ink-soft' : 'text-ink'}`}
        onFocus={(e) => {
          if (!small) return
          e.currentTarget.select()
          picking.current = true
        }}
        onMouseUp={(e) => {
          if (picking.current) e.preventDefault()
          picking.current = false
        }}
        value={digits}
        // 숫자와 소수점(음수를 받으면 맨 앞의 -)만 받는다. 단위를 함께 적거나 붙여 넣어도 숫자만 남는다.
        onChange={(e) => {
          const raw = e.target.value
          const sign = negative && raw.trim().startsWith('-') ? '-' : ''
          onDigits(sign + raw.replace(/[^\d.]/g, ''))
        }}
        onBlur={() => {
          picking.current = false
          onBlur?.()
        }}
        onKeyDown={(e) => {
          picking.current = false
          if (e.key === 'Enter') return e.currentTarget.blur()
          if (e.key === 'Tab' && fillOnTab && !digits && placeholder) {
            e.preventDefault()
            return onDigits(placeholder)
          }
          // ↑↓로 1씩(소수는 0.1씩, Shift는 10배) 올리고 내린다. 음수를 받지 않으면 0 아래로는 내려가지 않는다.
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
          const next = stepValue(digits || placeholder || '', e.key === 'ArrowUp' ? 1 : -1, e.shiftKey)
          if (next === null || (!negative && Number(next) < 0)) return
          e.preventDefault()
          onDigits(next)
        }}
      />
      </span>
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
  wide?: boolean | 'lg' | 'xl' | '2xl'
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
        className={`${wide === '2xl' ? 'w-[1840px]' : wide === 'xl' ? 'w-[1440px]' : wide === 'lg' ? 'w-[1160px]' : wide ? 'w-[720px]' : 'w-[360px]'} max-w-[calc(100vw-48px)] rounded-lg border border-hairline bg-canvas p-6 shadow-dialog`}
      >
        <h2 className="mb-4 text-base font-[650]">{title}</h2>
        {children}
      </div>
    </div>
  )
}
