// 의미 글꼴: 글꼴 판의 재료 가운데 실제로 쓰는 조합(글꼴 종류 · 글자 크기 · 굵기)에 쓰임새의 이름을 붙여 모아 둔 판과, 그것을 만들고 고치는 양식.
// 한 줄에 조합 하나. 이름과 가리키는 값, 설명, 그 조합으로 적은 견본을 나란히 보여 준다.

import { useContext, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent } from 'react'
import { PreviewSpaceContext } from './ColorUses'
import { ArrowUpRight, TriangleAlert, X } from 'lucide-react'
import type { Token } from './lib/api'
import { KINDS, SLUG, lineName, shortName, trackName, type Kind } from './lib/catalog'
import { shownFont } from './lib/fonts'
import { surroundings, type Around } from './lib/roles'
import { SHAPE_WORDS, TYPE_USES, guessTypeUse, isListShape, lookOf, nextType, readType, readTypeNote, trackOverride, typeGroups, writeType, writeTypeNote, type TypeLook, type TypeParts, type TypeShape, type TypeUse } from './lib/types'
import { CODE_OPEN, CodeRows, FoldSection, ICON_BUTTON, Section, WHERE_OPEN } from './Inspector'
import { DetailsFolded, HOVER, OUTLINE, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'
import { Button, Field, Phrases, UsePicker, inputClass } from './ui'

const STYLE = KINDS.style
const FONT = KINDS.font
const SIZE = KINDS.size
const WEIGHT = KINDS.weight
// 예시의 바탕이 판의 바탕과 같은 색이어도 가장자리가 보이게 하는 옅은 선.
const EDGE = 'shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)]'


/**
 * 그 조합으로 글자를 그릴 때의 스타일.
 * 가리키는 값이 하나라도 없어졌으면 글꼴, 크기, 굵기, 줄 높이를 모두 비워 FF의 글자 모습을 따르게 한다. 실제 코드에서 그 조합이 통째로 무효가 되는 것과 같은 모습이다.
 */
export function styleOf(look: TypeLook): CSSProperties {
  if (look.broken) return { letterSpacing: look.track }
  return {
    fontFamily: look.family,
    fontSize: look.size,
    fontWeight: look.weight,
    lineHeight: look.line,
    letterSpacing: look.track,
  }
}

/** 가리키는 세 값을 짧은 이름으로 적은 것. sans · 2xl · semibold. 없어진 값은 빨갛게 적는다. */
function Spec({ look, tokens }: { look: TypeLook; tokens: Token[] }) {
  const has = (name: string) => tokens.some((t) => t.name === name)
  const part = (kind: Kind, name: string) => (
    <span className={has(name) ? '' : 'text-danger'}>{shortName(kind, name)}</span>
  )
  return (
    <>
      {part(FONT, look.parts.font)} · {part(SIZE, look.parts.size)} · {part(WEIGHT, look.parts.weight)}
      {/* 가리키는 값이 하나라도 없어졌으면 뒤에 "없어짐"을 붙인다(의미 색, 의미 간격과 같다). */}
      {[look.parts.font, look.parts.size, look.parts.weight].some((n) => !has(n)) && <span className="text-danger"> · 없어짐</span>}
    </>
  )
}

/**
 * 글자 크기를 따르는 값(줄 높이, 글자 사이)을 보여 주는 자리. 칸이 아니라 글자다. bound는 고른 크기에 묶인 값이다.
 * own은 이 조합에 직접 적혀 있는 값(예전에 적었거나 파일에서 손으로 고친 것)으로, 있으면 그것을 진하게 적고 지우는 버튼을 둔다.
 */
function Follows({ label, bound, own, onClear }: { label: string; bound: string; own?: string; onClear: () => void }) {
  return (
    <Field label={label} plain>
      <span className="flex h-8 items-center gap-actions-tight type-body">
        <span data-follows={label} className={`min-w-0 flex-1 truncate ${own ? 'type-label text-ink' : 'text-ink-soft'}`}>
          {own ?? (bound || '정해지지 않음')}
        </span>
        {own && (
          <button type="button" aria-label={`직접 정한 ${label} 지우기`} title={`이 조합에만 직접 정해 둔 값이에요. 지우면 글자 크기의 값(${bound || '정해지지 않음'})을 따라요`} onClick={onClear} className={ICON_BUTTON}>
            <X size={16} strokeWidth={1.5} />
          </button>
        )}
      </span>
    </Field>
  )
}

/** 실제로 그려지는 숫자. 28px / 36px / -0.015em · 600 */
const figures = (look: TypeLook) => [[look.size, look.line, look.track].filter(Boolean).join(' / '), look.weight].filter(Boolean).join(' · ')

/**
 * 그 조합이 실제로 쓰인 모습. 의미 색 판이 색을 그 역할로 쓰인 모습으로 보여 주듯, 의미 글꼴도 그 글자가 놓이는 자리에 놓아 보여 준다.
 * 어떤 자리인지는 줄마다 정한 예시의 모양(shape)을 따른다. 묶음으로 정하지 않는다. 한 묶음에도 쓰임이 여럿이라, 묶음으로 정하면 메뉴 글자가 버튼으로 그려진다.
 * 읽을 수 있는 글자는 그 조합으로 적은 것뿐이다. 곁에 놓이는 것(제목 아래의 본문, 입력칸에 적힌 값, 숫자 위의 이름표, 고르지 않은 메뉴 줄)은 글자가 아니라 옅은 회색 막대로 그려 자리만 알려 준다.
 * 바탕과 글자 색은 이 디자인 시스템의 것(around)이다. 이 안은 사용자의 글꼴을 보여 주는 미리보기라, FF 도구의 글자 규칙을 따르지 않는다. 큰 글자도 자르지 않고 줄을 바꿔 다 보여 준다.
 */
export function TypeSample({ shape, look, around, words: written = '' }: { shape: TypeShape; look: TypeLook; around: Around; words?: string }) {
  const own = styleOf(look)
  const space = useContext(PreviewSpaceContext)
  // 예시 문구. 줄에 적어 둔 것이 있으면 그것(그 시스템이 실제로 쓰는 말), 없으면 모양의 기본 문구다. 늘어놓는 모양은 ", "로 나눈다.
  const all = written || SHAPE_WORDS[shape]
  const list = isListShape(shape) ? all.split(', ').map((w) => w.trim()).filter(Boolean) : [all]
  // 막대, 테두리, 옅은 바탕의 색. 글자 색을 바탕에 옅게 섞는다.
  const faint = `color-mix(in oklab, ${around.ink} 16%, ${around.surface})`
  const soft = `color-mix(in oklab, ${around.ink} 8%, ${around.surface})`
  /** 곁에 놓이는 글의 자리. 높이 8px의 막대이고 폭은 자리마다 다르다. */
  const bar = (width: string, more = '') => <span className={`block h-2 rounded-sm ${width} ${more}`} style={{ background: faint }} />
  const words = (text: string, more = '', style?: CSSProperties) => (
    <span key={text} data-sample className={`block ${more}`} style={{ ...own, ...style }}>
      {text}
    </span>
  )
  const scene = () => {
    switch (shape) {
      case 'title':
        return (
          <>
            {words(all, 'break-words')}
            {bar('w-3/4', 'mt-fields')}
            {bar('w-1/2', 'mt-blocks')}
          </>
        )
      case 'caption':
        return (
          <>
            {bar('w-32')}
            {words(all, 'mt-blocks break-words')}
          </>
        )
      case 'button':
        return (
          <span className="flex flex-wrap items-center gap-actions">
            {/* 첫 버튼은 채우고 나머지는 테두리만 둔다. */}
            {list.map((text, i) => words(text, 'rounded-md px-button-x py-box whitespace-nowrap', i === 0 ? { background: around.ink, color: around.surface } : { boxShadow: `inset 0 0 0 1px ${faint}` }))}
          </span>
        )
      case 'field':
        return (
          <>
            {words(all, 'break-words')}
            <span className="mt-label flex h-8 w-40 items-center rounded-md px-input-x" style={{ boxShadow: `inset 0 0 0 1px ${faint}` }}>
              {bar('w-16')}
            </span>
          </>
        )
      case 'menu':
        return (
          <span className="block w-40 space-y-rows">
            {list.map((text) => words(text, 'rounded-md px-row-x py-menu whitespace-nowrap'))}
          </span>
        )
      case 'menu-on':
        // 고른 줄만 글자다. 고르지 않은 줄은 다른 조합(보통 굵기)으로 적히는 자리라 막대로 둔다.
        return (
          <span className="block w-40 space-y-rows">
            <span className="flex h-6 items-center px-row-x">{bar('w-12')}</span>
            {words(all, 'rounded-md px-row-x py-menu whitespace-nowrap', { background: soft })}
            <span className="flex h-6 items-center px-row-x">{bar('w-16')}</span>
          </span>
        )
      case 'tab':
        return (
          <span className="flex flex-wrap gap-columns" style={{ boxShadow: `inset 0 -1px 0 ${faint}` }}>
            {list.map((text, i) => words(text, 'py-box whitespace-nowrap', i === 0 ? { boxShadow: `inset 0 -2px 0 ${around.ink}` } : undefined))}
          </span>
        )
      case 'badge':
        return (
          <span className="flex flex-wrap items-center gap-blocks">
            {/* 첫 뱃지는 옅은 바탕, 나머지는 채운다. */}
            {list.map((text, i) => words(text, 'rounded-full px-row-x py-menu whitespace-nowrap', i === 0 ? { background: soft } : { background: around.ink, color: around.surface }))}
          </span>
        )
      case 'number':
        return (
          <span className="flex flex-wrap gap-x-groups gap-y-blocks">
            {list.map((value) => (
              <span key={value}>
                {bar('w-12')}
                {words(value, 'mt-blocks break-words')}
              </span>
            ))}
          </span>
        )
      case 'code':
        return (
          <>
            {bar('w-12')}
            <span className="mt-blocks flex">{words(all, 'rounded-sm px-chip-x break-all', { background: soft })}</span>
          </>
        )
      default:
        return words(all, 'break-words')
    }
  }
  return (
    <span className={`block w-full overflow-hidden rounded-md px-section-x py-section-y ${EDGE}`} style={{ ...space, background: around.surface, color: around.ink }}>
      {scene()}
    </span>
  )
}

type Drag = { what: 'row' | 'group'; id: string; use: TypeUse; x: number; y: number; moved: boolean }
/** 끄는 중에 놓일 자리. before 앞에 놓인다(맨 끝이면 null). */
type Drop = { what: 'row' | 'group'; id: string; use: TypeUse; before: string | null }

// 끄는 중에 놓일 자리를 알려 주는 선. 확대 비율과 관계없이 화면에서 같은 굵기로 보인다.
const DROP_LINE = 'pointer-events-none absolute z-10 bg-selection'

/**
 * 의미 글꼴 판의 내용. 묶음(제목, 본문, 보조, 조작, 숫자·코드)별로 묶어 보여 준다. 의미 색 판과 같은 짜임이다.
 * 묶음의 순서와 묶음 안의 순서는 파일에 적힌 순서이고, 끌어서 바꾸면 파일의 순서가 바뀐다.
 * 줄마다 왼쪽에 이름, 가리키는 값, 설명이 있고 오른쪽에 그 조합이 쓰인 장면이 있다.
 */
export function TypeList({
  items,
  all,
  selected,
  onSelect,
  onSelectGroup,
  onRename,
  onMove,
  onMoveGroup,
}: {
  items: Token[]
  /** 가리키는 값을 찾을 전체 값 목록. */
  all: Token[]
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  /** 묶음 제목을 누르면 그 묶음의 조합을 모두 선택한다. */
  onSelectGroup: (names: string[], additive: boolean, rename: boolean) => void
  onRename: (name: string) => void
  /** 조합을 같은 묶음 안의 다른 자리로 옮긴다. before는 그 앞에 놓일 조합(묶음의 맨 끝이면 null). */
  onMove: (name: string, before: string | null) => void
  onMoveGroup: (use: TypeUse, before: TypeUse | null) => void
}) {
  // 판을 접었으면 설명과 예시를 숨기고 이름과 값만 보여 준다.
  const plain = useContext(DetailsFolded)
  const drag = useRef<Drag | null>(null)
  // 끌기가 끝난 직후에 따라오는 클릭은 선택으로 치지 않는다.
  const dragged = useRef(false)
  const [drop, setDrop] = useState<Drop | null>(null)
  if (items.length === 0) return null
  const around = surroundings(all)
  const groups = typeGroups(items)
  // 가리키는 글꼴 종류, 크기, 굵기 가운데 하나라도 없어진 조합들. 줄마다 빨갛게 적혀 있지만 목록이 길면 몇 개인지 한눈에 알 수 없어서 맨 위에 모아 알린다.
  const broken = items.filter((t) => lookOf(all, t.value, t.name)?.broken ?? true)

  const boxOf = (selector: string) => document.querySelector(selector)?.getBoundingClientRect()

  /** 마우스 자리에서 놓으면 어느 것의 앞에 들어가는지. 세로 한가운데보다 위면 그것의 앞이다. */
  function slotAt(d: Drag, y: number): string | null {
    if (d.what === 'group') {
      for (const g of groups) {
        const box = boxOf(`[data-type-group="${g.use}"]`)
        if (box && y < box.top + box.height / 2) return g.use
      }
      return null
    }
    for (const t of groups.find((g) => g.use === d.use)?.items ?? []) {
      const box = boxOf(`[data-token="${CSS.escape(t.name)}"]`)
      if (box && y < box.top + box.height / 2) return t.name
    }
    return null
  }

  /** 잡고 끄는 것(묶음 제목이나 조합 한 줄)에 붙이는 동작. 조금이라도 끌어야 옮기기로 치고, 그냥 누르면 선택이다. */
  const grab = (what: Drag['what'], id: string, use: TypeUse) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return
      // 캔버스가 이 끌기를 영역 선택으로 받지 않게 막는다.
      e.stopPropagation()
      // 누르는 순간부터 마우스를 붙잡아 둔다. 빠르게 끌어 밖으로 나가도 계속 따라갈 수 있다.
      e.currentTarget.setPointerCapture(e.pointerId)
      drag.current = { what, id, use, x: e.clientX, y: e.clientY, moved: false }
    },
    onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
      const d = drag.current
      if (!d) return
      if (!d.moved) {
        if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 5) return
        d.moved = true
      }
      setDrop({ what: d.what, id: d.id, use: d.use, before: slotAt(d, e.clientY) })
    },
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
      const d = drag.current
      drag.current = null
      setDrop(null)
      if (!d?.moved) return
      dragged.current = true
      window.setTimeout(() => (dragged.current = false))
      const before = slotAt(d, e.clientY)
      if (d.what === 'group') onMoveGroup(d.use, before as TypeUse | null)
      else onMove(d.id, before)
    },
    onPointerCancel: () => {
      drag.current = null
      setDrop(null)
    },
  })

  return (
    <div>
      {broken.length > 0 && (
        // 누르면 그 가운데 첫 조합을 골라, 오른쪽 패널에서 바로 고칠 수 있다.
        <button
          type="button"
          data-broken={broken.length}
          title="누르면 첫 조합을 골라요. 오른쪽에서 없어진 값을 다시 골라 주세요"
          onClick={() => onSelect(broken[0].name, false)}
          className={`mb-blocks flex h-8 items-center gap-row-inner rounded-md px-button-x type-body text-danger ${HOVER} ${OUTLINE}`}
        >
          <TriangleAlert size={16} strokeWidth={1.5} />
          가리키는 값이 없어진 조합 {broken.length}개
        </button>
      )}
      <div className="space-y-groups">
        {groups.map(({ use, items: list }, gi) => {
          const groupDrop = drop?.what === 'group' && drop.id !== use ? drop : null
          const rowDrop = drop?.what === 'row' && drop.use === use ? drop : null
          return (
            <div key={use} data-type-group={use} className={`relative ${drop?.what === 'group' && drop.id === use ? 'opacity-40' : ''}`}>
              {groupDrop?.before === use && <span className={`${DROP_LINE} inset-x-0 -top-3 h-[calc(var(--line)*2)] -translate-y-1/2`} />}
              {groupDrop?.before === null && gi === groups.length - 1 && (
                <span className={`${DROP_LINE} inset-x-0 -bottom-3 h-[calc(var(--line)*2)] translate-y-1/2`} />
              )}
              {/* 묶음 제목을 누르면 그 묶음의 조합이 모두 선택되고, 잡고 위아래로 끌면 묶음이 통째로 옮겨진다. */}
              <div className="mb-heading -ml-chip-x flex">
                <button
                  type="button"
                  data-type-title={use}
                  onClick={(e) => !dragged.current && onSelectGroup(list.map((t) => t.name), isAdditive(e), false)}
                  {...grab('group', use, use)}
                  className="cursor-grab active:cursor-grabbing rounded-sm px-chip-x type-heading outline-selection hover:bg-hover focus-visible:outline-2"
                >
                  {TYPE_USES.find((u) => u.id === use)!.label}
                </button>
              </div>
              <div className="space-y-rows rounded-lg border border-hairline bg-canvas p-menu">
                {list.map((t, i) => {
                  const short = shortName(STYLE, t.name)
                  const { text, shape, words, more } = readTypeNote(t.note, short)
                  const look = lookOf(all, t.value, t.name)
                  const isSelected = selected.includes(t.name)
                  const moving = rowDrop?.id === t.name
                  // 놓일 자리의 선. 줄 위(맨 끝이면 마지막 줄 아래)에 가로로 긋는다.
                  const lineBefore = rowDrop && !moving && rowDrop.before === t.name
                  const lineAfter = rowDrop && !moving && rowDrop.before === null && i === list.length - 1
                  return (
                    <button
                      key={t.name}
                      type="button"
                      data-token={t.name}
                      aria-pressed={isSelected}
                      aria-label={short}
                      onClick={(e) => !dragged.current && onSelect(t.name, isAdditive(e))}
                      onDoubleClick={() => onRename(t.name)}
                      {...grab('row', t.name, use)}
                      className={`group relative flex w-full items-center gap-columns rounded-md px-board-row-x py-board-row-y text-left select-none ${moving ? 'opacity-40' : ''} ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
                    >
                      {lineBefore && <span className={`${DROP_LINE} inset-x-0 top-0 h-[calc(var(--line)*2)] -translate-y-1/2`} />}
                      {lineAfter && <span className={`${DROP_LINE} inset-x-0 bottom-0 h-[calc(var(--line)*2)] translate-y-1/2`} />}
                      <span className="w-56 shrink-0">
                        {/* 이름, 가리키는 값, 설명, 예시는 자르지 않는다(말줄임표를 쓰지 않는다). 칸보다 길면 줄을 바꿔 다 보여 준다. */}
                        <span data-name className="block type-label break-words">
                          {short}
                        </span>
                        <span className="block type-code-sm break-words text-ink-faint">
                          {look ? <Spec look={look} tokens={all} /> : <span className="text-danger">읽을 수 없는 값</span>}
                        </span>
                        {!plain && text && (
                          <span className="mt-label block type-caption break-words text-ink-faint">
                            <Phrases text={text} />
                          </span>
                        )}
                      </span>
                      {/* 쓰임이 여럿인 조합은 예시도 여럿이다. 위아래로 8px 띄워 쌓는다. */}
                      <span className="min-w-0 flex-1 space-y-blocks">
                        {!plain && look && [{ shape, words }, ...more].map((e, k) => <TypeSample key={k} shape={e.shape} look={look} around={around} words={e.words} />)}
                      </span>
                      {isSelected && selected.length === 1 && <SelectionLabel name={short} value={look ? figures(look) : undefined} />}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** 기본 값 가운데 하나를 고르는 칸. 의미 글꼴은 세 값을 모두 가리켜야 하므로 "없음"은 없다. */
function PartField({
  label,
  kind,
  tokens,
  value,
  show,
  onChange,
  onOpen,
}: {
  label: string
  kind: Kind
  tokens: Token[]
  value: string
  /** 이름 옆에 적을 값(글꼴 이름, 28px, 600). */
  show: (t: Token) => string
  onChange: (name: string) => void
  /** 고른 값이 있는 판으로 가서 그 값을 보여 준다. */
  onOpen: (name: string) => void
}) {
  const options = tokens.filter((t) => kind.matches(t.name))
  const missing = !options.some((t) => t.name === value)
  return (
    <Field label={label} error={missing ? '고른 값이 없어졌어요. 다시 골라 주세요.' : null}>
      {/* 고르는 칸 옆에, 고른 값이 글꼴 판의 어디에 있는지 보러 가는 버튼. "쓰이는 곳"의 반대 방향이다. 고른 값이 없어졌으면 갈 곳이 없어 꺼진다. */}
      <span className="flex items-center gap-actions-tight">
      <select aria-label={label} className={`${inputClass} min-w-0 flex-1 ${missing ? 'border-danger' : ''}`} value={value} onChange={(e) => onChange(e.target.value)}>
        {missing && <option value={value}>{shortName(kind, value)} (없어짐)</option>}
        {options.map((t) => (
          <option key={t.name} value={t.name}>
            {shortName(kind, t.name)} · {show(t)}
          </option>
        ))}
      </select>
        <button type="button" aria-label={`${label} 보러 가기`} title={`글꼴 판에서 ${shortName(kind, value)} 보기`} disabled={missing} onClick={() => onOpen(value)} className={`${ICON_BUTTON} disabled:pointer-events-none disabled:opacity-disabled`}>
          <ArrowUpRight size={16} strokeWidth={1.5} />
        </button>
      </span>
    </Field>
  )
}

/** 의미 글꼴 하나를 고치는 오른쪽 패널. */
export function TypeInspector({
  token,
  tokens,
  file,
  uses,
  onOpenComponent,
  onOpenToken,
  onRename,
  onChange,
  onTrack,
  onCopy,
}: {
  token: Token
  tokens: Token[]
  file: string
  /** 이 의미 글꼴을 쓰는 컴포넌트와 그 자리들. */
  uses: { index: number; name: string; where: string[] }[]
  onOpenComponent: (index: number) => void
  /** 이 조합이 가리키는 값(글꼴 종류, 크기, 굵기)이 있는 판으로 간다. */
  onOpenToken: (name: string) => void
  onRename: (next: string) => void
  /** 가리키는 값이나 설명(주석)을 바꾼다. */
  onChange: (patch: { value?: string; note?: string }) => void
  /** 글자 사이를 직접 정한다(0.08em). null이면 다시 크기를 따른다. */
  onTrack: (value: string | null) => void
  onCopy: (text: string) => void
}) {
  const short = shortName(STYLE, token.name)
  const [nameDraft, setNameDraft] = useState(short)
  const [nameError, setNameError] = useState<string | null>(null)
  const { use, text, picked, words, more } = readTypeNote(token.note, short)
  const [noteDraft, setNoteDraft] = useState(text)
  const look = lookOf(tokens, token.value, token.name)
  const names = new Set(tokens.map((t) => t.name))
  const get = (name: string) => tokens.find((t) => t.name === name)?.value ?? ''

  function commitName() {
    const next = nameDraft.trim()
    setNameError(null)
    if (!next) return setNameError('이름을 입력해 주세요.')
    if (!SLUG.test(next)) return setNameError('영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.')
    if (next === short) return
    if (names.has(STYLE.prefix + next)) return setNameError('같은 이름이 이미 있어요.')
    onRename(STYLE.prefix + next)
  }

  function commitNote() {
    // 주석을 끝내는 기호와 줄바꿈은 파일을 깨뜨리므로 뺀다.
    const clean = noteDraft.replace(/\*\//g, '').replace(/\s+/g, ' ').trim()
    if (clean !== text) saveNote({ text: clean })
  }

  /**
   * 묶음과 설명을 주석에 적어 저장한다. 같은 주석에 적혀 있는 예시(모양과 문구)는 그대로 둔다.
   * 예시는 패널에서 고치지 않는다. 그 조합이 화면 어디에 어떤 말로 쓰였는지는 페이지를 만든 AI가 알고, AI가 파일의 주석에 적는다(파일 맨 위의 안내 참고).
   */
  function saveNote(patch: { use?: TypeUse; text?: string }) {
    onChange({ note: writeTypeNote(patch.use ?? use, patch.text ?? noteDraft, picked, words, more) })
  }

  /** 코드에서 쓰는 클래스 이름. 저장할 때 서버가 tokens.css에 같은 이름으로 적어 둔다(server/tokensCss.ts의 typeClasses). */
  const className = `type-${short}`

  const set = (patch: Partial<TypeParts>) => look && onChange({ value: writeType({ ...look.parts, ...patch }, names) })

  return (
    <div>
      <Section>
        <h2 className="type-heading break-all">{short}</h2>
      </Section>

      <Section title="이름">
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
        {nameError && <span className="mt-label block type-body text-danger">{nameError}</span>}
      </Section>

      <Section title="조합">
        {look ? (
          <div className="space-y-blocks">
            <PartField label="글꼴 종류" kind={FONT} tokens={tokens} value={look.parts.font} show={(t) => shownFont(t.value)} onChange={(font) => set({ font })} onOpen={onOpenToken} />
            <PartField label="글자 크기" kind={SIZE} tokens={tokens} value={look.parts.size} show={(t) => t.value} onChange={(size) => set({ size })} onOpen={onOpenToken} />
            {/* 차례는 글꼴 판과 같다: 크기, 줄 높이, 글자 사이, 그다음 굵기. 줄 높이와 글자 사이는 크기에 딸린 값이라 크기 바로 아래에 둔다. */}
            {/* 줄 높이와 글자 사이는 고르지 않는다. 고른 글자 크기에 묶인 값을 그대로 따르고, 여기서는 그 값을 보여 주기만 한다.
                의미 색이 색상 판의 색만 가리키듯, 의미 글꼴도 글꼴 판에 있는 값만 쓴다. 다른 줄 높이가 필요하면 글꼴 판에 크기 단계를 하나 더 만들어 고른다.
                예전에 직접 적어 둔 값이 있는 조합은 그 값으로 그리되 진하게 적고, 지우는 버튼만 둔다(말없이 사라지지 않게). */}
            <div className="grid grid-cols-2 gap-field-row">
              <Follows label="줄 높이" bound={get(lineName(look.parts.size))} own={look.parts.line} onClear={() => set({ line: undefined })} />
              <Follows label="글자 사이" bound={get(trackName(look.parts.size)) || '0em'} own={trackOverride(tokens, token.name) ?? undefined} onClear={() => onTrack(null)} />
            </div>
            <PartField label="굵기" kind={WEIGHT} tokens={tokens} value={look.parts.weight} show={(t) => t.value} onChange={(weight) => set({ weight })} onOpen={onOpenToken} />
          </div>
        ) : (
          <p className="type-body text-danger">읽을 수 없는 값이에요. 파일에서 값을 고쳐 주세요.</p>
        )}
      </Section>

      {/* 묶음은 판에서 이 조합이 놓이는 자리와 예시의 장면을 정한다. 의미 색 패널의 "역할"과 같은 자리다. */}
      <Section title="묶음">
        <UsePicker label="묶음" options={TYPE_USES} value={use} nameWidth="w-16" onChange={(next) => saveNote({ use: next })} />
      </Section>

      <Section title="설명">
        <input
          className={inputClass}
          aria-label="설명"
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={commitNote}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      </Section>

      <FoldSection title="쓰이는 곳" storageKey={WHERE_OPEN} startOpen note={uses.length > 0 ? String(uses.length) : '없음'} empty={uses.length === 0}>
          <div className="space-y-blocks">
            {uses.map((u) => (
              <div key={u.index}>
                <button
                  type="button"
                  onClick={() => onOpenComponent(u.index)}
                  className="-ml-button-ghost-x flex h-8 max-w-full items-center rounded-md px-button-ghost-x type-label outline-selection hover:bg-hover focus-visible:outline-2"
                >
                  <span className="truncate">{u.name}</span>
                  <span className="ml-row-inner shrink-0 type-body text-ink-faint">{u.where.length}곳</span>
                </button>
                <p className="type-body text-ink-faint">{u.where.join(', ')}</p>
              </div>
            ))}
          </div>
      </FoldSection>

      <FoldSection title="코드" storageKey={CODE_OPEN}>
        {/* 클래스가 먼저다. FF가 저장할 때 의미 글꼴마다 type-이름 클래스를 함께 적어 두므로, 코드에서는 이 한 단어로 글꼴, 크기, 굵기, 줄 높이가 모두 정해진다. */}
        <CodeRows uses={[className, `font: var(${token.name});`]} value={token.value} file={file} onCopy={onCopy} />
      </FoldSection>
    </div>
  )
}

/**
 * 의미 글꼴을 만드는 양식. 이름, 조합(글꼴 종류 · 글자 크기 · 굵기), 묶음을 정한다. 설명은 만든 뒤에 패널에서 적는다.
 * 처음에는 기본 한 벌 가운데 아직 없는 다음 것의 이름과 조합이 채워져 있어서, 그대로 "추가"를 누르면 전처럼 다음 조합이 생긴다.
 * 다른 의미 판(의미 색, 의미 간격)의 추가도 창에서 이름과 가리키는 값을 정한다.
 */
export function NewTypeForm({ tokens, onCreate, onCancel }: { tokens: Token[]; onCreate: (name: string, value: string, note: string) => void; onCancel: () => void }) {
  const made = nextType(tokens)
  const start = made ? readType(made.value) : null
  const options = (kind: Kind) => tokens.filter((t) => kind.matches(t.name)).map((t) => ({ id: t.name, label: shortName(kind, t.name), hint: kind.id === 'font' ? shownFont(t.value) : t.value }))
  const fonts = options(FONT)
  const sizes = options(SIZE)
  const weights = options(WEIGHT)
  const pick = (list: { id: string }[], want?: string) => (list.some((o) => o.id === want) ? want! : (list[0]?.id ?? ''))
  const [name, setName] = useState(made ? shortName(STYLE, made.name) : '')
  const [font, setFont] = useState(pick(fonts, start?.font))
  const [size, setSize] = useState(pick(sizes, start?.size))
  const [weight, setWeight] = useState(pick(weights, start?.weight))
  // 묶음은 직접 고르기 전까지 이름에서 짐작한 것을 보여 준다.
  const [use, setUse] = useState<TypeUse | null>(null)
  const [error, setError] = useState<string>()
  const shownUse = use ?? guessTypeUse(name.trim())

  function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const problem = !n ? '이름을 입력해 주세요.' : !SLUG.test(n) ? '영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.' : tokens.some((t) => t.name === STYLE.prefix + n) ? '같은 이름이 이미 있어요.' : undefined
    setError(problem)
    if (problem) return
    onCreate(STYLE.prefix + n, writeType({ font, size, weight }, new Set(tokens.map((t) => t.name))), writeTypeNote(shownUse, ''))
  }

  return (
    <form onSubmit={submit} className="space-y-fields">
      <Field label="이름" error={error}>
        <input
          autoFocus
          className={inputClass}
          value={name}
          placeholder="body"
          onChange={(e) => {
            setName(e.target.value)
            setError(undefined)
          }}
        />
      </Field>
      <Field label="글꼴 종류" plain>
        <UsePicker label="글꼴 종류" options={fonts} value={font} onChange={setFont} />
      </Field>
      <Field label="글자 크기" plain>
        <UsePicker label="글자 크기" options={sizes} value={size} onChange={setSize} />
      </Field>
      <Field label="굵기" plain>
        <UsePicker label="굵기" options={weights} value={weight} nameWidth="w-20" onChange={setWeight} />
      </Field>
      <Field label="묶음" plain>
        <UsePicker label="묶음" options={TYPE_USES} value={shownUse} nameWidth="w-16" onChange={setUse} />
      </Field>
      <div className="mt-dialog-actions flex justify-end gap-actions">
        <Button variant="ghost" onClick={onCancel}>
          취소
        </Button>
        <Button variant="primary" type="submit">
          추가
        </Button>
      </div>
    </form>
  )
}
