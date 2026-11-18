// 의미 테두리 판(테두리 선, 외곽선)의 줄 목록과 예시, 패널, 추가 창.
// 효과 판과 같은 짜임이다. 종류마다 한 줄에 값 하나, 왼쪽에 이름·가리키는 굵기·설명, 오른쪽에 그 선이 그어진 모습.
// 토대(테두리 판)의 패널과 추가 창은 크기·간격·모서리와 함께 쓴다(Sizes.tsx의 LengthInspector, NewLengthForm).

import { ICON_STROKE } from './lib/icons'
import { useContext, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { Token } from './lib/api'
import { KINDS, SLUG, lengthLabel, shortName, type Kind } from './lib/catalog'
import { BORDER_WORDS, isBorderListShape, readBorderNote, resolveThickness, thicknessRefOf, writeBorderNote, type BorderKind, type BorderShape } from './lib/borders'
import { resolveColor, surroundings, type Around } from './lib/roles'
import { PreviewFontContext, PreviewSpaceContext } from './ColorUses'
import { CODE_OPEN, CodeRows, FoldSection, ICON_BUTTON, Section, WHERE_OPEN } from './Inspector'
import { DetailsFolded, HOVER, OUTLINE, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'
import { Button, Field, Phrases, UsePicker, inputClass } from './ui'
import { useReorder } from './useReorder'

const THICKNESS = KINDS.thickness

// 예시의 바탕이 판의 바탕과 같은 색이어도 가장자리가 보이게 하는 옅은 선.
const EDGE = 'shadow-[inset_0_0_0_var(--border-width-edge)_rgb(0_0_0/0.1)]'

/**
 * 선이 실제로 그어진 모습. 어떤 요소의 어느 자리인지는 줄마다 정한 예시의 모양(shape)을 따르고, 그 안의 말은 줄마다 적은 문구(그 시스템이 실제로 쓰는 말)다.
 * 테두리 선은 입력칸·버튼·상자의 테두리나 구역 사이의 구분선으로, 외곽선은 초점이 간 버튼이나 가리키는 글자에 두른 선으로 그린다. 굵기는 클래스가 아니라 값 그대로 넣는다.
 * 선의 색은 이 시스템의 글자 색을 바탕에 섞은 것이고(테두리 선), 외곽선은 tint(선택 색)다. 바탕과 글자 색도 이 디자인 시스템의 것이다.
 * 이 안은 사용자의 값을 보여 주는 미리보기라, FF 도구의 글자 규칙(type- 클래스)을 따르지 않는다. 글꼴 종류를 바깥에서 물려받아야 해서 크기와 굵기를 따로 적는다.
 */
export function BorderSample({ shape, value, around, tint, words: written = '' }: { shape: BorderShape; value: string; around: Around; tint: string; words?: string }) {
  const font = useContext(PreviewFontContext)
  const space = useContext(PreviewSpaceContext)
  const all = written || BORDER_WORDS[shape]
  const list = isBorderListShape(shape)
    ? all
        .split(', ')
        .map((w) => w.trim())
        .filter(Boolean)
    : [all]
  const TEXT = 'text-sm leading-5'
  const STRONG = 'text-sm leading-5 font-[550]'
  const line = `color-mix(in oklab, ${around.ink} 32%, ${around.surface})`
  const faint = `color-mix(in oklab, ${around.ink} 16%, ${around.surface})`
  const hover = `color-mix(in oklab, ${around.ink} 8%, ${around.surface})`
  const soft = `color-mix(in oklab, ${around.ink} 56%, ${around.surface})`
  const edge = `${value} solid ${line}`
  const bar = (width: string, more = '') => <span className={`block h-[8px] rounded-small ${width} ${more}`} style={{ background: faint }} />
  // 내용은 상자의 가운데에 놓는다(효과 판과 같다). 예시는 읽는 글이 아니라 요소 하나를 보여 주는 것이다.
  const frame = (body: ReactNode) => (
    <span className={`flex w-full items-center justify-center overflow-hidden rounded-card p-sample ${EDGE}`} style={{ ...space, background: around.surface, color: around.ink, fontFamily: font }}>
      {body}
    </span>
  )
  switch (shape) {
    case 'button':
      return frame(
        <span data-sample className={`flex h-control items-center rounded-control px-button-x whitespace-nowrap ${STRONG}`} style={{ border: edge }}>
          {all}
        </span>,
      )
    case 'box':
      // 목록 상자. 선은 상자의 테두리다.
      return frame(
        <span data-sample className="block w-[160px] space-y-rows rounded-float p-menu" style={{ border: edge }}>
          {list.map((text, i) => (
            <span key={i} className={`block rounded-row px-row-x py-menu whitespace-nowrap ${TEXT}`} style={i === 0 ? { background: hover } : undefined}>
              {text}
            </span>
          ))}
        </span>,
      )
    case 'divider':
      // 위아래로 쌓인 구역(패널의 구역). 구역 사이에만 선이 있다.
      return frame(
        <span className="block w-[160px]">
          {list.map((text, i) => (
            <span key={i} {...(i > 0 ? { 'data-sample': true } : {})} className="block py-section-y" style={i > 0 ? { borderTop: edge } : undefined}>
              <span className={`block ${STRONG}`}>{text}</span>
              {bar('w-3/4', 'mt-blocks')}
            </span>
          ))}
        </span>,
      )
    case 'side':
      // 좌우로 놓인 면(왼쪽 메뉴와 가운데). 첫 문구가 왼쪽 면의 줄, 나머지는 오른쪽 면의 제목이다.
      return frame(
        <span className="flex w-full max-w-[224px] items-stretch">
          <span data-sample className="block w-[96px] shrink-0 py-box pr-box" style={{ borderRight: edge }}>
            <span className={`block rounded-row px-row-x py-menu whitespace-nowrap ${TEXT}`} style={{ background: hover }}>
              {list[0]}
            </span>
            {bar('w-2/3', 'mt-fields ml-row-x')}
          </span>
          <span className="block min-w-0 flex-1 py-box pl-box">
            <span className={`block break-words ${STRONG}`} style={{ color: soft }}>
              {list.slice(1).join(', ')}
            </span>
            {bar('w-full', 'mt-blocks')}
            {bar('w-2/3', 'mt-blocks')}
          </span>
        </span>,
      )
    case 'focus':
      // 자판으로 옮겨 간 버튼. 버튼 밖으로 1px 띄워 선택 색의 선을 두른다(FF의 버튼과 같다).
      return frame(
        <span data-sample className={`flex h-control items-center rounded-control px-button-x whitespace-nowrap ${STRONG}`} style={{ background: around.ink, color: around.surface, outline: `${value} solid ${tint}`, outlineOffset: 1 }}>
          {all}
        </span>,
      )
    case 'mark':
      // 가리키는 글자에 두르는 선. 글자에서 2px 띄운다.
      return frame(
        <span data-sample className={`rounded-small whitespace-nowrap ${STRONG}`} style={{ outline: `${value} solid ${tint}`, outlineOffset: 2 }}>
          {all}
        </span>,
      )
    default:
      // 입력칸
      return frame(
        <span data-sample className={`flex h-control w-[160px] items-center rounded-control px-input-x whitespace-nowrap ${TEXT}`} style={{ border: edge }}>
          {all}
        </span>,
      )
  }
}

/**
 * 판과 패널에 적는 값. 가리키는 굵기를 적는다(1px). 가리키는 값이 없어졌으면 그 이름 뒤에 "없어짐"을 붙인다(다른 의미 판과 같다).
 * 토대를 가리키지 않고 길이를 직접 적은 값(다른 도구로 만든 파일의 --border-width-thin: 1px)은 적힌 그대로다.
 */
function shownOf(tokens: Token[], value: string) {
  const ref = thicknessRefOf(value)
  const length = resolveThickness(tokens, value)
  return { ref, length, shown: length ?? (ref ? `${lengthLabel(THICKNESS, ref)} · 없어짐` : value) }
}

/**
 * 의미 테두리 판에서 한 종류(테두리 선, 외곽선)의 내용. 한 줄에 값 하나. 왼쪽 칸(224px)에 이름, 가리키는 굵기, 설명이 있고 오른쪽에 그 선이 그어진 모습이 있다.
 * 이름과 값, 설명은 자르지 않고 줄을 바꿔 다 보여 준다.
 */
export function BorderList({
  kind,
  items,
  all,
  selected,
  onSelect,
  onRename,
  onMove,
}: {
  kind: Kind
  items: Token[]
  /** 가리키는 굵기와, 예시의 바탕과 글자 색을 찾을 전체 값 목록. */
  all: Token[]
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onRename: (name: string) => void
  /** 끌어서 차례를 바꾼다. 의미 테두리는 쓰임으로 이름 붙인 값이라 차례를 사람이 정한다. */
  onMove?: (name: string, before: string | null) => void
}) {
  // 판을 접었으면 설명과 예시를 숨기고 이름과 값만 보여 준다.
  const plain = useContext(DetailsFolded)
  const reorder = useReorder(items.map((t) => t.name), onMove)
  // 값이 없으면 빈 상자를 남기지 않는다. 추가는 묶음 제목 줄의 버튼으로 한다.
  if (items.length === 0) return null
  const id = kind.id as BorderKind
  const around = surroundings(all)
  // 외곽선을 칠할 색. 이 시스템의 선택 색(없으면 주요 색, 그것도 없으면 글자 색)이다.
  const tinted = all.find((t) => t.name === '--color-selection') ?? all.find((t) => t.name === '--color-primary')
  const tint = (tinted && resolveColor(all, tinted.value)) || around.ink
  return (
    <div className="space-y-rows rounded-float border-edge border-hairline bg-canvas p-menu">
      {items.map((t) => {
        const short = shortName(kind, t.name)
        const { text, shape, words, more } = readBorderNote(id, t.note, short)
        const isSelected = selected.includes(t.name)
        const { length, shown } = shownOf(all, t.value)
        // 예시는 굵기를 알 때만 그린다(가리키는 값이 없어졌으면 그릴 수 없다). 없으면 왼쪽 칸이 줄 전체를 쓴다.
        const drawn = !plain && length !== null
        return (
          <button
            key={t.name}
            type="button"
            data-token={t.name}
            aria-pressed={isSelected}
            aria-label={`${short} ${shown}`}
            onClick={(e) => !reorder.justDragged() && onSelect(t.name, isAdditive(e))}
            onDoubleClick={() => onRename(t.name)}
            {...reorder.grab(t.name)}
            className={`group relative flex w-full items-center gap-columns rounded-row px-board-row-x py-board-row-y text-left select-none ${reorder.moving(t.name) ? 'opacity-40' : ''} ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
          >
            {reorder.line(t.name)}
            <span className={drawn ? 'w-row-name shrink-0' : 'min-w-0 flex-1'}>
              <span data-name className="block type-label break-words">
                {short}
              </span>
              <span data-points className={`block type-code-sm break-words ${length ? 'text-ink-faint' : 'text-danger'}`}>
                {shown}
              </span>
              {!plain && text && (
                <span data-text className="mt-label block type-caption break-words text-ink-faint">
                  <Phrases text={text} />
                </span>
              )}
            </span>
            {/* 쓰임이 여럿인 값은 예시도 여럿이다. 위아래로 8px 띄워 쌓는다. */}
            {drawn && (
              <span className="block min-w-0 flex-1 space-y-blocks">
                {[{ shape, words }, ...more].map((e, k) => (
                  <BorderSample key={k} shape={e.shape} value={length} around={around} tint={tint} words={e.words} />
                ))}
              </span>
            )}
            {isSelected && selected.length === 1 && <SelectionLabel name={short} value={shown} />}
          </button>
        )
      })}
    </div>
  )
}

/** 가리킬 수 있는 굵기들(테두리 판의 값). 고르는 칸의 줄이 된다. 이름이 곧 굵기라서 길이만 적는다. */
const baseOptions = (tokens: Token[]) => tokens.filter((t) => THICKNESS.matches(t.name)).map((t) => ({ id: t.name, label: t.value, hint: '' }))

/** 그 선을 코드에서 쓰는 법. 테두리 선은 border-이름(한쪽만이면 border-t-이름), 외곽선은 outline-이름이다. */
function classesOf(kind: Kind, short: string) {
  return kind.id === 'outline' ? [`outline-${short}`] : [`border-${short}`, `border-t-${short}`]
}

/** 이름을 쓸 수 없으면 까닭을 돌려준다. 색 이름과 겹치면 border-이름과 outline-이름이 굵기가 아니라 색으로 읽힌다. */
function nameProblem(kind: Kind, name: string, tokens: Token[], self?: string) {
  if (!name) return '이름을 입력해 주세요.'
  if (!SLUG.test(name)) return '영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.'
  // 숫자로 시작하는 이름(--border-width-2)은 숫자 클래스(border-2)가 그 값을 따라가게 만든다. 쓰임의 이름을 짓게 한다.
  if (/^\d/.test(name)) return '숫자로 시작할 수 없어요.'
  if (kind.prefix + name === self) return null
  if (tokens.some((t) => t.name === kind.prefix + name)) return '같은 이름이 이미 있어요.'
  if (tokens.some((t) => t.name === `--color-${name}`)) return '같은 이름의 색이 있어서 쓸 수 없어요.'
  return null
}

/**
 * 의미 테두리 하나(테두리 선, 외곽선)를 고치는 패널. 구역의 차례는 다른 패널과 같다: 이름, 값(가리키는 테두리), 설명, 쓰이는 곳, 코드.
 * 의미 테두리는 테두리 판의 값을 가리키기만 한다. 길이를 여기에 직접 적지 않는다.
 * 예시는 여기서 고치지 않는다. 그 선이 화면 어디에 그어졌는지는 페이지를 만든 AI가 파일의 주석에 적는다(파일 맨 위의 안내 참고).
 */
export function BorderInspector({
  token,
  kind,
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
  kind: Kind
  tokens: Token[]
  file: string
  /** 이 값을 쓰는 컴포넌트와 그 자리들. */
  uses: { index: number; name: string; where: string[] }[]
  onOpenComponent: (index: number) => void
  /** 가리키는 굵기가 있는 판(테두리 판)으로 가서 그 값을 보여 준다. */
  onOpenToken: (name: string) => void
  onRename: (next: string) => void
  /** 값(가리키는 테두리)이나 주석(설명과 예시)을 바꾼다. */
  onChange: (patch: { value?: string; note?: string }) => void
  onCopy: (text: string) => void
}) {
  const id = kind.id as BorderKind
  const short = shortName(kind, token.name)
  const { text, picked, words, more } = readBorderNote(id, token.note, short)
  const [nameDraft, setNameDraft] = useState(short)
  const [nameError, setNameError] = useState<string | null>(null)
  const [textDraft, setTextDraft] = useState(text)
  const options = baseOptions(tokens)
  const { ref, length } = shownOf(tokens, token.value)
  const known = ref !== null && options.some((o) => o.id === ref)

  function commitName() {
    const next = nameDraft.trim()
    const problem = nameProblem(kind, next, tokens, token.name)
    setNameError(problem)
    if (problem || next === short) return
    onRename(kind.prefix + next)
  }

  function commitText() {
    // 같은 주석에 적혀 있는 예시(모양과 문구)는 그대로 둔다.
    if (textDraft.trim() !== text) onChange({ note: writeBorderNote(id, textDraft, picked, words, more) })
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
        {nameError && <span className="mt-label block type-body text-danger">{nameError}</span>}
      </Section>

      <Section title="가리키는 테두리">
        {known ? (
          // 고르는 칸 옆에, 가리키는 굵기가 테두리 판의 어디에 있는지 보러 가는 버튼. "쓰이는 곳"의 반대 방향이다.
          <div className="flex items-center gap-actions-tight">
            <div className="min-w-0 flex-1">
              <UsePicker label="가리키는 테두리" options={options} value={ref} nameWidth="w-[64px]" onChange={(next) => onChange({ value: `var(${next})` })} />
            </div>
            <button type="button" aria-label="가리키는 테두리 보러 가기" title={`테두리 판에서 ${lengthLabel(THICKNESS, ref)} 보기`} onClick={() => onOpenToken(ref)} className={ICON_BUTTON}>
              <ArrowUpRight size={16} strokeWidth={ICON_STROKE} />
            </button>
          </div>
        ) : (
          // 가리키던 굵기가 없어졌거나, 테두리 판의 값을 가리키지 않고 길이를 직접 적은 값이다. 테두리 판의 값 가운데서 고르게 한다.
          <div className="space-y-blocks">
            <p className="type-body text-danger">{ref ? '고른 값이 없어졌어요. 다시 골라 주세요.' : '테두리 판의 값을 가리키지 않아요. 골라 주세요.'}</p>
            <div className="flex flex-wrap gap-actions-tight">
              {options.map((o) => (
                <Button key={o.id} variant="ghost" onClick={() => onChange({ value: `var(${o.id})` })}>
                  {o.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="설명">
        <input className={inputClass} aria-label="설명" value={textDraft} onChange={(e) => setTextDraft(e.target.value)} onBlur={commitText} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
      </Section>

      <FoldSection title="쓰이는 곳" storageKey={WHERE_OPEN} startOpen note={uses.length > 0 ? String(uses.length) : '없음'} empty={uses.length === 0}>
        <div className="space-y-blocks">
          {uses.map((u) => (
            <div key={u.index}>
              <button
                type="button"
                onClick={() => onOpenComponent(u.index)}
                className="-ml-button-ghost-x flex h-control max-w-full items-center rounded-control px-button-ghost-x type-label outline-selection hover:bg-hover focus-visible:outline-focus"
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
        <CodeRows uses={[...classesOf(kind, short), `var(${token.name})`]} value={token.value} file={file} onCopy={onCopy} valueNote={ref && length ? length : undefined} />
      </FoldSection>
    </div>
  )
}

/**
 * 의미 테두리(테두리 선, 외곽선)를 만드는 양식. 종류, 이름, 가리키는 테두리, 설명을 정한다. 추가는 판 위에 하나이고 종류는 여기서 고른다(의미 크기의 추가와 같다).
 * 두 종류는 묻는 것이 같아서 추가를 나누지 않는다. 효과는 종류마다 묻는 것이 달라 추가가 종류마다 있다.
 * 가리키는 테두리는 고르지 않은 채로 시작한다. 첫 값을 골라 두면 이름만 적고 만들었을 때 엉뚱한 굵기를 가리키는 값이 생긴다.
 */
/** 의미 테두리의 종류. 추가 창에서 고른다(이름은 진하게, 쓰는 클래스와 그 종류에 드는 것은 옅게). */
const BORDER_KINDS: { id: BorderKind; label: string; hint: string }[] = [
  { id: 'border', label: '테두리 선', hint: 'border-이름. 테두리, 구분선' },
  { id: 'outline', label: '외곽선', hint: 'outline-이름. 초점 표시' },
]

export function NewBorderForm({ start, tokens, onCreate, onCancel }: { start?: Kind; tokens: Token[]; onCreate: (kind: Kind, name: string, value: string, note: string) => void; onCancel: () => void }) {
  // 의미 테두리 하나를 골라 둔 채 열면 그 종류가 골라져 있다.
  const [kindId, setKindId] = useState<BorderKind>(start?.id === 'outline' ? 'outline' : 'border')
  const kind = KINDS[kindId]
  const options = baseOptions(tokens)
  const [name, setName] = useState('')
  const [ref, setRef] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState<{ name?: string; ref?: string }>({})

  function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const next: typeof error = {}
    const problem = nameProblem(kind, n, tokens)
    if (problem) next.name = problem
    if (!ref) next.ref = '테두리를 골라 주세요.'
    setError(next)
    if (Object.keys(next).length === 0 && ref) onCreate(kind, kind.prefix + n, `var(${ref})`, writeBorderNote(kindId, text))
  }

  // 가리킬 굵기가 하나도 없으면 만들 수 없다. 막다른 곳이라 무엇을 먼저 할지 알려 준다.
  if (options.length === 0)
    return (
      <div>
        <p className="type-body text-ink-soft">의미 테두리는 테두리 판의 값을 가리켜요. 테두리 판에 값을 먼저 추가해 주세요.</p>
        <div className="mt-dialog-actions flex justify-end">
          <Button onClick={onCancel}>닫기</Button>
        </div>
      </div>
    )

  return (
    <form onSubmit={submit} className="space-y-fields">
      <Field label="종류" plain>
        <UsePicker
          label="종류"
          options={BORDER_KINDS}
          nameWidth="w-[64px]"
          value={kindId}
          onChange={(next) => {
            setKindId(next)
            // 같은 이름이 있는지는 종류마다 다르다.
            setError({ ...error, name: undefined })
          }}
        />
      </Field>
      <Field label="이름" error={error.name}>
        <input
          autoFocus
          className={inputClass}
          value={name}
          placeholder={kind.id === 'outline' ? 'focus' : 'edge'}
          onChange={(e) => {
            setName(e.target.value)
            setError({ ...error, name: undefined })
          }}
        />
      </Field>
      <Field label="가리키는 테두리" plain error={error.ref}>
        <UsePicker
          label="가리키는 테두리"
          options={options}
          value={ref}
          nameWidth="w-[64px]"
          onChange={(next) => {
            setRef(next)
            setError({ ...error, ref: undefined })
          }}
        />
      </Field>
      <Field label="설명">
        <input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} />
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
