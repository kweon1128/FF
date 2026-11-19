// FF 도구의 공통 부품. 모양의 기준은 DESIGN.md의 components 항목.

import { CHECK_STROKE, ICON_STROKE } from './lib/icons'
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check as CheckIcon, ChevronDown } from 'lucide-react'
import { stepValue } from './lib/tokens'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary px-button-x hover:bg-primary/85',
  secondary: 'bg-canvas text-ink px-button-x border-edge border-hairline hover:bg-hover',
  ghost: 'text-ink-soft px-button-ghost-x hover:bg-hover hover:text-ink',
  danger: 'text-danger px-button-ghost-x hover:bg-hover',
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
      // 창이 열릴 때 커서를 둘 칸이 없으면 주 버튼에 초점을 준다(Modal). 그때 찾는 표시다.
      data-primary={variant === 'primary' ? '' : undefined}
      className={`inline-flex h-control shrink-0 items-center gap-button-inner rounded-control type-label whitespace-nowrap outline-selection focus-visible:outline-focus focus-visible:outline-offset-[1px] disabled:opacity-disabled ${BUTTON_STYLES[variant]} ${className}`}
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
    <label className={`flex items-start gap-row-inner ${disabled ? 'text-ink-faint' : ''}`}>
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {/* 글자 한 줄의 높이(20px)만큼의 자리 안에서 상자를 가운데에 둔다. 위아래로 2px씩 남아 정확히 가운데다. */}
      <span className="flex h-[20px] shrink-0 items-center outline-selection peer-focus-visible:[&>span]:outline-focus">
        <span
          className={`flex size-checkbox items-center justify-center rounded-small border-edge outline-offset-[1px] outline-selection ${
            checked ? 'border-ink bg-ink text-on-primary' : 'border-ink-faint bg-canvas'
          } ${disabled ? 'opacity-disabled' : ''}`}
        >
          {checked && <CheckIcon size={12} strokeWidth={CHECK_STROKE} />}
        </span>
      </span>
      <span className="min-w-0">{children}</span>
    </label>
  )
}

/**
 * 오류 문구가 뜬 칸은 테두리도 빨갛다(DESIGN.md field-input-error). 칸마다 따로 적지 않도록 여기서 한다.
 * 칸 바로 뒤에 오류 문구(text-danger)가 오거나, 칸을 감싼 Field에 오류가 있으면(data-field-error) 빨갛게 한다.
 * 칸에 직접 붙일 때는 'border-danger! focus:border-danger!'로 적는다. 느낌표가 없으면 아래의 border-hairline과 focus:border-selection에 덮여 보이지 않는다.
 */
export const inputClass =
  'h-control w-full rounded-control border-edge border-hairline bg-canvas px-input-x type-body text-ink outline-none placeholder:text-ink-faint focus:border-selection has-[+.text-danger]:border-danger has-[+.text-danger]:focus:border-danger [[data-field-error]_&]:border-danger [[data-field-error]_&]:focus:border-danger'

