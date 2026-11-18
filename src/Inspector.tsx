import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, Copy, PencilLine, Pipette, Rows3, Type } from 'lucide-react'
import type { Token } from './lib/api'
import { ALL_KINDS, COLOR_REF, SLUG, groupOf, shortName, type Kind } from './lib/catalog'
import { asHex, isApprox, showColor, toHex, toOklch } from './lib/color'
import { stepValue, suggestLine, suggestTrack } from './lib/tokens'
import { ColorSwatch } from './ColorPicker'
import { NewFontForm } from './NewFont'
import { shownFont } from './lib/fonts'
import { Button, Chip, Field, Modal, UnitInput, inputClass } from './ui'

type Props = {
  token: Token
  kind: Kind
  file: string
  allNames: string[]
  onRename: (next: string) => void
  onValue: (value: string) => void
  /** 이 값을 쓰는 컴포넌트와 그 자리들. */
  uses: { index: number; name: string; where: string[] }[]
  onOpenComponent: (index: number) => void
  /** 이 색을 가리키는 의미 색들의 변수 이름. */
  roles: string[]
  onOpenToken: (name: string) => void
  /** 글자를 클립보드에 복사한다. */
  onCopy: (text: string) => void
  /** 화면에서 색을 찍는다(스포이드). 색 값에서만 쓴다. */
  onPickColor: () => void
  /** 글자 크기에 묶인 줄 높이. 글자 크기일 때만 준다(없으면 null). */
  line?: string | null
  /** 줄 높이를 바꾼다. null이면 지운다. */
  onLine?: (value: string | null) => void
  /** 글자 크기에 묶인 글자 사이(em). 글자 크기일 때만 준다(없으면 null). */
  track?: string | null
  /** 묶인 글자 사이를 바꾼다. null이면 지운다. */
  onTrack?: (value: string | null) => void
  /** 이 색을 기준으로 50~950 단계를 만들 수 있으면, 아직 없는 단계의 수. 만들 수 없는 색이면 null. */
  scaleMissing: number | null
  onMakeScale: () => void
  /**
   * 색의 이름을 고칠 때, 그 목록과 이름을 쓸 수 없으면 까닭을 돌려준다(목록 칸이나 이름 칸 아래에 적는다). 쓸 수 있으면 null.
   * 만들 때와 같은 규칙이다. 색 값에서만 준다.
   */
  nameProblem?: (group: string, name: string) => { group?: string; name?: string } | null
}

export const ICON_BUTTON =
  'flex size-icon-button shrink-0 items-center justify-center rounded-md text-ink-soft outline-selection hover:bg-hover hover:text-ink focus-visible:outline-2'

const HEX6 = /^#[0-9a-f]{6}$/i
const PLAIN = /^[a-z0-9]+$/

// 글자 크기 규칙: 읽고 고치는 내용(항목 이름, 입력칸, 삭제)은 14px,
// 그것을 설명하는 것(구역 제목, 이름표, 코드 표시)은 12px.

/** 패널의 한 구역. 구역 사이에만 전체 폭 구분선을 둔다. */
export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="border-b border-hairline px-section-x py-section-y last:border-b-0">
      {title && <h3 className="mb-heading type-heading">{title}</h3>}
      {children}
    </section>
  )
}

export const CODE_OPEN = 'ff.codeOpen'
export const WHERE_OPEN = 'ff.whereOpen'

/**
 * 접어 두는 구역. 제목 줄을 누르면 펼쳐지고 다시 누르면 접힌다. 처음 상태는 startOpen으로 정한다(안 주면 접힘).
 * 패널은 값을 고를 때마다 새로 만들어지므로, 펼친 상태를 브라우저에 기억해 다른 값을 골라도 그대로 둔다.
 */
