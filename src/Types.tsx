// 의미 글꼴: 글꼴 판의 재료 가운데 실제로 쓰는 조합(글꼴 종류 · 글자 크기 · 굵기)에 쓰임새의 이름을 붙여 모아 둔 판과, 그것을 만들고 고치는 양식.
// 한 줄에 조합 하나. 이름과 가리키는 값, 설명, 그 조합으로 적은 견본을 나란히 보여 준다.

import { SAMPLE_BAR, SAMPLE_W, paints, sampleColors } from './lib/sample'
import { ICON_STROKE } from './lib/icons'
import { useContext, useState, type CSSProperties, type FormEvent } from 'react'
import { PreviewSpaceContext } from './ColorUses'
import { ArrowUpRight, X } from 'lucide-react'
import type { Token } from './lib/api'
import { KINDS, SLUG, slugMessage, lineName, shortName, trackName, type Kind } from './lib/catalog'
import { shownFont } from './lib/fonts'
import type { Around } from './lib/roles'
import { SHAPE_WORDS, TYPE_USES, guessTypeUse, isListShape, lookOf, missingForTypes, nextType, readType, readTypeNote, trackOverride, typeGroups, writeType, writeTypeNote, type TypeLook, type TypeParts, type TypeShape, type TypeUse } from './lib/types'
import { CODE_OPEN, CodeRows, FoldSection, ICON_BUTTON, Section, WHERE_OPEN } from './Inspector'
import { DetailsFolded, HOVER, OUTLINE, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'
import { Button, Field, Phrases, UsePicker, inputClass , linkRowClass } from './ui'
import { nameRules, useField } from './useField'
import { useReorder } from './useReorder'
import { WithExample } from './WithExample'

const STYLE = KINDS.style
const FONT = KINDS.font
const SIZE = KINDS.size
const WEIGHT = KINDS.weight
// 예시의 바탕이 판의 바탕과 같은 색이어도 가장자리가 보이게 하는 옅은 선.
const EDGE = 'shadow-[inset_0_0_0_var(--border-width-edge)_rgb(0_0_0/0.1)]'


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
      <span className="flex h-control items-center gap-actions-tight type-body">
        <span data-follows={label} className={`min-w-0 flex-1 truncate ${own ? 'type-label text-ink' : 'text-ink-soft'}`}>
          {own ?? (bound || '정해지지 않음')}
        </span>
        {own && (
          <button type="button" aria-label={`직접 정한 ${label} 삭제`} title={`이 조합에만 직접 정해 둔 값이에요. 지우면 글자 크기의 값(${bound || '정해지지 않음'})을 따라요`} onClick={onClear} className={ICON_BUTTON}>
            <X size={16} strokeWidth={ICON_STROKE} />
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
  const { line: faint, hover: soft, primary, onPrimary } = paints(around)
  /** 곁에 놓이는 글의 자리. 높이 8px의 막대이고 폭은 자리마다 다르다. */
  const bar = (width: string, more = '') => <span className={`block ${SAMPLE_BAR} rounded-small ${width} ${more}`} style={{ background: paints(around).filler }} />
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
            {bar('w-[128px]')}
            {words(all, 'mt-blocks break-words')}
          </>
        )
      case 'button':
        return (
          <span className="flex flex-wrap items-center gap-actions">
            {/* 마지막 버튼을 채우고 나머지는 테두리만 둔다(취소, 추가처럼 끝의 것이 주된 동작이다. 다른 판의 예시와 같다). */}
            {list.map((text, i) => words(text, 'rounded-control px-button-x py-box whitespace-nowrap', i === list.length - 1 ? { background: primary, color: onPrimary } : { boxShadow: `inset 0 0 0 1px ${faint}` }))}
          </span>
        )
      case 'field':
        return (
          <>
            {words(all, 'break-words')}
            <span className={`mt-label flex h-control ${SAMPLE_W} items-center rounded-control px-input-x`} style={{ boxShadow: `inset 0 0 0 1px ${faint}` }}>
              {bar('w-[64px]')}
            </span>
          </>
        )
      case 'menu':
        return (
          <span className={`block ${SAMPLE_W} space-y-rows`}>
            {list.map((text) => words(text, 'rounded-row px-row-x py-menu whitespace-nowrap'))}
          </span>
        )
      case 'menu-on':
        // 고른 줄만 글자다. 고르지 않은 줄은 다른 조합(보통 굵기)으로 적히는 자리라 막대로 둔다.
        return (
          <span className={`block ${SAMPLE_W} space-y-rows`}>
            <span className="flex h-row items-center px-row-x">{bar('w-[48px]')}</span>
            {words(all, 'rounded-row px-row-x py-menu whitespace-nowrap', { background: soft })}
            <span className="flex h-row items-center px-row-x">{bar('w-[64px]')}</span>
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
            {list.map((text, i) => words(text, 'rounded-pill px-row-x py-menu whitespace-nowrap', i === 0 ? { background: soft } : { background: around.ink, color: around.surface }))}
          </span>
        )
      case 'number':
        return (
          <span className="flex flex-wrap gap-x-groups gap-y-blocks">
            {list.map((value) => (
              <span key={value}>
                {bar('w-[48px]')}
                {words(value, 'mt-blocks break-words')}
              </span>
            ))}
          </span>
        )
      case 'code':
        return (
          <>
            {bar('w-[48px]')}
            <span className="mt-blocks flex">{words(all, 'rounded-small px-chip-x break-all', { background: soft })}</span>
          </>
        )
      default:
        return words(all, 'break-words')
    }
  }
  return (
    <span className={`block w-full overflow-hidden rounded-card p-sample ${EDGE}`} style={{ ...space, background: around.surface, color: around.ink }}>
      {scene()}
    </span>
  )
}