/** 변수 이름이나 값처럼 코드 글꼴로 적는 칸. 의미 글꼴 클래스는 한 요소에 하나만 붙이므로, inputClass에 글꼴 클래스를 덧붙이지 않고 이것을 쓴다. */
export const monoInputClass = inputClass.replace('type-body', 'type-code')

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
  width,
  title,
  autoFocus = false,
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
   * 견본의 줄 안에 놓는 작은 입력칸. 고칠 수 있는 자리라는 것이 보이도록 테두리와 흰 바탕을 늘 둔다.
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
  /**
   * 칸의 폭을 고정한다(w-12 같은 클래스). 숫자는 왼쪽에, 단위는 오른쪽 끝에 놓인다.
   * 표처럼 같은 칸이 위아래로 줄지어 있을 때 쓴다. 값의 길이에 따라 칸의 폭이 들쭉날쭉하면 줄이 맞지 않는다.
   */
  width?: string
  title?: string
  /** 창을 열자마자 이 칸에 커서를 둔다(칸이 이것 하나뿐인 창). 커서가 가면 눌렀을 때처럼 숫자가 모두 선택된다. */
  autoFocus?: boolean
  /**
   * 숫자가 바뀔 때. typing은 자판으로 한 글자씩 적는 중인지다(↑↓로 올리고 내리거나 Tab으로 채운 것은 아니다).
   * 적는 중인 값은 아직 다 적은 값이 아니다(28을 적으려면 2를 거친다). 값을 바로 저장하는 쪽은 typing일 때 저장을 미루고, 칸을 벗어날 때(onBlur. Enter도 칸을 벗어난다) 저장한다.
   */
  onDigits: (digits: string, typing?: boolean) => void
  onBlur?: () => void
}) {
  const box = small
    ? `h-compact rounded-small bg-canvas px-chip-x type-code-sm hover:border-ink-faint ${invalid ? 'border-danger focus-within:border-danger!' : 'border-hairline'}`
    : `h-control w-full rounded-control bg-canvas px-input-x type-body ${invalid ? 'border-danger focus-within:border-danger!' : 'border-hairline'}`
  // 마우스로 눌러서 고치기 시작했는지. 누른 손을 뗄 때 브라우저가 방금 한 전체 선택을 풀어 버리지 않게 막는 데 쓴다.
  const picking = useRef(false)
  // 숫자 칸의 폭은 적힌 글자가 실제로 차지하는 폭이다. 그래야 단위가 숫자 바로 뒤에 온다.
  // 글자 수(ch)로 재면 안 된다. 1ch는 숫자 0의 폭인데 소수점과 빼기표는 그보다 좁아서, "-0.01" 같은 값에서 숫자와 단위 사이가 벌어진다.
  // 그래서 같은 글자를 보이지 않게 한 번 더 그려 그 폭을 칸의 폭으로 쓴다. 작은 입력칸은 지우는 동안 줄어들지 않게 placeholder의 폭도 함께 잰다.
  const ghosts = small ? [digits, placeholder ?? ''] : [digits || placeholder || '']
  const font = 'tabular-nums'
  return (
    <label title={title} className={`flex cursor-text items-center gap-input-inner border-edge focus-within:border-selection ${width ? `${width} shrink-0 justify-between` : ''} ${box}`}>
      <span className={`inline-grid ${small ? 'min-w-[2ch]' : 'min-w-[1ch]'} ${font}`}>
        {ghosts.map((text, i) => (
          <span key={i} aria-hidden className="invisible col-start-1 row-start-1 h-0 overflow-hidden pr-px whitespace-pre">
            {text}
          </span>
        ))}
      <input
        aria-label={label}
        autoFocus={autoFocus}
        inputMode="decimal"
        placeholder={placeholder}
        // 작은 입력칸은 적힌 값이 회색(ink-soft)이라, 비었을 때 보이는 값(placeholder)을 같은 계열의 회색으로 두면 적힌 값과 구분되지 않는다. 절반으로 더 옅게 한다.
        className={`col-start-1 row-start-1 w-0 min-w-full bg-transparent outline-none ${small ? 'placeholder:text-ink-faint/50' : 'placeholder:text-ink-faint'} ${font} ${small && !strong ? 'text-ink-soft' : 'text-ink'}`}
        onFocus={(e) => {
          // 칸을 누르면 숫자가 모두 선택된다. 숫자 칸은 값을 통째로 바꿔 적는 일이 대부분이라, 누른 뒤 바로 새 값을 적을 수 있어야 한다.
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
          onDigits(sign + raw.replace(/[^\d.]/g, ''), true)
        }}
        onBlur={() => {
          picking.current = false
          onBlur?.()
        }}
        onKeyDown={(e) => {
          picking.current = false
          if (e.key === 'Enter') {
            // 창의 칸이면 Enter로 창을 낸다(DESIGN.md dialog). 칸을 먼저 벗어나면 브라우저가 창을 내지 않는다.
            // 표 안의 작은 입력칸은 칸이 여럿이라 Enter가 그 칸의 값만 끝내고 창은 내지 않는다.
            const form = small ? null : e.currentTarget.form
            if (!form) return e.currentTarget.blur()
            e.preventDefault()
            return form.requestSubmit()
          }
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
  plain = false,
  children,
}: {
  label: string
  error?: string | null
  hint?: string
  /** 안에 버튼이 있는 칸. label로 감싸면 이름표의 글자나 빈 곳을 눌러도 첫 버튼이 눌리므로, 그냥 상자로 그린다. */
  plain?: boolean
  children: ReactNode
}) {
  const Box = plain ? 'div' : 'label'
  return (
    <Box className="block" data-field-error={error ? '' : undefined}>
      <span className="mb-label block type-label text-ink-faint">{label}</span>
      {children}
      {error ? (
        <span className="mt-label block type-body text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-label block type-body text-ink-faint">{hint}</span>
      ) : null}
    </Box>
  )
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block max-w-full rounded-small bg-hover px-chip-x type-code break-all text-ink">
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
    <div className="flex flex-col items-center p-board text-center">
      <p className="type-heading">{title}</p>
      {body && <p className="mt-label text-ink-soft">{body}</p>}
      {children && <div className="mt-dialog-actions">{children}</div>}
    </div>
  )
}

/** 넓은 창의 폭. 단계(lg, xl)가 아니라 그 폭을 쓰는 창의 이름으로 짓는다(의미 크기 --width-dialog-이름). */
const DIALOG_WIDTHS = {
  shortcuts: 'w-dialog-shortcuts',
  'weight-set': 'w-dialog-weight-set',
  font: 'w-dialog-font',
  'size-set': 'w-dialog-size-set',
}

export function Modal({
  title,
  size,
  tall = false,
  onClose,
  children,
}: {
  title: string
  /** 기본 폭(360px)보다 넓은 창. 어느 창인지로 적는다: 단축키 목록, 굵기 한 벌 만들기, 글꼴을 고르는 창(의미 글꼴 한 벌 만들기와 글꼴 종류 추가), 글자 크기 한 벌 만들기. */
  size?: keyof typeof DIALOG_WIDTHS
  /**
   * 창의 높이를 화면 높이에 맞춰 고정한다(화면 높이 - 48px). 안의 내용이 그 높이를 채운다.
   * 고르는 값에 따라 내용의 높이가 크게 달라지는 창에 쓴다. 높이가 고정이어야 고르는 동안 창과 아래 버튼이 움직이지 않는다.
   */
  tall?: boolean
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    // 창 안에서 연 색 선택 창이 떠 있으면 Esc는 그것만 닫는다. 이 창까지 함께 닫히면 고르던 것이 사라진다.
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !document.querySelector('[role="dialog"][aria-label="색 선택"]') && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // 창이 열릴 때 커서를 둘 입력칸이 없으면(삭제 확인, 붙여넣기, 한 벌 만들기) 주 버튼에 초점을 준다.
  // Enter로 바로 끝낼 수 있고, Tab이 창 뒤의 화면을 먼저 돌지 않는다. 주 버튼이 없거나 꺼져 있으면 창 자체에 준다.
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = box.current
    if (!el || el.contains(document.activeElement)) return
    ;(el.querySelector<HTMLElement>('button[data-primary]:not(:disabled)') ?? el).focus()
  }, [])

  return (
    <div
      className="fixed inset-0 z-dialog flex items-center justify-center bg-scrim/40"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={box}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`${size ? DIALOG_WIDTHS[size] : 'w-dialog'} ${tall ? 'flex h-[calc(100vh-48px)] flex-col' : 'max-h-[calc(100vh-48px)] overflow-y-auto'} max-w-[calc(100vw-48px)] rounded-float border-edge border-hairline bg-canvas p-dialog shadow-dialog outline-none`}
      >
        <h2 className="mb-header shrink-0 type-title">{title}</h2>
        {tall ? <div className="min-h-0 flex-1">{children}</div> : children}
      </div>
    </div>
  )
}