export function FoldSection({
  title,
  storageKey,
  startOpen = false,
  note,
  empty = false,
  children,
}: {
  title: string
  storageKey: string
  startOpen?: boolean
  /** 제목 줄 오른쪽에 옅게 적는 짧은 말. 접어 두어도 보인다(쓰이는 곳의 수 등). */
  note?: string
  /** 내용이 없는 구역. 접고 펼 것이 없어서 제목 줄만 남고 누를 수 없다. */
  empty?: boolean
  children?: ReactNode
}) {
  const [open, setOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved === null ? startOpen : saved === '1'
    } catch {
      return startOpen
    }
  })
  function toggle() {
    const next = !open
    setOpen(next)
    try {
      localStorage.setItem(storageKey, next ? '1' : '0')
    } catch {
      // 기억하지 못해도 접고 펴는 데는 문제가 없다.
    }
  }
  const Arrow = open ? ChevronDown : ChevronRight
  if (empty)
    return (
      <section className="border-b border-hairline last:border-b-0">
        <h3 className="flex h-bar items-center gap-button-inner px-section-x type-heading">
          <span className="flex-1">{title}</span>
          {note && <span className="type-body text-ink-faint">{note}</span>}
        </h3>
      </section>
    )
  return (
    <section className="border-b border-hairline last:border-b-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          onClick={toggle}
          className="flex h-bar w-full items-center gap-button-inner px-section-x type-heading outline-selection hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2"
        >
          <span className="flex-1 text-left">{title}</span>
          {note && <span className="type-body text-ink-faint">{note}</span>}
          <Arrow size={16} strokeWidth={1.5} className="text-ink-soft" />
        </button>
      </h3>
      {open && <div className="px-section-x pt-label pb-section-y">{children}</div>}
    </section>
  )
}

/**
 * 그 값을 코드에서 쓰는 클래스. Tailwind가 값의 이름으로 만들어 주는 것 가운데 가장 흔히 쓰는 것이다.
 * 색은 글자와 바탕, 간격은 여백과 사이처럼 쓰임이 여럿인 종류는 둘을 적는다.
 */
export function classesOf(kind: Kind, short: string): string[] {
  switch (kind.id) {
    case 'color':
    case 'role':
      return [`text-${short}`, `bg-${short}`]
    case 'font':
    case 'weight':
      return [`font-${short}`]
    case 'size':
      return [`text-${short}`]
    case 'leading':
      return [`leading-${short}`]
    case 'tracking':
      return [`tracking-${short}`]
    case 'spaceuse':
      return [`p-${short}`, `gap-${short}`]
    case 'space':
    case 'length':
      // 토대(간격, 크기)는 클래스로 쓰지 않는다. 의미 간격과 의미 크기가 가리킬 뿐이다.
      return []
    case 'height':
      return [`h-${short}`]
    case 'width':
      return [`w-${short}`]
    case 'square':
      return [`size-${short}`]
    case 'radius':
      return [`rounded-${short}`]
    case 'border':
      return [`border-${short}`]
    case 'breakpoint':
      return [`${short}:`]
    case 'container':
      return [`max-w-${short}`]
    case 'style':
      return [`type-${short}`]
    default:
      // 그림자, 투명도, 흐림, 비율, 겹치는 순서, 움직임 시간과 흐름은 종류의 이름이 곧 클래스의 앞머리다.
      return [`${kind.prefix.replace(/^--|-$/g, '')}-${short}`]
  }
}

/**
 * 패널의 "코드" 구역 안. 어느 패널이나 같은 모양이다: 쓰는 법(클래스와 변수. 줄마다 복사 버튼), 저장된 값(복사 버튼), 저장 위치.
 * uses는 쓰는 법에 적을 것들이고 그대로 복사된다. note는 저장된 값 아래에 붙이는 한 줄(가까운 색으로 보여 준다는 것 등)이다.
 */
