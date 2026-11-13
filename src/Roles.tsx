// 의미 색: 색상 판의 색 가운데 실제로 쓰는 색에 쓰임새의 이름을 붙여 모아 둔 판과, 그것을 만들고 고치는 양식.
// 한 줄에 색 하나. 색, 이름과 가리키는 단계, 역할과 설명, 그 역할로 쓰인 예시를 나란히 보여 준다.

import { useContext, useRef, useState, type FormEvent, type PointerEvent, type ReactNode } from 'react'
import { Copy, Plus } from 'lucide-react'
import type { Token } from './lib/api'
import { KINDS, SLUG, groupOf, shortName, type Kind } from './lib/catalog'
import { contrast, showColor } from './lib/color'
import { ROLE_USES, guessUse, readNote, refOf, refTo, resolveColor, roleGroups, surroundings, writeNote, type Around, type RoleUse } from './lib/roles'
import { TRIM, DARK, PreviewFontContext, inkOn, statesOf } from './ColorUses'
import { CODE_OPEN, FoldSection, ICON_BUTTON, Section } from './Inspector'
import { ADD_TILE, HOVER, OUTLINE, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'
import { Button, Chip, Field, inputClass, swatchBackground } from './ui'

const COLOR = KINDS.color
const ROLE = KINDS.role
const EDGE = 'shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)]'

/** 가리키는 색을 짧게 적은 이름. --color-blue-600 → blue-600 */
const refName = (value: string) => (refOf(value) ?? value).replace(/^--color-/, '')

/**
 * 색이 그 역할로 쓰인 모습. 주변(바탕과 글자)은 이 디자인 시스템의 색으로 그려서, 실제 화면에서 만나는 조합 그대로 보여 준다.
 * 글자 색이면 제목과 본문, 바탕 색이면 글이 놓인 면, 테두리 색이면 입력칸과 구분선, 버튼 색이면 기본·올림·비활성 버튼.
 * 이 안은 사용자의 색을 보여 주는 미리보기라, FF 도구의 흑백 규칙을 따르지 않는다.
 */
export function RoleSample({ use, color, around }: { use: RoleUse; color: string; around: Around }) {
  const font = useContext(PreviewFontContext)
  const rgb = color.slice(0, 7)
  const light = (hex: string) => contrast(hex.slice(0, 7), '#ffffff') < 3
  const BOX = 'flex h-16 w-full flex-col justify-center overflow-hidden rounded-md px-3 whitespace-nowrap'
  const frame = (background: string, body: ReactNode) => (
    <span className={`${BOX} ${light(background) ? EDGE : ''}`} style={{ background: swatchBackground(background), fontFamily: font }}>
      {body}
    </span>
  )
  switch (use) {
    case 'text': {
      // 이 시스템의 바탕 위에서 거의 보이지 않는 글자 색은 짙은 면 위에 쓰는 색이다. 그때는 이 시스템의 글자 색(없으면 어두운 회색)을 바탕으로 깐다.
      const hidden = contrast(rgb, around.surface.slice(0, 7)) < 1.6
      const dark = contrast(rgb, around.ink.slice(0, 7)) >= 3 ? around.ink : DARK.surface
      return frame(
        hidden ? dark : around.surface,
        <>
          <span className="truncate text-base leading-6 font-[650]" style={{ color }}>
            제목 가나다 Aa
          </span>
          <span className="truncate text-xs leading-4" style={{ color }}>
            본문 가나다라마바사 Aa 123
          </span>
        </>,
      )
    }
    case 'surface': {
      // 이 시스템의 글자 색이 이 바탕에서 읽히지 않으면 흰색과 검정 중 읽히는 쪽을 쓴다.
      const ink = contrast(around.ink.slice(0, 7), rgb) >= 3 ? around.ink : inkOn(color)
      return frame(
        color,
        <>
          <span className="truncate text-sm leading-5 font-[650]" style={{ color: ink }}>
            제목 가나다 Aa
          </span>
          <span className="truncate text-xs leading-4" style={{ color: ink }}>
            본문 가나다라마바사 Aa 123
          </span>
        </>,
      )
    }
    case 'border':
      return frame(
        around.surface,
        <>
          <span className="flex h-7 items-center rounded-md px-2 text-xs" style={{ border: `1px solid ${color}`, color: around.ink }}>
            <span className={TRIM}>입력칸</span>
          </span>
          <span className="mt-2 block h-px w-full" style={{ background: color }} />
        </>,
      )
    default: {
      const { hover } = statesOf(color)
      const button = (label: string, background: string, opacity?: number) => (
        <span
          className="flex h-7 items-center rounded-md px-2.5 text-sm leading-none font-[550]"
          style={{ background, color: inkOn(color), opacity }}
        >
          <span className={TRIM}>{label}</span>
        </span>
      )
      return frame(
        around.surface,
        <span className="flex gap-1.5">
          {button('기본', color)}
          {button('올림', hover)}
          {button('비활성', color, 0.4)}
        </span>,
      )
    }
  }
}

type Drag = { what: 'row' | 'group'; id: string; use: RoleUse; x: number; y: number; moved: boolean }
/** 끄는 중에 놓일 자리. before 앞에 놓인다(맨 끝이면 null). */
type Drop = { what: 'row' | 'group'; id: string; use: RoleUse; before: string | null }

// 끄는 중에 놓일 자리를 알려 주는 선. 확대 비율과 관계없이 화면에서 같은 굵기로 보인다.
const DROP_LINE = 'pointer-events-none absolute z-10 bg-selection'

/**
 * 의미 색 판의 내용. 역할(글자, 바탕, 테두리, 버튼)별로 묶어 보여 준다.
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
  onAdd,
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
  onAdd: (kind: Kind) => void
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
                className="rounded-sm px-1 font-[650] outline-selection hover:bg-hover focus-visible:outline-2"
              >
                {ROLE_USES.find((u) => u.id === use)!.label}
              </button>
            </div>
            <div className={folded ? 'grid grid-cols-3 gap-1 rounded-lg border border-hairline bg-canvas p-1' : 'space-y-0.5 rounded-lg border border-hairline bg-canvas p-1'}>
              {list.map((t, i) => {
                const short = shortName(kind, t.name)
                const { text } = readNote(t.note, short)
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
                      <span data-name className="block truncate text-sm font-[550]">
                        {short}
                      </span>
                      {/* 접으면 색과 이름만 남긴다. 가리키는 색과 # 값은 색을 고르면 뜨는 파란 이름표와 오른쪽 패널에서 볼 수 있다. */}
                      {!folded && (
                        <>
                          <span className="block truncate font-mono text-sm text-ink-faint">
                            {ref}
                            {color === null && <span className="text-danger"> · 없는 색</span>}
                          </span>
                          {/* 가리키는 색의 실제 값. 색상 판에서 보이는 것과 같은 # 값이다. */}
                          {color && <span className="block truncate font-mono text-sm text-ink-faint">{color}</span>}
                        </>
                      )}
                    </span>
                    {!folded && <span className="min-w-0 text-sm break-keep text-ink-soft">{text}</span>}
                    {!folded && (color ? <RoleSample use={use} color={color} around={around} /> : <span />)}
                    {isSelected && selected.length === 1 && <SelectionLabel name={short} value={ref} />}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      <button type="button" aria-label={kind.addLabel} onClick={() => onAdd(kind)} className={`${ADD_TILE} h-10 w-full`}>
        <Plus size={16} strokeWidth={1.5} />
      </button>
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
  if (groups.size === 0) return <p className="text-sm text-ink-faint">색상 판에 색이 아직 없어요.</p>
  return (
    <div className="max-h-56 space-y-2 overflow-y-auto">
      {[...groups].map(([group, list]) => (
        <div key={group}>
          <p className="mb-1 text-sm text-ink-faint">{group || '예외 색'}</p>
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

/** 네 역할 중 하나를 고르는 전환 버튼. */
function UsePicker({ value, onChange }: { value: RoleUse; onChange: (use: RoleUse) => void }) {
  return (
    <div className="grid grid-cols-4 gap-0.5 rounded-md bg-hover p-0.5">
      {ROLE_USES.map((u) => (
        <button
          key={u.id}
          type="button"
          aria-pressed={u.id === value}
          onClick={() => onChange(u.id)}
          className={`h-7 rounded-sm text-sm outline-selection focus-visible:outline-2 ${
            u.id === value ? 'bg-canvas font-[550] text-ink shadow-[0_0_0_1px_var(--color-hairline)]' : 'text-ink-soft hover:text-ink'
          }`}
        >
          {u.label}
        </button>
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
        <p className="mb-1 text-sm font-[550] text-ink-faint">
          가리키는 색{ref && <span className="ml-1.5 font-mono font-normal text-ink">{refName(ref)}</span>}
        </p>
        <RefPicker
          tokens={tokens}
          value={ref}
          onChange={(next) => {
            setRef(next)
            setError({ ...error, ref: undefined })
          }}
        />
        {error.ref && <span className="mt-1 block text-sm text-danger">{error.ref}</span>}
      </div>
      <div>
        <p className="mb-1 text-sm font-[550] text-ink-faint">역할</p>
        <UsePicker value={shownUse} onChange={setUse} />
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
  onRename: (next: string) => void
  /** 가리키는 색이나 주석(역할과 설명)을 바꾼다. */
  onChange: (patch: { value?: string; note?: string }) => void
  onCopy: (text: string) => void
}) {
  const short = shortName(ROLE, token.name)
  const { use, text } = readNote(token.note, short)
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
    if (textDraft.trim() !== text) onChange({ note: writeNote(use, textDraft) })
  }

  return (
    <div>
      <Section>
        <h2 className="font-[650] break-all">{short}</h2>
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
        {nameError && <span className="mt-1 block text-sm text-danger">{nameError}</span>}
      </Section>

      <Section title="가리키는 색">
        <div className="mb-3 flex items-center gap-2">
          <span className={`block size-8 shrink-0 rounded-md ${EDGE}`} style={{ background: swatchBackground(color ?? 'transparent') }} />
          <span className="min-w-0">
            <Chip>{refName(token.value)}</Chip>
          </span>
          <span className="shrink-0 font-mono text-sm text-ink-faint">{color ?? <span className="text-danger">없는 색</span>}</span>
        </div>
        <RefPicker tokens={tokens} value={refOf(token.value)} onChange={(name) => onChange({ value: refTo(name) })} />
      </Section>

      <Section title="역할">
        <UsePicker value={use} onChange={(next) => onChange({ note: writeNote(next, textDraft) })} />
        {color && (
          <div className="mt-2">
            <RoleSample use={use} color={color} around={surroundings(tokens)} />
          </div>
        )}
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

      <FoldSection title="코드" storageKey={CODE_OPEN}>
        <div className="space-y-2">
          <div>
            <p className="mb-1 text-sm font-[550] text-ink-faint">변수 이름</p>
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
            <p className="mb-1 text-sm font-[550] text-ink-faint">저장된 값</p>
            <Chip>{token.value}</Chip>
          </div>
          <div>
            <p className="mb-1 text-sm font-[550] text-ink-faint">저장 위치</p>
            <Chip>{file}</Chip>
          </div>
        </div>
      </FoldSection>

      {uses.length > 0 && (
        <Section title="쓰이는 곳">
          <div className="space-y-2">
            {uses.map((u) => (
              <div key={u.index}>
                <button
                  type="button"
                  onClick={() => onOpenComponent(u.index)}
                  className="-ml-2 flex h-8 max-w-full items-center rounded-md px-2 font-[550] outline-selection hover:bg-hover focus-visible:outline-2"
                >
                  <span className="truncate">{u.name}</span>
                  <span className="ml-1.5 shrink-0 text-sm font-normal text-ink-faint">{u.where.length}곳</span>
                </button>
                <p className="text-sm text-ink-faint">{u.where.join(', ')}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