/**
 * 정해 둔 묶음 가운데 하나를 고르는 칸(의미 색의 역할, 의미 글꼴의 묶음). 닫혀 있을 때는 고르는 칸의 모양이고, 누르면 목록이 아래에 펼쳐진다.
 * 브라우저의 고르는 칸(select)을 쓰지 않는다. 그 목록에서는 글자를 한 가지 모양으로만 적을 수 있어서,
 * 묶음의 이름(글자, 바탕…)과 그 묶음에 드는 것들(본문, 링크, 아이콘)이 한 줄에 같은 모양으로 이어져 무엇이 이름인지 헷갈린다.
 * 여기서는 이름을 진하게 정해진 폭에 적고, 드는 것들은 그 옆에 옅게 적는다. 이름들이 한 열로 줄을 서서 이름만 훑어 고를 수 있다.
 * nameWidth는 이름 칸의 폭이다. 가장 긴 이름이 들어가는 폭으로 정한다(세 글자까지는 w-picker-name 48px, 네 글자나 "숫자·코드"가 있으면 w-picker-name-wide 64px).
 * value가 null이면 아직 고르지 않은 칸이다(추가 창의 가리키는 값). 칸에 옅게 "고르기"가 보이고 목록에는 고른 줄이 없다.
 */
export function UsePicker<T extends string>({
  label,
  options,
  value,
  onChange,
  nameWidth = 'w-picker-name',
}: {
  label: string
  options: { id: T; label: string; hint: string }[]
  value: T | null
  onChange: (use: T) => void
  nameWidth?: string
}) {
  const [open, setOpen] = useState(false)
  const now = options.find((u) => u.id === value) ?? null
  const pick = (use: T) => {
    setOpen(false)
    if (use !== value) onChange(use)
  }
  // 목록은 칸의 자리가 아니라 화면 위에 띄운다. 칸이 창이나 패널 안에 있으면, 그 안에 그린 목록은 창의 끝에서 잘리거나 창을 스크롤해야 보인다.
  // 칸의 자리를 재서 그 바로 아래에 놓고, 아래가 모자라면 위에 놓는다. 그래도 길면 화면 안에서만 스크롤된다.
  const anchor = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const [place, setPlace] = useState<CSSProperties>({})
  function toggle() {
    if (open) return setOpen(false)
    const r = anchor.current!.getBoundingClientRect()
    // 칸과 목록 사이 4px, 화면 끝에서 8px. 줄 하나는 32px에 줄 사이 4px, 목록의 안쪽 여백과 테두리가 위아래 5px씩이다.
    const below = window.innerHeight - r.bottom - 4 - 8
    const above = r.top - 4 - 8
    const need = options.length * 36 + 6
    const up = below < need && above > below
    setPlace({ left: r.left, width: r.width, maxHeight: up ? above : below, ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }) })
    setOpen(true)
  }
  // 목록이 떠 있는 동안 화면이 움직이면(창을 스크롤하거나 크기를 바꾸면) 칸과 목록이 어긋나므로 닫는다. 목록 안을 스크롤하는 것은 그대로 둔다.
  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (e.type === 'scroll' && list.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    // 목록이 떠 있을 때의 Esc는 목록만 닫는다. 창 안의 칸이면 창도 Esc를 듣고 있어서, 먼저 받아 거기까지 가지 않게 한다.
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      e.preventDefault()
      setOpen(false)
    }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    window.addEventListener('keydown', esc, true)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', esc, true)
    }
  }, [open])
  /**
   * 한 줄의 내용. 이름은 진하게 정해진 폭에, 드는 것들(덧글)은 옅게.
   * 덧글은 말줄임표로 자르지 않는다. 목록의 줄에서는 길면 줄을 바꿔 다 보여 주고(줄이 그만큼 높아진다),
   * 닫힌 칸은 높이가 한 줄로 정해져 있어서 덧글이 다 들어갈 때만 보여 준다. 들어가지 않으면 둘째 줄로 넘어가 보이지 않는다(이름만 남는다).
   */
  const line = (u: { label: string; hint: string }, closed: boolean) =>
    closed ? (
      <span className="flex h-[20px] min-w-0 flex-1 flex-wrap gap-x-row-inner overflow-hidden">
        <span className={`${nameWidth} shrink-0 type-label text-ink`}>{u.label}</span>
        <span className="whitespace-nowrap text-ink-faint">{u.hint}</span>
      </span>
    ) : (
      <>
        <span className={`${nameWidth} shrink-0 type-label text-ink`}>{u.label}</span>
        <span className="min-w-0 flex-1 break-words text-ink-faint">{u.hint}</span>
      </>
    )
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-use={value ?? ''}
        ref={anchor}
        onClick={toggle}
        onKeyDown={(e) => {
          // ↑↓로 펼치지 않고도 묶음을 바꾼다. 아직 고르지 않았으면 어느 쪽을 눌러도 첫 값부터 고른다. Esc는 목록을 닫는다.
          if (e.key === 'Escape') return setOpen(false)
          if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
          e.preventDefault()
          const at = now ? options.indexOf(now) + (e.key === 'ArrowDown' ? 1 : -1) : 0
          if (options[at]) onChange(options[at].id)
        }}
        className={`${inputClass} flex items-center gap-row-inner text-left`}
      >
        {now ? line(now, true) : <span className="min-w-0 flex-1 text-ink-faint">고르기</span>}
        <ChevronDown size={16} strokeWidth={ICON_STROKE} className="shrink-0 text-ink-faint" />
      </button>
      {open &&
        createPortal(
        <>
          {/* 목록 바깥을 누르면 닫는다. 이 면과 목록은 창(z-dialog)과 색 선택 창(z-popover)보다 위에 뜨고, 목록(z-listbox)은 이 면(z-listbox-backdrop) 바로 위다. */}
          <div className="fixed inset-0 z-listbox-backdrop" onClick={() => setOpen(false)} />
          {/* 줄의 바탕(올렸을 때, 고른 것)이 서로 닿지 않게 줄 사이를 4px 띄운다. */}
          <div ref={list} role="listbox" aria-label={label} style={place} className="fixed z-listbox space-y-rows overflow-y-auto rounded-float border-edge border-hairline bg-canvas p-menu shadow-float">
            {options.map((u) => (
              <button
                key={u.id}
                type="button"
                role="option"
                aria-selected={u.id === value}
                data-use-option={u.id}
                onClick={() => pick(u.id)}
                // 줄의 높이는 한 줄일 때 32px이고(글자 20px에 위아래 6px), 덧글이 줄을 바꾸면 그만큼 늘어난다.
                className={`flex min-h-row w-full items-center gap-row-inner rounded-row px-row-x py-[6px] text-left type-body outline-selection focus-visible:outline-focus ${u.id === value ? 'bg-hover' : 'hover:bg-hover'}`}
              >
                {line(u, false)}
                {u.id === value && <CheckIcon size={16} strokeWidth={ICON_STROKE} className="shrink-0" />}
              </button>
            ))}
          </div>
        </>,
          document.body,
        )}
    </div>
  )
}