export function CodeRows({ uses, value, file, onCopy, note, valueNote }: { uses: string[]; value: string; file: string; onCopy: (text: string) => void; note?: string; valueNote?: string }) {
  const row = (text: string) => (
    <span key={text} className="flex items-center gap-actions-tight">
      <span className="min-w-0 flex-1">
        <Chip>{text}</Chip>
      </span>
      <button type="button" title={`${text} 복사`} aria-label={`${text} 복사`} onClick={() => onCopy(text)} className={ICON_BUTTON}>
        <Copy size={16} strokeWidth={1.5} />
      </button>
    </span>
  )
  return (
    <div className="space-y-blocks">
      <div>
        <p className="mb-label type-label text-ink-faint">쓰는 법</p>
        <div className="space-y-rows">{uses.map(row)}</div>
      </div>
      <div>
        <p className="mb-label type-label text-ink-faint">저장된 값</p>
        {row(value)}
        {valueNote && <p className="mt-label type-body text-ink-faint">{valueNote}</p>}
        {note && <p className="mt-label type-body text-ink-faint">{note}</p>}
      </div>
      <div>
        <p className="mb-label type-label text-ink-faint">저장 위치</p>
        <Chip>{file}</Chip>
      </div>
    </div>
  )
}

/** "쓰이는 곳"에 적는, 이 값을 가리키는 값의 짧은 이름과 그 종류의 이름(의미 색, 의미 글꼴, 의미 간격). */
function userOf(name: string) {
  const kind = ALL_KINDS.find((k) => k.matches(name))
  return { short: kind ? shortName(kind, name) : name, title: kind?.title ?? '' }
}

/** 숫자 하나에 단위가 붙은 값. 단위는 고정해 두고 숫자만 고친다. */
const UNIT = /^(-?\d*\.?\d+)(px|rem|em|ms|s|%)$/
const NUMBER = /^\d*\.?\d+$/
const SIGNED = /^-?\d*\.?\d+$/
const digitsOf = (value: string | null | undefined) => (value ?? '').replace(/px$/, '')