/**
 * 의미 글꼴 판의 내용. 묶음(제목, 본문, 보조, 컨트롤, 숫자·코드)별로 묶어 보여 준다. 의미 색 판과 같은 짜임이다.
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
  const around = sampleColors(all)
  const groups = typeGroups(items)
  // 줄은 같은 묶음 안에서만 옮겨진다.
  const useOf = new Map(groups.flatMap((g) => g.items.map((t) => [t.name, g.use] as const)))
  const rows = useReorder(groups.flatMap((g) => g.items.map((t) => t.name)), onMove, { scopeOf: (name) => useOf.get(name) ?? '' })
  const groupDrag = useReorder(groups.map((g) => g.use), (use, before) => onMoveGroup(use as TypeUse, before as TypeUse | null), { attr: 'data-type-group', gap: 24 })
  if (items.length === 0) return null
  // 가리키는 값이 없어진 조합의 수는 판 위에서 알린다. 모든 의미 판이 같은 알림을 쓴다(TokenScreen의 MissingNotice).

  return (
    <div>
      <div className="space-y-groups">
        {groups.map(({ use, items: list }) => {
          return (
            <div key={use} data-type-group={use} className={`relative ${groupDrag.moving(use) ? 'opacity-dragging' : ''}`}>
              {groupDrag.line(use)}
              {/* 묶음 제목을 누르면 그 묶음의 조합이 모두 선택되고, 잡고 위아래로 끌면 묶음이 통째로 옮겨진다. */}
              <div className="mb-heading -ml-chip-x flex">
                <button
                  type="button"
                  data-type-title={use}
                  onClick={(e) => !groupDrag.justDragged() && onSelectGroup(list.map((t) => t.name), isAdditive(e), false)}
                  {...groupDrag.grab(use)}
                  className="cursor-grab active:cursor-grabbing rounded-small px-chip-x type-heading outline-selection hover:bg-hover focus-visible:outline-focus"
                >
                  {TYPE_USES.find((u) => u.id === use)!.label}
                </button>
              </div>
              <div className="space-y-rows rounded-float border-edge border-hairline bg-canvas p-menu">
                {list.map((t) => {
                  const short = shortName(STYLE, t.name)
                  const { text, shape, words, more } = readTypeNote(t.note, short)
                  const look = lookOf(all, t.value, t.name)
                  const isSelected = selected.includes(t.name)
                  return (
                    <button
                      key={t.name}
                      type="button"
                      data-token={t.name}
                      aria-pressed={isSelected}
                      aria-label={short}
                      onClick={(e) => !rows.justDragged() && onSelect(t.name, isAdditive(e))}
                      onDoubleClick={() => onRename(t.name)}
                      {...rows.grab(t.name)}
                      className={`group relative flex w-full items-center gap-columns rounded-row px-board-row-x py-board-row-y text-left select-none ${rows.moving(t.name) ? 'opacity-dragging' : ''} ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
                    >
                      {rows.line(t.name)}
                      <span className={plain || !look || look.broken ? 'min-w-0 flex-1' : 'w-row-name shrink-0'}>
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
                      <span className={`min-w-0 flex-1 space-y-blocks ${plain || !look || look.broken ? 'hidden' : ''}`}>
                        {!plain && look && !look.broken && [{ shape, words }, ...more].map((e, k) => <TypeSample key={k} shape={e.shape} look={look} around={around} words={e.words} />)}
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
    <Field label={label} plain error={missing ? '고른 값이 없어졌어요. 다시 골라 주세요.' : null}>
      {/* 고르는 칸 옆에, 고른 값이 글꼴 판의 어디에 있는지 보러 가는 버튼. "쓰이는 곳"의 반대 방향이다. 고른 값이 없어졌으면 갈 곳이 없어 꺼진다. */}
      <span className="flex items-center gap-actions-tight">
        {/* 추가 창과 같은 고르는 칸이다. 브라우저의 select는 이름과 값을 한 모양으로만 적는다. 고른 값이 없어졌으면 칸에 "이름 · 없어짐"이 빨갛게 적히고 아래에 까닭이 적힌다. */}
        <span className="min-w-0 flex-1">
          <UsePicker label={label} nameWidth="w-cell" options={options.map((t) => ({ id: t.name, label: shortName(kind, t.name), hint: show(t) }))} value={missing ? null : value} lost={missing ? shortName(kind, value) : undefined} onChange={onChange} />
        </span>
        <button type="button" aria-label={`${label} 보러 가기`} title={`글꼴 판에서 ${shortName(kind, value)} 보기`} disabled={missing} onClick={() => onOpen(value)} className={`${ICON_BUTTON} disabled:pointer-events-none disabled:opacity-disabled`}>
          <ArrowUpRight size={16} strokeWidth={ICON_STROKE} />
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
  // 이름 칸. 쓸 수 없는 글자는 적는 중에 알리고 벗어나면 되돌린다. 모양이 틀린 이름과 이 판의 규칙은 벗어날 때 알리고 칸에 남긴다(useField).
  const nameField = useField(nameRules({ saved: short, done: (next) => (/^\d/.test(next) ? '숫자로 시작할 수 없어요.' : names.has(STYLE.prefix + next) ? '같은 이름이 이미 있어요.' : null), save: (next) => onRename(STYLE.prefix + next) }))
  const { use, text, picked, words, more } = readTypeNote(token.note, short)
  const [noteDraft, setNoteDraft] = useState(text)
  const look = lookOf(tokens, token.value, token.name)
  const names = new Set(tokens.map((t) => t.name))
  const get = (name: string) => tokens.find((t) => t.name === name)?.value ?? ''
  // 크기 칸에 적는 글자. 크기와 그 크기에 묶인 줄 높이를 CSS에서 쓰는 꼴로 붙여 적는다(14px/20px).
  // 글자 사이는 적지 않는다. 크기에 이미 정해져 있는 값이라 여기서 볼 까닭이 없고(글꼴 판에 있다), 닫힌 칸에 들어갈 자리도 없다.
  const sizeHint = (size: Token) => {
    const line = get(lineName(size.name))
    return `${size.value}${line ? `/${line}` : ''}`
  }
  // 이 조합에 직접 적혀 있는 줄 높이와 글자 사이(예전에 적었거나 파일에서 손으로 고친 것).
  const ownLine = look?.parts.line
  const ownTrack = trackOverride(tokens, token.name) ?? undefined

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
          value={nameField.draft}
          aria-label="이름"
          data-rename="token"
          onChange={(e) => nameField.type(e.target.value)}
          onBlur={nameField.leave}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        {nameField.error && <span className="mt-label block type-body text-danger">{nameField.error}</span>}
      </Section>

      <Section title="조합">
        {look ? (
          <div className="space-y-blocks">
            <PartField label="글꼴 종류" kind={FONT} tokens={tokens} value={look.parts.font} show={(t) => shownFont(t.value)} onChange={(font) => set({ font })} onOpen={onOpenToken} />
            {/* 줄 높이와 글자 사이는 고르지 않는다. 고른 글자 크기에 묶인 값을 그대로 따른다. 크기에 딸려 오는 값이라 따로 줄을 두지 않고 크기 칸 안에 함께 적는다(14px/20px).
                고르는 목록에서도 크기마다 함께 보여서 고르기 전에 견줄 수 있다. 의미 색이 색상 판의 색만 가리키듯, 의미 글꼴도 글꼴 판에 있는 값만 쓴다. 다른 줄 높이가 필요하면 글꼴 판에 크기 단계를 하나 더 만들어 고른다. */}
            <PartField label="글자 크기" kind={SIZE} tokens={tokens} value={look.parts.size} show={sizeHint} onChange={(size) => set({ size })} onOpen={onOpenToken} />
            {/* 예전에 직접 적어 둔 값이 있는 조합만은 그 값으로 그려지므로, 그 값을 진하게 적고 지우는 버튼을 둔다(말없이 사라지지 않게). 그런 값이 없으면 이 줄은 없다. */}
            {(ownLine || ownTrack) && (
              <div className="grid grid-cols-2 gap-field-row">
                {ownLine && <Follows label="줄 높이" bound={get(lineName(look.parts.size))} own={ownLine} onClear={() => set({ line: undefined })} />}
                {ownTrack && <Follows label="글자 사이" bound={get(trackName(look.parts.size)) || '0em'} own={ownTrack} onClear={() => onTrack(null)} />}
              </div>
            )}
            <PartField label="굵기" kind={WEIGHT} tokens={tokens} value={look.parts.weight} show={(t) => t.value} onChange={(weight) => set({ weight })} onOpen={onOpenToken} />
          </div>
        ) : (
          <p className="type-body text-danger">읽을 수 없는 값이에요. 파일에서 값을 고쳐 주세요.</p>
        )}
      </Section>

      {/* 묶음은 판에서 이 조합이 놓이는 자리와 예시의 장면을 정한다. 의미 색 패널의 "역할"과 같은 자리다. */}
      <Section title="묶음">
        <UsePicker label="묶음" options={TYPE_USES} value={use} nameWidth="w-picker-name-wide" onChange={(next) => saveNote({ use: next })} />
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
                  className={linkRowClass}
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
 * 의미 글꼴을 만드는 양식. 이름, 조합(글꼴 종류 · 글자 크기 · 굵기), 묶음, 설명을 정한다. 설명은 비워 두어도 되고 만든 뒤에 패널에서도 고친다.
 * 짝지을 재료가 모자라면 양식 대신 무엇부터 만들지 알린다(한 벌 만들기 창의 안내와 같은 글이다).
 * 처음에는 기본 한 벌 가운데 아직 없는 다음 것의 이름과 조합이 채워져 있어서, 그대로 "추가"를 누르면 전처럼 다음 조합이 생긴다.
 * 다른 의미 판(의미 색, 의미 간격)의 추가도 창에서 이름과 가리키는 값을 정한다.
 * 고른 조합으로 판의 줄과 같은 예시를 창 오른쪽의 영역에 보여 준다(WithExample). 예시의 모양은 판이 짐작하는 그대로다(묶음과 이름에서 짐작한다). 여기서 따로 고르지 않는다.
 */
export function NewTypeForm({ tokens, onCreate, onCancel }: { tokens: Token[]; onCreate: (name: string, value: string, note: string) => void; onCancel: () => void }) {
  const made = nextType(tokens)
  const start = made ? readType(made.value) : null
  const options = (kind: Kind) => tokens.filter((t) => kind.matches(t.name)).map((t) => ({ id: t.name, label: shortName(kind, t.name), hint: kind.id === 'font' ? shownFont(t.value) : t.value }))
  const fonts = options(FONT)
  const sizes = options(SIZE)
  const weights = options(WEIGHT)
  const pick = (list: { id: string }[], want?: string) => (list.some((o) => o.id === want) ? want! : (list[0]?.id ?? ''))
  // 이름 칸은 비워 두고, 아직 없는 다음 단계의 이름을 옅은 글자로 추천한다(다른 추가 창과 같다).
  const [name, setName] = useState('')
  const [font, setFont] = useState(pick(fonts, start?.font))
  const [size, setSize] = useState(pick(sizes, start?.size))
  const [weight, setWeight] = useState(pick(weights, start?.weight))
  // 묶음은 직접 고르기 전까지 이름에서 짐작한 것을 보여 준다.
  const [use, setUse] = useState<TypeUse | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState<string>()
  const shownUse = use ?? guessTypeUse(name.trim())

  function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const problem = !n ? '이름을 입력해 주세요.' : !SLUG.test(n) ? slugMessage(n) : /^\d/.test(n) ? '숫자로 시작할 수 없어요.' : tokens.some((t) => t.name === STYLE.prefix + n) ? '같은 이름이 이미 있어요.' : undefined
    setError(problem)
    if (problem) return
    onCreate(STYLE.prefix + n, writeType({ font, size, weight }, new Set(tokens.map((t) => t.name))), writeTypeNote(shownUse, text))
  }

  // 짝지을 재료(글꼴 종류, 글자 크기, 굵기)가 모자라면 만들 수 없다. 막다른 곳이라 무엇을 먼저 할지 알려 준다.
  const missing = missingForTypes(tokens)
  if (missing.length > 0)
    return (
      <div>
        <p className="type-body text-ink-soft">
          의미 글꼴은 글꼴 판의 값을 짝지어 만들어요. 글꼴 판에서 <span className="type-label text-ink">{missing.join(', ')}</span>부터 만들어 주세요.
        </p>
        <div className="mt-dialog-actions flex justify-end">
          <Button autoFocus onClick={onCancel}>닫기</Button>
        </div>
      </div>
    )

  // 예시. 판의 줄(TypeList)이 하는 그대로, 만들어질 값과 주석과 이름에서 조합과 모양을 읽는다.
  const look = lookOf(tokens, writeType({ font, size, weight }, new Set(tokens.map((t) => t.name))), STYLE.prefix + name.trim())
  const shape = readTypeNote(writeTypeNote(shownUse, text), name.trim()).shape

  return (
    <form onSubmit={submit}>
      <WithExample example={look && !look.broken ? <TypeSample shape={shape} look={look} around={sampleColors(tokens)} /> : null}>
      <Field label="이름" error={error}>
        <input
          autoFocus
          className={inputClass}
          value={name}
          // 옅은 글자는 그대로 적으면 만들어지는 이름일 때만 보인다. 이미 있는 이름을 본보기로 보이면, 따라 적었을 때 되는 창과 안 되는 창이 생긴다.
          placeholder={made ? shortName(STYLE, made.name) : ''}
          onChange={(e) => {
            setName(e.target.value)
            setError(undefined)
          }}
        />
      </Field>
      <Field label="글꼴 종류" plain>
        <UsePicker label="글꼴 종류" options={fonts} value={font} nameWidth="w-cell" onChange={setFont} />
      </Field>
      <Field label="글자 크기" plain>
        <UsePicker label="글자 크기" options={sizes} value={size} nameWidth="w-cell" onChange={setSize} />
      </Field>
      <Field label="굵기" plain>
        <UsePicker label="굵기" options={weights} value={weight} nameWidth="w-cell" onChange={setWeight} />
      </Field>
      <Field label="묶음" plain>
        <UsePicker label="묶음" options={TYPE_USES} value={shownUse} nameWidth="w-picker-name-wide" onChange={setUse} />
      </Field>
      <Field label="설명">
        <input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      </WithExample>
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