/**
 * 설명 글을 뜻의 단위로 줄바꿈해 보여 준다. 판의 좁은 칸에서 "확대 / 도구"처럼 낱말 사이 아무 데서나 줄이 바뀌면 읽기 어렵다.
 * 문장마다 새 줄에서 시작하고, 쉼표로 늘어놓은 것은 한 덩어리씩 붙여 둔다(줄은 덩어리와 덩어리 사이에서만 바뀐다).
 * 덩어리 하나가 칸보다 길 수 있으므로, 긴 덩어리(18자 넘는 것)는 붙여 두지 않고 낱말 사이에서 바뀌게 둔다.
 */
export function Phrases({ text }: { text: string }) {
  return (
    <>
      {text.split(/(?<=[.!?])\s+/).map((sentence, i) => (
        <span key={i} className="block">
          {sentence.split(/(?<=,)\s+/).map((piece, k) => (
            // 덩어리 사이의 빈칸은 덩어리 밖에 둔다. 붙여 둔 덩어리 안에 있으면 그 빈칸에서 줄이 바뀌지 못해, 짧은 덩어리가 이어질 때 칸 밖으로 넘친다.
            <Fragment key={k}>
              <span className={piece.length <= 18 ? 'whitespace-nowrap' : ''}>{piece}</span>{' '}
            </Fragment>
          ))}
        </span>
      ))}
    </>
  )
}