/** 오른쪽 편집 패널. 선택한 값이 바뀌면 key로 새로 만들어져 입력 중이던 내용이 초기화된다. */
export function Inspector({
  token,
  kind,
  file,
  allNames,
  onRename,
  onValue,
  uses,
  onOpenComponent,
  roles,
  onOpenToken,
  onCopy,
  onPickColor,
  line,
  onLine,
  track,
  onTrack,
  scaleMissing,
  onMakeScale,
  nameProblem,
}: Props) {
  const short = shortName(kind, token.name)
  const isColor = kind.id === 'color'
  const isFont = kind.id === 'font'
  // 글꼴을 견주어 고르는 창을 열었는지.
  const [pickingFont, setPickingFont] = useState(false)
  const initialGroup = isColor ? groupOf(short) : ''
  const initialName = initialGroup ? short.slice(initialGroup.length + 1) : short

  const [groupDraft, setGroupDraft] = useState(initialGroup)
  const [nameDraft, setNameDraft] = useState(initialName)
  const [nameError, setNameError] = useState<string | null>(null)
  const [groupError, setGroupError] = useState<string | null>(null)
  // 색은 파일에 oklch로 저장하지만, 여기서는 읽고 쓰기 쉬운 #으로 보여 주고 받는다.
  const [valueDraft, setValueDraft] = useState(kind.id === 'color' ? showColor(token.value) : token.value)
  const [valueError, setValueError] = useState<string | null>(null)
  // 값이 숫자 하나에 단위가 붙은 것이면(16px, 0.02em, 200ms) 단위를 고정해 두고 숫자만 고친다. 단위는 지금 값의 것을 그대로 쓴다.
  // 그림자나 clamp()처럼 그렇지 않은 값, 단위가 없는 값(굵기, 투명도)은 적힌 그대로 고친다.
  const [unit] = useState(isColor || isFont ? null : (UNIT.exec(token.value)?.[2] ?? null))
  const [digits, setDigits] = useState(UNIT.exec(token.value)?.[1] ?? '')
  // 0이나 음수가 될 수 없는 값(글자 크기)과 음수가 되는 값(글자 사이 간격).
  const positive = kind.id === 'size'
  const negative = kind.id === 'tracking'
  // 줄 높이 칸에 적는 숫자(px는 고정).
  const [lineDraft, setLineDraft] = useState(digitsOf(line))
  const [lineError, setLineError] = useState<string | null>(null)
  // 크기를 바꾸면 묶인 줄 높이가 따라 바뀐다. 밖에서 바뀐 값을 칸에 옮긴다(칸에 적는 중인 값과 같으면 그대로 둔다).
  const [seenLine, setSeenLine] = useState(line)
  if (line !== seenLine) {
    setSeenLine(line)
    if ((line ?? '') !== (lineDraft ? `${lineDraft}px` : '')) {
      setLineDraft(digitsOf(line))
      setLineError(null)
    }
  }

  // 묶인 글자 사이 칸에 적는 숫자(em은 고정). 크기를 바꾸면 따라 바뀌므로 줄 높이처럼 밖에서 바뀐 값을 칸에 옮긴다.
  const [trackDraft, setTrackDraft] = useState((track ?? '').replace(/em$/, ''))
  const [trackError, setTrackError] = useState<string | null>(null)
  const [seenTrack, setSeenTrack] = useState(track)
  if (track !== seenTrack) {
    setSeenTrack(track)
    if ((track ?? '') !== (trackDraft ? `${trackDraft}em` : '')) {
      setTrackDraft((track ?? '').replace(/em$/, ''))
      setTrackError(null)
    }
  }

  // 칸이 비어 있을 때 옅게 보여 주는 추천값. 지금 글자 크기에 어울리는 줄 높이와 글자 사이다(한 벌 만들기의 "보통"과 같은 규칙).
  // 비운 채로 칸을 떠나면 이 값으로 채운다. 빈 칸으로 남겨 두지 않는다. 좁힐 필요가 없는 크기의 글자 사이는 추천값이 없어 0이 보이고 비어 있는 채로 둔다.
  const lineHint = digitsOf(suggestLine(token.value))
  const trackHint = (suggestTrack(token.value) ?? '').replace(/em$/, '')

  /** 묶인 글자 사이는 em으로만 받는다(음수가 좁게). 비우면 묶인 글자 사이를 지운다. */
  function changeTrack(next: string, typing = false) {
    setTrackDraft(next)
    setTrackError(null)
    if (next && !SIGNED.test(next)) return setTrackError('숫자를 입력해 주세요.')
    // 적는 동안은 저장하지 않는다(값 칸과 같다). 칸을 벗어날 때 저장한다.
    if (typing) return
    if (!next) return onTrack?.(null)
    if (`${next}em` !== (track ?? '')) onTrack?.(`${next}em`)
  }

  // 값 칸을 비우면 지금 저장되어 있는 값이 옅게 보인다. 줄 높이나 글자 사이와 달리 값 자체는 다른 데서 계산해 낼 규칙이 없어서, 추천값 대신 마지막으로 저장된 값을 보여 준다.
  // 비운 채로 칸을 떠나면 그 값으로 돌아간다. 빈 칸으로 남겨 두지 않는다.
  const savedDigits = UNIT.exec(token.value)?.[1] ?? ''

  /**
   * 숫자 칸의 값을 바꾼다. 자판으로 적는 동안(typing)은 칸의 글자와 오류 표시만 바꾸고 저장하지 않는다. 칸을 벗어나거나 Enter를 누를 때 저장한다.
   * 28을 적으려면 2를 거치는데, 그 2가 바로 저장되면 줄이 값의 차례대로 맨 위로 튀어 올라가고 그 값을 쓰는 화면이 그사이에 바뀐다.
   * FF 자신의 디자인 시스템(ff-ds)을 고칠 때는 FF의 화면이 그 값으로 그려지므로 화면 전체가 흐트러진다. ↑↓로 올리고 내리는 것은 바로 저장한다.
   */
  function changeDigits(next: string, typing = false) {
    setDigits(next)
    // 비운 것은 틀린 값이 아니라 고치는 중이다. 알리지 않고, 저장된 값은 그대로 둔다.
    if (!next) return setValueError(null)
    if (!(negative ? SIGNED : NUMBER).test(next) || (positive && Number(next) <= 0)) return setValueError('숫자를 입력해 주세요.')
    setValueError(null)
    if (!typing && `${next}${unit}` !== token.value) onValue(`${next}${unit}`)
  }

  /** 칸을 벗어날 때. 비어 있거나 받을 수 없는 값이면 저장된 값으로 되돌리고, 아니면 적어 둔 값을 저장한다. */
  function commitDigits() {
    if (!digits || valueError) {
      setValueError(null)
      return savedDigits ? changeDigits(savedDigits) : undefined
    }
    changeDigits(digits)
  }

  /** 줄 높이는 px로만 받는다. 비우면 묶인 줄 높이를 지운다. */
  function changeLine(digits: string, typing = false) {
    setLineDraft(digits)
    setLineError(null)
    if (digits && (!NUMBER.test(digits) || Number(digits) <= 0)) return setLineError('숫자를 입력해 주세요.')
    // 적는 동안은 저장하지 않는다(값 칸과 같다). 칸을 벗어날 때 저장한다.
    if (typing) return
    if (!digits) return onLine?.(null)
    if (`${digits}px` !== (line ?? '')) onLine?.(`${digits}px`)
  }

  function commitName() {
    const group = groupDraft.trim()
    const name = nameDraft.trim()
    setGroupError(null)
    setNameError(null)
    if (group && !SLUG.test(group)) return setGroupError('영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.')
    if (!name) return setNameError('이름을 입력해 주세요.')
    if (isColor ? !PLAIN.test(name) : !SLUG.test(name)) {
      return setNameError(isColor ? '영문 소문자와 숫자만 쓸 수 있어요.' : '영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.')
    }
    const next = group ? `${group}-${name}` : name
    if (next === short) return
    if (allNames.includes(kind.prefix + next)) return setNameError('같은 이름이 이미 있어요.')
    // 색은 이름이 목록 이름이나 의미 색 이름의 앞머리와 겹쳐도 안 된다(만들 때와 같은 규칙).
    const problem = nameProblem?.(group, name)
    if (problem?.group) return setGroupError(problem.group)
    if (problem?.name) return setNameError(problem.name)
    onRename(kind.prefix + next)
  }

  /**
   * 값 칸의 값을 바꾼다. save가 false면 칸의 글자와 오류 표시만 바꾸고 저장하지 않는다.
   * 칸에 적는 동안은 저장하지 않고, 칸을 벗어나거나 Enter를 누를 때 저장한다. #1a2b3c를 적는 동안 #1a2, #1a2b가 잠깐씩 저장되어
   * 그 색을 쓰는 화면이 깜빡이고 되돌리기 단계가 잘게 쌓이는 것을 막는다. 색 고르기, ↑↓, 화면에서 색 찍기는 바로 저장한다.
   */
  function changeValue(raw: string, save = true) {
    setValueDraft(raw)
    const next = raw.trim()
    if (!next) return setValueError('값을 입력해 주세요.')
    if (/[;{}]/.test(next)) return setValueError('; { } 기호는 쓸 수 없어요.')
    // 색 칸에서 쓰다 만 # 값(#12345)은 저장하지 않는다. 그대로 저장되면 이 색을 가리키는 의미 색이 모두 "없는 색"이 된다.
    // 이름으로 된 색(white)이나 color-mix(…)처럼 FF가 읽지 못할 뿐인 값은 막지 않는다.
    if (isColor && /^#?[0-9a-f]*$/i.test(next) && !asHex(next)) return setValueError('#rrggbb처럼 여섯 자리로 적어 주세요.')
    // 다른 색을 가리키는 값을 적으면 이 색이 의미 색으로 바뀌어 색상 판에서 사라진다. 의미 색은 의미 색 판에서 만든다.
    if (isColor && COLOR_REF.test(next)) return setValueError('다른 색을 가리키는 색은 의미 색 판에서 만들어 주세요.')
    setValueError(null)
    // 색으로 읽히는 값(#, rgb, hsl)은 oklch로 바꿔 저장한다. 읽을 수 없는 값은 적은 그대로 둔다.
    // #을 빼고 여섯 자리만 적어도 색으로 받는다.
    const out = isColor ? toOklch(asHex(next) ?? next) : next
    if (save && out !== token.value) onValue(out)
  }

  /** 칸에 적어 둔 값을 저장한다. 받을 수 없는 값이거나 비어 있으면 저장된 값으로 되돌린다(틀린 값을 칸에 남겨 두지 않는다). */
  function commitValue() {
    const next = valueDraft.trim()
    if (!next || valueError) return revertValue()
    changeValue(valueDraft)
  }
  function revertValue() {
    setValueDraft(isColor ? showColor(token.value) : token.value)
    setValueError(null)
  }

  // 견본에 쓸 색. 칸에 적는 중인 값이 색으로 읽히면 그것을 바로 보여 주고, 아니면 저장된 값을 쓴다.
  const liveColor = isColor ? (asHex(valueDraft) ?? toHex(token.value)) : null

  const nameInput = (
    <input
      className={inputClass}
      value={nameDraft}
      aria-label="이름"
      data-rename="token"
      onChange={(e) => {
        setNameDraft(e.target.value)
        setNameError(null)
      }}
      onBlur={commitName}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  )

  return (
    <div>
      <Section>
        <h2 className="type-heading break-all">{short}</h2>
      </Section>

      <Section title="이름">
        {isColor ? (
          <div className="space-y-blocks">
            <Field label="목록" error={groupError}>
              <input
                className={inputClass}
                data-rename="group"
                value={groupDraft}
                onChange={(e) => {
                  setGroupDraft(e.target.value)
                  setGroupError(null)
                }}
                onBlur={commitName}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              />
            </Field>
            <Field label="이름" error={nameError}>
              {nameInput}
            </Field>
          </div>
        ) : (
          <>
            {nameInput}
            {nameError && <span className="mt-label block type-body text-danger">{nameError}</span>}
          </>
        )}
      </Section>

      <Section title={kind.valueLabel}>
        {/* 글꼴 종류는 값을 직접 적지 않는다. 정한 글꼴의 이름만 보여 주고, 바꾸는 것은 아래의 "글꼴 고르기"로 한다. 대체 글꼴까지 든 전체 값은 코드 구역에 있다. */}
        {isFont && (
          <p data-font-name className="flex h-control items-center type-body">
            <span className="truncate">{shownFont(valueDraft)}</span>
          </p>
        )}
        {unit && (
          <UnitInput
            label={kind.valueLabel}
            digits={digits}
            unit={unit}
            placeholder={savedDigits}
            fillOnTab={!!savedDigits}
            invalid={!!valueError}
            negative={negative}
            onDigits={changeDigits}
            onBlur={commitDigits}
          />
        )}
        <span className={isFont || unit ? 'hidden' : 'flex items-center gap-field-row'}>
          {/* 칸에 #을 빼고 적었어도 지금 색에서 시작하도록, 적은 글자가 아니라 읽어 낸 색을 넘긴다. */}
          {isColor && <ColorSwatch label="색 고르기" value={liveColor ?? valueDraft} alpha preview onChange={changeValue} />}
          <input
            aria-label={kind.valueLabel}
            className={`${inputClass} ${valueError ? 'border-danger focus:border-danger' : ''}`}
            value={valueDraft}
            onChange={(e) => changeValue(e.target.value, false)}
            onBlur={commitValue}
            onKeyDown={(e) => {
              // Enter는 적은 값을 저장하고, Esc는 적던 것을 버리고 저장된 값으로 돌아간다.
              if (e.key === 'Enter') return commitValue()
              if (e.key === 'Escape') return revertValue()
              // ↑↓로 숫자를 올리고 내린다(Shift는 10배). 16px, 1.5처럼 숫자 하나로 된 값만.
              if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
              const next = stepValue(valueDraft, e.key === 'ArrowUp' ? 1 : -1, e.shiftKey)
              if (next === null) return
              e.preventDefault()
              changeValue(next)
            }}
          />
          {isColor && (
            <button
              type="button"
              title="화면에서 색 찍기 (I)"
              aria-label="화면에서 색 찍기"
              onClick={onPickColor}
              className={ICON_BUTTON}
            >
              <Pipette size={16} strokeWidth={1.5} />
            </button>
          )}
        </span>
        {valueError && <span className="mt-label block type-body text-danger">{valueError}</span>}
        {line !== undefined && (
          <div className="mt-blocks">
            <Field label="줄 높이" error={lineError}>
              <UnitInput
                label="줄 높이"
                digits={lineDraft}
                unit="px"
                placeholder={lineHint}
                fillOnTab={!!lineHint}
                invalid={!!lineError}
                onDigits={changeLine}
                onBlur={() => changeLine(!lineDraft && lineHint ? lineHint : lineDraft)}
              />
            </Field>
          </div>
        )}
        {/* 글자 크기에 묶인 글자 사이. 비어 있으면 글꼴이 정한 그대로다. */}
        {track !== undefined && (
          <div className="mt-blocks">
            <Field label="글자 사이" error={trackError}>
              <UnitInput
                label="글자 사이"
                digits={trackDraft}
                unit="em"
                placeholder={trackHint || '0'}
                fillOnTab={!!trackHint}
                invalid={!!trackError}
                negative
                onDigits={changeTrack}
                onBlur={() => changeTrack(!trackDraft && trackHint ? trackHint : trackDraft)}
              />
            </Field>
          </div>
        )}
        {isFont && (
          <Button variant="ghost" className="-ml-button-ghost-x" onClick={() => setPickingFont(true)}>
            <Type size={16} strokeWidth={1.5} />
            글꼴 고르기
          </Button>
        )}
        {pickingFont && (
          <Modal title={`${short}의 글꼴`} wide="xl" tall onClose={() => setPickingFont(false)}>
            <NewFontForm
              existing={new Set()}
              edit={{ name: short, value: valueDraft }}
              onCancel={() => setPickingFont(false)}
              onCreate={(_, value) => {
                setPickingFont(false)
                changeValue(value)
              }}
            />
          </Modal>
        )}
        {scaleMissing !== null && (
          <Button
            variant="ghost"
            className="mt-blocks -ml-button-ghost-x"
            disabled={!HEX6.test(liveColor ?? '')}
            title={
              scaleMissing === 0
                ? '이 색을 기준으로 나머지 단계의 색을 모두 다시 계산해요. 지금 있는 색은 바뀌어요.'
                : '이 색을 기준으로 같은 목록에 50~950 단계를 만들어요. 이미 있는 단계는 그대로 둬요.'
            }
            onClick={onMakeScale}
          >
            <Rows3 size={16} strokeWidth={1.5} />
            {scaleMissing === 0 ? '단계 다시 생성' : '단계 생성'}
          </Button>
        )}
      </Section>

      {/* 구역의 차례는 어느 패널이나 같다: 이름, 값, 설명, 쓰이는 곳, 코드. 고치는 것은 늘 펼쳐 두고, 보기만 하는 것(쓰이는 곳, 코드)은 접을 수 있다.
          "쓰인 모습" 구역은 두지 않는다. 패널은 값을 고치는 곳이고, 쓰인 모습은 판(의미 색과 의미 글꼴의 예시)과 색 선택 창, 글꼴 추가 창이 보여 준다. */}
      <FoldSection title="쓰이는 곳" storageKey={WHERE_OPEN} startOpen note={uses.length + roles.length > 0 ? String(uses.length + roles.length) : '없음'} empty={uses.length + roles.length === 0}>
        {/* 쓰는 곳이 없으면 이 구역은 제목 줄만 남는다("없음"). 그래서 안에는 쓰는 곳이 있을 때의 목록만 있다. */}
        {(
          <div className="space-y-blocks">
            {/* 이 값을 가리키는 의미 색, 의미 글꼴, 의미 간격. 누르면 그 판의 그 값으로 간다. */}
            {roles.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onOpenToken(name)}
                className="-ml-button-ghost-x flex h-control max-w-full items-center rounded-md px-button-ghost-x type-label outline-selection hover:bg-hover focus-visible:outline-2"
              >
                <span className="truncate">{userOf(name).short}</span>
                <span className="ml-row-inner shrink-0 type-body text-ink-faint">{userOf(name).title}</span>
              </button>
            ))}
            {uses.map((u) => (
              <div key={u.index}>
                <button
                  type="button"
                  onClick={() => onOpenComponent(u.index)}
                  className="-ml-button-ghost-x flex h-control max-w-full items-center rounded-md px-button-ghost-x type-label outline-selection hover:bg-hover focus-visible:outline-2"
                >
                  <span className="truncate">{u.name}</span>
                  <span className="ml-row-inner shrink-0 type-body text-ink-faint">{u.where.length}곳</span>
                </button>
                <p className="type-body text-ink-faint">{u.where.join(', ')}</p>
              </div>
            ))}
          </div>
        )}
      </FoldSection>

      <FoldSection title="코드" storageKey={CODE_OPEN}>
        <CodeRows
          uses={[...classesOf(kind, short), `var(${token.name})`]}
          value={token.value}
          file={file}
          onCopy={onCopy}
          note={isColor && isApprox(token.value) ? '화면이 낼 수 없는 선명한 색이라, 위의 # 값은 가장 가까운 색이에요.' : undefined}
        />
      </FoldSection>
    </div>
  )
}

