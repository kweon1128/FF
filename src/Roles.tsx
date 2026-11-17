// 의미 색: 색상 판의 색 가운데 실제로 쓰는 색에 쓰임새의 이름을 붙여 모아 둔 판과, 그것을 만들고 고치는 양식.
// 한 줄에 색 하나. 색, 이름과 가리키는 단계, 역할과 설명, 그 역할로 쓰인 예시를 나란히 보여 준다.

import { useContext, useRef, useState, type FormEvent, type PointerEvent, type ReactNode } from 'react'
import { ArrowUpRight, Copy } from 'lucide-react'
import type { Token } from './lib/api'
import { KINDS, SLUG, groupOf, shortName, type Kind } from './lib/catalog'
import { contrast, showColor } from './lib/color'
import { ROLE_USES, ROLE_WORDS, guessUse, isRoleListShape, readNote, refOf, refTo, resolveColor, roleGroups, surroundings, writeNote, type Around, type RoleShape, type RoleUse } from './lib/roles'
import { DARK, PreviewFontContext, inkOn } from './ColorUses'
import { CODE_OPEN, FoldSection, ICON_BUTTON, Section, WHERE_OPEN } from './Inspector'
import { HOVER, OUTLINE, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'
import { Button, Chip, Field, UsePicker, inputClass, swatchBackground } from './ui'

const COLOR = KINDS.color
const ROLE = KINDS.role
const EDGE = 'shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)]'

/** 가리키는 색을 짧게 적은 이름. --color-blue-600 → blue-600 */
const refName = (value: string) => (refOf(value) ?? value).replace(/^--color-/, '')

/**
 * 색이 실제로 쓰인 모습. 주변(바탕과 글자)은 이 디자인 시스템의 색으로 그려서, 실제 화면에서 만나는 조합 그대로 보여 준다.
 * 어떤 자리에 칠할지는 줄마다 정한 예시의 모양(shape)을 따르고, 그 안의 말은 줄마다 적은 문구(words. 그 시스템이 실제로 쓰는 말)다. 의미 글꼴의 예시와 같은 방식이다.
 * 역할로 정하지 않는다. 한 역할에도 쓰임이 여럿이라(바탕 역할에 패널의 면도, 마우스를 올린 줄도 있다) 역할로 정하면 설명과 맞지 않는다.
 * 곁에 놓이는 것(다른 줄, 면 안의 본문)은 옅은 막대로 그려 자리만 알려 준다. 눈이 그 색이 칠해진 곳으로 가게 하려는 것이다.
 * 이 안은 사용자의 색과 글꼴을 보여 주는 미리보기라, FF 도구의 흑백 규칙과 글자 규칙(type- 클래스)을 따르지 않는다. 글꼴 종류를 바깥에서 물려받아야 해서 크기와 굵기를 따로 적는다.
 */
export function RoleSample({ shape, color, around, words: written = '' }: { shape: RoleShape; color: string; around: Around; words?: string }) {
  const font = useContext(PreviewFontContext)
  const rgb = color.slice(0, 7)
  const light = (hex: string) => contrast(hex.slice(0, 7), '#ffffff') < 3
  const all = written || ROLE_WORDS[shape]
  const list = isRoleListShape(shape) ? all.split(', ').map((w) => w.trim()).filter(Boolean) : [all]
  // 막대의 색. 그 면에 놓이는 글자 색을 면에 옅게 섞는다.
  const faintOn = (ink: string, surface: string) => `color-mix(in oklab, ${ink} 16%, ${surface})`
  const frame = (background: string, body: ReactNode) => (
    <span className={`block w-full overflow-hidden rounded-md px-3 py-3 ${light(background) ? EDGE : ''}`} style={{ background: swatchBackground(background), fontFamily: font }}>
      {body}
    </span>
  )
  const bar = (width: string, tone: string, more = '') => <span className={`block h-2 rounded-sm ${width} ${more}`} style={{ background: tone }} />
  // 선택 이름표와 간격 숫자 위의 글자. 이런 표시는 밝은 파랑이나 주황 위에 흰 글자를 쓰는 것이 보통이라, 흰 글자가 어느 정도 읽히면 흰색을 쓴다.
  const onMark = (hex: string) => (contrast('#ffffff', hex.slice(0, 7)) >= 2.5 ? '#ffffff' : inkOn(hex))
  const STRONG = 'text-sm leading-5 font-[550]'
  const SMALL = 'text-xs leading-4 font-[550]'
  const faint = faintOn(around.ink, around.surface)
  const soft = `color-mix(in oklab, ${color} 12%, ${around.surface})`
  switch (shape) {
    case 'text': {
      // 이 시스템의 바탕 위에서 거의 보이지 않는 글자 색은 짙은 면 위에 쓰는 색이다. 그때는 이 시스템의 글자 색(없으면 어두운 회색)을 바탕으로 깐다.
      const hidden = contrast(rgb, around.surface.slice(0, 7)) < 1.6
      const back = hidden ? (contrast(rgb, around.ink.slice(0, 7)) >= 3 ? around.ink : DARK.surface) : around.surface
      return frame(
        back,
        <>
          <span data-sample className={`block break-words ${STRONG}`} style={{ color }}>
            {all}
          </span>
          {bar('w-3/4', faintOn(color, back), 'mt-2')}
        </>,
      )
    }
    case 'surface': {
      // 이 시스템의 글자 색이 이 바탕에서 읽히지 않으면 흰색과 검정 중 읽히는 쪽을 쓴다.
      const ink = contrast(around.ink.slice(0, 7), rgb) >= 3 ? around.ink : inkOn(color)
      return frame(
        color,
        <>
          <span data-sample className={`block break-words ${STRONG}`} style={{ color: ink }}>
            {all}
          </span>
          {bar('w-3/4', faintOn(ink, color), 'mt-2')}
          {bar('w-1/2', faintOn(ink, color), 'mt-2')}
        </>,
      )
    }
    case 'row': {
      // 목록의 세 줄 가운데 한 줄에만 이 색을 깐다. 나머지 줄은 막대다.
      const ink = contrast(around.ink.slice(0, 7), rgb) >= 3 ? around.ink : inkOn(color)
      return frame(
        around.surface,
        <span className="block space-y-1">
          <span className="flex h-6 items-center px-2">{bar('w-12', faint)}</span>
          <span data-sample className={`block rounded-md px-2 py-1 break-words ${STRONG}`} style={{ background: color, color: ink }}>
            {all}
          </span>
          <span className="flex h-6 items-center px-2">{bar('w-16', faint)}</span>
        </span>,
      )
    }
    case 'border':
      return frame(
        around.surface,
        <span data-sample className={`flex h-8 items-center rounded-md px-2 ${STRONG}`} style={{ boxShadow: `inset 0 0 0 1px ${color}`, color: around.ink }}>
          <span className="min-w-0 truncate">{all}</span>
        </span>,
      )
    case 'divider':
      return frame(
        around.surface,
        <>
          {bar('w-1/2', faint)}
          <span className="my-2 block h-px w-full" style={{ background: color }} />
          {bar('w-3/4', faint)}
        </>,
      )
    case 'on-fill':
      // 채운 버튼 위의 글자. 버튼은 이 시스템의 글자 색으로 채운다.
      return frame(
        around.surface,
        <span className="flex flex-wrap items-center gap-2">
          {list.map((text) => (
            <span key={text} data-sample className={`flex h-7 items-center rounded-md px-2 whitespace-nowrap ${STRONG}`} style={{ background: around.ink, color }}>
              {text}
            </span>
          ))}
        </span>,
      )
    case 'badge':
      // 첫 뱃지는 이 색을 옅게 깐 바탕에 이 색 글자, 나머지는 이 색으로 채운다.
      return frame(
        around.surface,
        <span className="flex flex-wrap items-center gap-2">
          {list.map((text, i) => (
            <span key={text} data-sample className={`flex h-6 items-center rounded-full px-2 whitespace-nowrap ${SMALL}`} style={i === 0 ? { background: soft, color } : { background: color, color: inkOn(color) }}>
              {text}
            </span>
          ))}
        </span>,
      )
    case 'outline': {
      // 고른 것을 두르는 선과 네 꼭짓점, 그 아래에 붙는 이름표. 선은 고른 것의 가장자리에 틈 없이 붙고 꼭짓점은 선 위에 걸친다.
      const HANDLE = 'absolute size-1.5'
      const corner = { background: around.surface, boxShadow: `inset 0 0 0 1px ${color}` }
      return frame(
        around.surface,
        <span className="flex flex-col items-center px-1 pt-1">
          <span className="relative flex h-8 w-full items-center px-2" style={{ boxShadow: `0 0 0 1px ${color}` }}>
            {bar('w-1/2', faint)}
            <span className={`${HANDLE} -top-1 -left-1`} style={corner} />
            <span className={`${HANDLE} -top-1 -right-1`} style={corner} />
            <span className={`${HANDLE} -bottom-1 -left-1`} style={corner} />
            <span className={`${HANDLE} -right-1 -bottom-1`} style={corner} />
          </span>
          <span data-sample className={`mt-2 rounded-xs px-1 whitespace-nowrap ${SMALL}`} style={{ background: color, color: onMark(color) }}>
            {all}
          </span>
        </span>,
      )
    }
    case 'guide':
      // 판을 끌 때의 모습. 두 상자의 왼쪽 가장자리가 맞았다고 알리는 세로 선과, 두 상자 사이의 간격을 적은 숫자.
      return frame(
        around.surface,
        <span className="relative block pl-2">
          <span className="absolute inset-y-0 left-2 w-px" style={{ background: color }} />
          <span className="block h-4 w-24 rounded-sm" style={{ background: faint }} />
          <span className="relative my-1 flex h-6 w-16 items-center justify-center">
            <span className="absolute inset-y-0 left-1/2 w-px" style={{ background: color }} />
            <span data-sample className={`relative rounded-xs px-1 whitespace-nowrap ${SMALL}`} style={{ background: color, color: onMark(color) }}>
              {all}
            </span>
          </span>
          <span className="block h-4 w-16 rounded-sm" style={{ background: faint }} />
        </span>,
      )
    case 'note':
      return frame(
        around.surface,
        <>
          {bar('w-1/2', faint)}
          <span data-sample className="mt-2 block text-xs leading-4 break-words" style={{ color }}>
            {all}
          </span>
        </>,
      )
    case 'chart': {
      // 계열 하나의 막대들. 값이 다른 막대 여럿으로, 넓은 면에 칠했을 때의 인상을 본다.
      const bars = [40, 65, 50, 85, 60, 100, 75]
      return frame(
        around.surface,
        <span className="flex h-10 items-end gap-1">
          {bars.map((h, i) => (
            <span key={i} className="w-4 rounded-t-sm" style={{ height: `${h}%`, background: color }} />
          ))}
        </span>,
      )
    }
    default:
      // 버튼: 이 색으로 채운 버튼들.
      return frame(
        around.surface,
        <span className="flex flex-wrap items-center gap-2">
          {list.map((text) => (
            <span key={text} data-sample className={`flex h-7 items-center rounded-md px-2 whitespace-nowrap ${STRONG}`} style={{ background: color, color: inkOn(color) }}>
              {text}
            </span>
          ))}
        </span>,
      )
  }
}

type Drag = { what: 'row' | 'group'; id: string; use: RoleUse; x: number; y: number; moved: boolean }
/** 끄는 중에 놓일 자리. before 앞에 놓인다(맨 끝이면 null). */
type Drop = { what: 'row' | 'group'; id: string; use: RoleUse; before: string | null }

// 끄는 중에 놓일 자리를 알려 주는 선. 확대 비율과 관계없이 화면에서 같은 굵기로 보인다.
const DROP_LINE = 'pointer-events-none absolute z-10 bg-selection'

/**
 * 의미 색 판의 내용. 역할(글자, 바탕, 테두리, 채움, 상태, 차트)별로 묶어 보여 준다.
 * 묶음의 순서와 묶음 안의 순서는 파일에 적힌 순서이고, 끌어서 바꾸면 파일의 순서가 바뀐다.
 * folded면 설명과 예시를 숨기고 색과 이름만 한 줄에 세 개씩 놓는다.
 */
export function RoleList({
  kind,
  items,
  all,
  selected,
  folded,
  onSelect,
  onSelectGroup,
  onRename,
  onMove,
  onMoveGroup,
}: {
  kind: Kind
  items: Token[]
  /** 가리키는 색을 찾을 전체 값 목록. */
  all: Token[]
  selected: string[]
  folded: boolean
  onSelect: (name: string, additive: boolean) => void
  /** 묶음 제목을 누르면 그 묶음의 색을 모두 선택한다. */
  onSelectGroup: (names: string[], additive: boolean, rename: boolean) => void
  onRename: (name: string) => void
  /** 색을 같은 묶음 안의 다른 자리로 옮긴다. before는 그 앞에 놓일 색(묶음의 맨 끝이면 null). */
  onMove: (name: string, before: string | null) => void
  onMoveGroup: (use: RoleUse, before: RoleUse | null) => void
}) {
  const around = surroundings(all)
  const groups = roleGroups(items)
  const drag = useRef<Drag | null>(null)
  // 끌기가 끝난 직후에 따라오는 클릭은 선택으로 치지 않는다.
  const dragged = useRef(false)
  const [drop, setDrop] = useState<Drop | null>(null)

  const boxOf = (selector: string) => document.querySelector(selector)?.getBoundingClientRect()

  /** 마우스 자리에서 놓으면 어느 것의 앞에 들어가는지. */
  function slotAt(d: Drag, x: number, y: number): string | null {
    if (d.what === 'group') {
      // 묶음의 세로 한가운데보다 위면 그 묶음 앞이다.
      for (const g of groups) {
        const box = boxOf(`[data-role-group="${g.use}"]`)
        if (box && y < box.top + box.height / 2) return g.use
      }
      return null
    }
    for (const t of groups.find((g) => g.use === d.use)?.items ?? []) {
      const box = boxOf(`[data-token="${CSS.escape(t.name)}"]`)
      if (!box) continue
      // 펼친 판은 한 줄에 하나라 위아래만 본다. 접은 판은 여러 칸이라 읽는 순서(왼쪽에서 오른쪽, 위에서 아래)로 본다.
      const first = folded ? y < box.top || (y <= box.bottom && x < box.left + box.width / 2) : y < box.top + box.height / 2
      if (first) return t.name
    }
    return null
  }

  /** 잡고 끄는 것(묶음 제목이나 색 한 줄)에 붙이는 동작. 조금이라도 끌어야 옮기기로 치고, 그냥 누르면 선택이다. */
  const grab = (what: Drag['what'], id: string, use: RoleUse) => ({
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
      setDrop({ what: d.what, id: d.id, use: d.use, before: slotAt(d, e.clientX, e.clientY) })
    },
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
      const d = drag.current
      drag.current = null
      setDrop(null)
      if (!d?.moved) return
      dragged.current = true
      window.setTimeout(() => (dragged.current = false))
      const before = slotAt(d, e.clientX, e.clientY)
      if (d.what === 'group') onMoveGroup(d.use, before as RoleUse | null)
      else onMove(d.id, before)
    },
    onPointerCancel: () => {
      drag.current = null
      setDrop(null)
    },
  })

  return (
    <div className="space-y-6">
      {groups.map(({ use, items: list }, gi) => {
        const groupDrop = drop?.what === 'group' && drop.id !== use ? drop : null
        const rowDrop = drop?.what === 'row' && drop.use === use ? drop : null
        return (
          <div key={use} data-role-group={use} className={`relative ${drop?.what === 'group' && drop.id === use ? 'opacity-40' : ''}`}>
            {groupDrop?.before === use && <span className={`${DROP_LINE} inset-x-0 -top-3 h-[calc(var(--line)*2)] -translate-y-1/2`} />}
            {groupDrop?.before === null && gi === groups.length - 1 && (
              <span className={`${DROP_LINE} inset-x-0 -bottom-3 h-[calc(var(--line)*2)] translate-y-1/2`} />
            )}
            {/* 묶음 제목을 누르면 그 묶음의 색이 모두 선택되고, 잡고 위아래로 끌면 묶음이 통째로 옮겨진다. */}
            <div className="mb-2 -ml-1 flex">
              <button
                type="button"
                data-role-title={use}
                onClick={(e) => !dragged.current && onSelectGroup(list.map((t) => t.name), isAdditive(e), false)}
                {...grab('group', use, use)}
                className="rounded-sm px-1 type-heading outline-selection hover:bg-hover focus-visible:outline-2"
              >
                {ROLE_USES.find((u) => u.id === use)!.label}
              </button>
            </div>
            <div className={folded ? 'grid grid-cols-3 gap-1 rounded-lg border border-hairline bg-canvas p-1' : 'space-y-1 rounded-lg border border-hairline bg-canvas p-1'}>
              {list.map((t, i) => {
                const short = shortName(kind, t.name)
                const { text, shape, words, more } = readNote(t.note, short)
                const isSelected = selected.includes(t.name)
                const color = resolveColor(all, t.value)
                const ref = refName(t.value)
                const moving = rowDrop?.id === t.name
                // 놓일 자리의 선. 펼친 판은 줄 위(맨 끝이면 마지막 줄 아래)에 가로로, 접은 판은 칸 왼쪽(맨 끝이면 마지막 칸 오른쪽)에 세로로 긋는다.
                const lineBefore = rowDrop && !moving && rowDrop.before === t.name
                const lineAfter = rowDrop && !moving && rowDrop.before === null && i === list.length - 1
                return (
                  <button
                    key={t.name}
                    type="button"
                    data-token={t.name}
                    aria-pressed={isSelected}
                    aria-label={`${short} ${ref}`}
                    onClick={(e) => !dragged.current && onSelect(t.name, isAdditive(e))}
                    onDoubleClick={() => onRename(t.name)}
                    {...grab('row', t.name, use)}
                    className={`relative w-full items-center rounded-md px-3 py-2 text-left select-none ${
                      folded ? 'flex gap-3' : 'grid grid-cols-[40px_176px_minmax(0,1fr)_280px] gap-4'
                    } ${moving ? 'opacity-40' : ''} ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
                  >
                    {lineBefore && (
                      <span className={`${DROP_LINE} ${folded ? 'inset-y-0 -left-0.5 w-[calc(var(--line)*2)] -translate-x-1/2' : 'inset-x-0 top-0 h-[calc(var(--line)*2)] -translate-y-1/2'}`} />
                    )}
                    {lineAfter && (
                      <span className={`${DROP_LINE} ${folded ? 'inset-y-0 -right-0.5 w-[calc(var(--line)*2)] translate-x-1/2' : 'inset-x-0 bottom-0 h-[calc(var(--line)*2)] translate-y-1/2'}`} />
                    )}
                    <span
                      className={`block shrink-0 rounded-md ${folded ? 'size-8' : 'size-10'} ${EDGE}`}
                      style={{ background: swatchBackground(color ?? 'transparent') }}
                    />
                    <span className="min-w-0">
                      <span data-name className="block truncate type-label">
                        {short}
                      </span>
                      {/* 접으면 색과 이름만 남긴다. 가리키는 색과 # 값은 색을 고르면 뜨는 파란 이름표와 오른쪽 패널에서 볼 수 있다. */}
                      {!folded && (
                        <>
                          <span className="block truncate type-code text-ink-faint">
                            {ref}
                            {color === null && <span className="text-danger"> · 없는 색</span>}
                          </span>
                          {/* 가리키는 색의 실제 값. 색상 판에서 보이는 것과 같은 # 값이다. */}
                          {color && <span className="block truncate type-code text-ink-faint">{color}</span>}
                        </>
                      )}
                    </span>
                    {!folded && <span className="min-w-0 type-body break-keep text-ink-soft">{text}</span>}
                    {/* 쓰임이 여럿인 색은 예시도 여럿이다. 위아래로 8px 띄워 쌓는다. */}
                    {!folded &&
                      (color ? (
                        <span className="block space-y-2">
                          {[{ shape, words }, ...more].map((e, k) => (
                            <RoleSample key={k} shape={e.shape} color={color} around={around} words={e.words} />
                          ))}
                        </span>
                      ) : (
                        <span />
                      ))}
                    {isSelected && selected.length === 1 && <SelectionLabel name={short} value={ref} />}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** 색상 판의 색 가운데 하나를 고르는 곳. 목록별로 한 줄씩 작은 견본을 늘어놓는다. */
function RefPicker({ tokens, value, onChange }: { tokens: Token[]; value: string | null; onChange: (name: string) => void }) {
  const groups = new Map<string, Token[]>()
  for (const t of tokens) {
    if (!COLOR.matches(t.name)) continue
    const g = groupOf(shortName(COLOR, t.name))
    groups.set(g, [...(groups.get(g) ?? []), t])
  }
  // 예외 색은 색상 판에서처럼 맨 아래에 둔다.
  const solo = groups.get('')
  groups.delete('')
  if (solo) groups.set('', solo)
  if (groups.size === 0) return <p className="type-body text-ink-faint">색상 판에 색이 아직 없어요.</p>
  return (
    <div className="max-h-56 space-y-2 overflow-y-auto">
      {[...groups].map(([group, list]) => (
        <div key={group}>
          <p className="mb-1 type-body text-ink-faint">{group || '예외 색'}</p>
          {/* 한 줄에 11칸. 50부터 950까지 한 목록이 한 줄에 들어간다. */}
          <div className="grid grid-cols-11 gap-1">
            {list.map((t) => {
              const short = shortName(COLOR, t.name)
              const picked = t.name === value
              return (
                <button
                  key={t.name}
                  type="button"
                  title={`${short} · ${showColor(t.value)}`}
                  aria-label={short}
                  aria-pressed={picked}
                  onClick={() => onChange(t.name)}
                  // 고른 색과 마우스를 올린 색은 안쪽에 선을 둘러 표시한다. 선이 칸 밖으로 나가지 않아 옆 칸과 닿지 않는다.
                  className={`aspect-square rounded-sm outline-selection focus-visible:outline-2 ${
                    picked
                      ? 'shadow-[inset_0_0_0_2px_var(--color-selection),inset_0_0_0_3px_#fff]'
                      : `${EDGE} hover:shadow-[inset_0_0_0_2px_var(--color-ink),inset_0_0_0_3px_#fff]`
                  }`}
                  style={{ background: swatchBackground(t.value, 4) }}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/** 의미 색을 만드는 양식. 이름, 가리키는 색, 역할, 설명을 정한다. */
export function NewRoleForm({
  tokens,
  onCreate,
  onCancel,
}: {
  tokens: Token[]
  onCreate: (name: string, ref: string, note: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [ref, setRef] = useState<string | null>(null)
  // 역할을 직접 고르기 전에는 이름에서 짐작한 것을 보여 준다(text-muted라고 적으면 글자).
  const [use, setUse] = useState<RoleUse | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState<{ name?: string; ref?: string }>({})
  const shownUse = use ?? guessUse(name.trim())

  function submit(e: FormEvent) {
    e.preventDefault()
    const next: typeof error = {}
    const n = name.trim()
    if (!n) next.name = '이름을 입력해 주세요.'
    else if (!SLUG.test(n)) next.name = '영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.'
    else if (tokens.some((t) => t.name === ROLE.prefix + n)) next.name = '같은 이름의 색이 이미 있어요.'
    if (!ref) next.ref = '색을 골라 주세요.'
    setError(next)
    if (Object.keys(next).length === 0 && ref) onCreate(ROLE.prefix + n, ref, writeNote(shownUse, text))
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="이름" error={error.name}>
        <input
          autoFocus
          className={inputClass}
          value={name}
          placeholder="primary"
          onChange={(e) => {
            setName(e.target.value)
            setError({ ...error, name: undefined })
          }}
        />
      </Field>
      {/* 견본 버튼들이 label 안에 있으면 한 번 누를 때 첫 버튼이 함께 눌린다. 그래서 Field를 쓰지 않는다. */}
      <div>
        <p className="mb-1 type-label text-ink-faint">
          가리키는 색{ref && <span className="ml-2 type-code text-ink">{refName(ref)}</span>}
        </p>
        <RefPicker
          tokens={tokens}
          value={ref}
          onChange={(next) => {
            setRef(next)
            setError({ ...error, ref: undefined })
          }}
        />
        {error.ref && <span className="mt-1 block type-body text-danger">{error.ref}</span>}
      </div>
      <div>
        <p className="mb-1 type-label text-ink-faint">역할</p>
        <UsePicker label="역할" options={ROLE_USES} value={shownUse} onChange={setUse} />
      </div>
      <Field label="설명">
        <input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
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

/** 의미 색 하나를 선택했을 때의 오른쪽 패널. 선택이 바뀌면 key로 새로 만들어진다. */
export function RoleInspector({
  token,
  tokens,
  file,
  uses,
  onOpenComponent,
  onOpenToken,
  onRename,
  onChange,
  onCopy,
}: {
  token: Token
  tokens: Token[]
  file: string
  /** 이 색을 쓰는 컴포넌트와 그 자리들. */
  uses: { index: number; name: string; where: string[] }[]
  onOpenComponent: (index: number) => void
  /** 이 색이 가리키는 색이 있는 판으로 간다. */
  onOpenToken: (name: string) => void
  onRename: (next: string) => void
  /** 가리키는 색이나 주석(역할과 설명)을 바꾼다. */
  onChange: (patch: { value?: string; note?: string }) => void
  onCopy: (text: string) => void
}) {
  const short = shortName(ROLE, token.name)
  const { use, text, picked, words, more } = readNote(token.note, short)
  const [nameDraft, setNameDraft] = useState(short)
  const [nameError, setNameError] = useState<string | null>(null)
  const [textDraft, setTextDraft] = useState(text)
  const color = resolveColor(tokens, token.value)

  function commitName() {
    const next = nameDraft.trim()
    setNameError(null)
    if (!next) return setNameError('이름을 입력해 주세요.')
    if (!SLUG.test(next)) return setNameError('영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.')
    if (next === short) return
    if (tokens.some((t) => t.name === ROLE.prefix + next)) return setNameError('같은 이름의 색이 이미 있어요.')
    onRename(ROLE.prefix + next)
  }

  function commitText() {
    if (textDraft.trim() !== text) saveNote({})
  }

  /**
   * 역할과 설명을 주석에 적어 저장한다. 같은 주석에 적혀 있는 예시(모양과 문구)는 그대로 둔다.
   * 예시는 패널에서 고치지 않는다. 그 값이 화면 어디에 어떤 말로 쓰였는지는 페이지를 만든 AI가 알고, AI가 파일의 주석에 적는다(파일 맨 위의 안내 참고).
   */
  function saveNote(patch: { use?: RoleUse }) {
    onChange({ note: writeNote(patch.use ?? use, textDraft, picked, words, more) })
  }

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
        {nameError && <span className="mt-1 block type-body text-danger">{nameError}</span>}
      </Section>

      <Section title="가리키는 색">
        <div className="mb-3 flex items-center gap-2">
          <span className={`block size-8 shrink-0 rounded-md ${EDGE}`} style={{ background: swatchBackground(color ?? 'transparent') }} />
          <span className="min-w-0">
            <Chip>{refName(token.value)}</Chip>
          </span>
          <span className="min-w-0 flex-1 truncate type-code text-ink-faint">{color ?? <span className="text-danger">없는 색</span>}</span>
          {/* 가리키는 색이 색상 판의 어디에 있는지 보러 가는 버튼. "쓰이는 곳"의 반대 방향이다. 가리키는 색이 없어졌으면 갈 곳이 없어 꺼진다. */}
          <button
            type="button"
            aria-label="가리키는 색 보러 가기"
            title={`색상 판에서 ${refName(token.value)} 보기`}
            disabled={!refOf(token.value) || !tokens.some((t) => t.name === refOf(token.value))}
            onClick={() => onOpenToken(refOf(token.value)!)}
            className={`${ICON_BUTTON} disabled:pointer-events-none disabled:opacity-30`}
          >
            <ArrowUpRight size={16} strokeWidth={1.5} />
          </button>
        </div>
        <RefPicker tokens={tokens} value={refOf(token.value)} onChange={(name) => onChange({ value: refTo(name) })} />
      </Section>

      <Section title="역할">
        <UsePicker label="역할" options={ROLE_USES} value={use} onChange={(next) => saveNote({ use: next })} />
      </Section>

      <Section title="설명">
        <input
          className={inputClass}
          aria-label="설명"
          value={textDraft}
          onChange={(e) => setTextDraft(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      </Section>

      <FoldSection title="쓰이는 곳" storageKey={WHERE_OPEN} startOpen note={uses.length > 0 ? String(uses.length) : '없음'} empty={uses.length === 0}>
          <div className="space-y-2">
            {uses.map((u) => (
              <div key={u.index}>
                <button
                  type="button"
                  onClick={() => onOpenComponent(u.index)}
                  className="-ml-2 flex h-8 max-w-full items-center rounded-md px-2 type-label outline-selection hover:bg-hover focus-visible:outline-2"
                >
                  <span className="truncate">{u.name}</span>
                  <span className="ml-2 shrink-0 type-body text-ink-faint">{u.where.length}곳</span>
                </button>
                <p className="type-body text-ink-faint">{u.where.join(', ')}</p>
              </div>
            ))}
          </div>
      </FoldSection>

      <FoldSection title="코드" storageKey={CODE_OPEN}>
        <div className="space-y-2">
          <div>
            <p className="mb-1 type-label text-ink-faint">변수 이름</p>
            <span className="flex items-center gap-1">
              <span className="min-w-0 flex-1">
                <Chip>{token.name}</Chip>
              </span>
              <button
                type="button"
                title={`var(${token.name}) 복사`}
                aria-label="코드 복사"
                onClick={() => onCopy(`var(${token.name})`)}
                className={ICON_BUTTON}
              >
                <Copy size={16} strokeWidth={1.5} />
              </button>
            </span>
          </div>
          <div>
            <p className="mb-1 type-label text-ink-faint">저장된 값</p>
            <Chip>{token.value}</Chip>
          </div>
          <div>
            <p className="mb-1 type-label text-ink-faint">저장 위치</p>
            <Chip>{file}</Chip>
          </div>
        </div>
      </FoldSection>
    </div>
  )
}