/** 여러 값을 함께 선택했을 때의 패널. 무엇을 골랐는지 보여 주고, 이름을 한꺼번에 바꾸는 창을 연다. */
export function MultiInspector({
  tokens,
  group,
  onRenameGroup,
  onRename,
}: {
  tokens: Token[]
  /** 한 색 목록을 통째로 선택했을 때 그 목록의 이름. 아니면 null. */
  group: string | null
  /** 목록 이름을 바꾼다. 바꿀 수 없으면 이유를 돌려준다. */
  onRenameGroup: (next: string) => string | null
  onRename: () => void
}) {
  const [draft, setDraft] = useState(group ?? '')
  const [error, setError] = useState<string | null>(null)

  function commitGroup() {
    const next = draft.trim()
    if (next === group) return setError(null)
    setError(next ? onRenameGroup(next) : '이름을 입력해 주세요.')
  }

  return (
    <div>
      <Section>
        <h2 className="type-heading">{tokens.length}개 선택됨</h2>
      </Section>

      {group !== null && (
        <Section title="목록 이름">
          <input
            aria-label="목록 이름"
            data-rename="group"
            className={`${inputClass} ${error ? 'border-danger focus:border-danger' : ''}`}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setError(null)
            }}
            onBlur={commitGroup}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
          {error && <span className="mt-label block type-body text-danger">{error}</span>}
        </Section>
      )}

      <Section title="선택한 값">
        <div className="flex flex-wrap gap-actions-tight">
          {tokens.map((t) => (
            <Chip key={t.name}>{t.name}</Chip>
          ))}
        </div>
      </Section>

      <Section>
        <Button variant="ghost" className="-ml-button-ghost-x" title="Ctrl+R" onClick={onRename}>
          <PencilLine size={16} strokeWidth={1.5} />
          번호 다시 매기기
        </Button>
      </Section>
    </div>
  )
}
