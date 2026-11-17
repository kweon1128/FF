// 효과(그림자, 투명도, 흐림) 판의 줄 목록과 예시, 그리고 값을 고치는 패널.
// 의미 색·의미 글꼴 판과 같은 짜임이다. 한 줄에 값 하나, 왼쪽에 이름·값·설명, 오른쪽에 그 값이 쓰인 모습.

import { useContext, useState, type ReactNode } from 'react'
import { Copy, Plus, X } from 'lucide-react'
import type { Token } from './lib/api'
import { SLUG, shortName, type Kind } from './lib/catalog'
import { EFFECT_WORDS, nextLayer, parseShadow, splitLayers, readEffectNote, writeEffectNote, writeShadow, type EffectKind, type EffectShape, type ShadowLayer } from './lib/effects'
import { surroundings, type Around } from './lib/roles'
import { PreviewFontContext, PreviewSpaceContext } from './ColorUses'
import { CODE_OPEN, FoldSection, ICON_BUTTON, Section, WHERE_OPEN } from './Inspector'
import { HOVER, OUTLINE, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'
import { Button, Chip, Field, Phrases, UnitInput, inputClass } from './ui'
import { useReorder } from './useReorder'

// 예시의 바탕이 판의 바탕과 같은 색이어도 가장자리가 보이게 하는 옅은 선.
const EDGE = 'shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)]'

/**
 * 효과가 실제로 쓰인 모습. 어떤 자리인지는 줄마다 정한 예시의 모양(shape)을 따르고, 그 안의 말은 줄마다 적은 문구(그 시스템이 실제로 쓰는 말)다.
 * 그림자는 그 그림자를 드리운 메뉴·창·알림·카드로, 투명도는 꺼진 버튼이나 화면을 가리는 막으로, 흐림은 뒤가 흐려 보이는 면으로 그린다.
 * 곁에 놓이는 것은 옅은 막대로 그려 자리만 알려 준다. 바탕과 글자 색은 이 디자인 시스템의 것이다.
 * 이 안은 사용자의 값을 보여 주는 미리보기라, FF 도구의 글자 규칙(type- 클래스)을 따르지 않는다. 글꼴 종류를 바깥에서 물려받아야 해서 크기와 굵기를 따로 적는다.
 */
export function EffectSample({ shape, value, around, words: written = '' }: { shape: EffectShape; value: string; around: Around; words?: string }) {
  const font = useContext(PreviewFontContext)
  const space = useContext(PreviewSpaceContext)
  const all = written || EFFECT_WORDS[shape]
  const faint = `color-mix(in oklab, ${around.ink} 16%, ${around.surface})`
  const bar = (width: string, more = '') => <span className={`block h-2 rounded-sm ${width} ${more}`} style={{ background: faint }} />
  const STRONG = 'text-sm leading-5 font-[550]'
  // 그림자는 상자 밖으로 지므로, 잘리지 않게 상자 둘레에 24px을 비워 둔다.
  // 내용은 상자의 가운데에 놓는다. 예시는 읽는 글이 아니라 물건 하나를 보여 주는 것이라, 왼쪽에 붙이면 오른쪽만 비어 덜 만든 것처럼 보인다.
  const frame = (body: ReactNode, roomy = false) => (
    <span className={`flex w-full items-center justify-center overflow-hidden rounded-md ${roomy ? 'p-board' : 'px-board-row py-board-row'} ${EDGE}`} style={{ ...space, background: around.surface, color: around.ink, fontFamily: font }}>
      {body}
    </span>
  )
  // 떠 있는 것의 가장자리. 그림자만으로는 흰 바탕 위의 흰 면이 구분되지 않아 옅은 선을 함께 둔다.
  const lifted = { background: around.surface, boxShadow: `${value}, 0 0 0 1px ${faint}` }
  switch (shape) {
    case 'menu':
      return frame(
        <span className="block w-40 space-y-rows rounded-lg p-menu" style={lifted}>
          {all
            .split(', ')
            .map((w) => w.trim())
            .filter(Boolean)
            .map((text) => (
              <span key={text} data-sample className="block rounded-md px-row-x py-menu text-sm leading-5 whitespace-nowrap">
                {text}
              </span>
            ))}
        </span>,
        true,
      )
    case 'dialog':
      return frame(
        <span className="block w-full max-w-56 rounded-lg p-dialog" style={lifted}>
          <span data-sample className={`block break-words ${STRONG}`}>
            {all}
          </span>
          {bar('w-3/4', 'mt-fields')}
          {bar('w-1/2', 'mt-blocks')}
          <span className="mt-dialog-actions flex justify-end gap-actions">
            <span className="block h-6 w-12 rounded-md" style={{ boxShadow: `inset 0 0 0 1px ${faint}` }} />
            <span className="block h-6 w-12 rounded-md" style={{ background: around.ink }} />
          </span>
        </span>,
        true,
      )
    case 'toast':
      return frame(
        <span data-sample className="inline-flex h-8 items-center rounded-md px-bar-x text-sm leading-5 whitespace-nowrap" style={{ background: around.ink, color: around.surface, boxShadow: value }}>
          {all}
        </span>,
        true,
      )
    case 'card':
      return frame(
        <span className="block w-full max-w-56 rounded-lg p-card" style={lifted}>
          <span data-sample className={`block break-words ${STRONG}`}>
            {all}
          </span>
          {bar('w-3/4', 'mt-fields')}
        </span>,
        true,
      )
    case 'disabled': {
      // 같은 버튼을 켜진 것과 꺼진 것으로 나란히 놓아, 얼마나 옅어지는지 견주어 본다.
      const BUTTON = `flex h-7 items-center rounded-md px-button-x whitespace-nowrap ${STRONG}`
      return frame(
        // 채운 버튼 한 쌍과 테두리 버튼 한 쌍. 쌍끼리는 떨어지지 않게 묶어, 좁은 칸에서는 쌍 단위로 줄이 바뀐다.
        <span className="flex flex-wrap items-center gap-x-columns gap-y-blocks">
          <span className="flex items-center gap-actions">
            <span className={BUTTON} style={{ background: around.ink, color: around.surface }}>
              {all}
            </span>
            <span data-sample className={BUTTON} style={{ background: around.ink, color: around.surface, opacity: value }}>
              {all}
            </span>
          </span>
          <span className="flex items-center gap-actions">
            <span className={BUTTON} style={{ boxShadow: `inset 0 0 0 1px ${faint}` }}>
              {all}
            </span>
            <span className={BUTTON} style={{ boxShadow: `inset 0 0 0 1px ${faint}`, opacity: value }}>
              {all}
            </span>
          </span>
        </span>,
      )
    }
    case 'scrim':
      // 화면(막대들) 위를 이 시스템의 글자 색으로 덮고, 그 위에 창을 하나 띄운다.
      return frame(
        <span className="relative block h-20 w-full">
          {bar('w-3/4')}
          {bar('w-1/2', 'mt-blocks')}
          {bar('w-2/3', 'mt-blocks')}
          {bar('w-1/3', 'mt-blocks')}
          <span data-sample className="absolute -inset-3" style={{ background: around.ink, opacity: value }} />
          <span className="absolute top-1/2 left-1/2 block h-12 w-24 -translate-x-1/2 -translate-y-1/2 rounded-md p-blocks" style={{ background: around.surface }}>
            {bar('w-3/4')}
            {bar('w-1/2', 'mt-blocks')}
          </span>
        </span>,
      )
    case 'glass':
      // 뒤에 놓인 것이 얼마나 흐려지는지. 왼쪽은 그대로, 오른쪽은 흐려진 것이다.
      return frame(
        <span className="flex items-center gap-columns">
          {[undefined, `blur(${value})`].map((filter, i) => (
            <span key={i} {...(filter ? { 'data-sample': true } : {})} className="block w-24 space-y-blocks" style={{ filter }}>
              <span className="block h-2 w-full rounded-sm" style={{ background: around.ink }} />
              <span className="block h-2 w-2/3 rounded-sm" style={{ background: around.ink }} />
              <span className="block h-2 w-3/4 rounded-sm" style={{ background: around.ink }} />
            </span>
          ))}
        </span>,
      )
    default:
      // 겹침: 막대들 위에 이 시스템의 글자 색 면을 이 투명도로 겹친다.
      return frame(
        <span className="relative block h-12 w-full">
          {bar('w-3/4')}
          {bar('w-1/2', 'mt-blocks')}
          {bar('w-2/3', 'mt-blocks')}
          <span data-sample className="absolute inset-y-0 left-4 w-24 rounded-md" style={{ background: around.ink, opacity: value }} />
        </span>,
      )
  }
}

/** 판에 적는 값. 투명도는 0.4를 40%로 적는다. 사람이 읽는 것은 퍼센트이기 때문이다. */
const shownValue = (kind: EffectKind, value: string) => {
  const n = Number(value)
  return kind === 'opacity' && value.trim() !== '' && Number.isFinite(n) ? `${Math.round(n * 1000) / 10}%` : value
}

/**
 * 효과 판의 내용. 한 줄에 값 하나. 왼쪽 칸(224px)에 이름, 값, 설명이 있고 오른쪽에 그 값이 쓰인 모습이 있다.
 * 이름과 값은 자르지 않는다(말줄임표를 쓰지 않는다). 그림자 값은 길어서 칸 안에서 줄을 바꿔 다 보여 준다.
 */
export function EffectList({
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
  /** 예시의 바탕과 글자 색을 찾을 전체 값 목록. */
  all: Token[]
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onRename: (name: string) => void
  /** 끌어서 차례를 바꾼다. 효과는 쓰임으로 이름 붙인 값이라 차례를 사람이 정한다. */
  onMove?: (name: string, before: string | null) => void
}) {
  const reorder = useReorder(items.map((t) => t.name), onMove)
  // 값이 없으면 빈 상자를 남기지 않는다. 추가는 묶음 제목 줄의 버튼으로 한다.
  if (items.length === 0) return null
  const id = kind.id as EffectKind
  const around = surroundings(all)
  return (
    <div className="space-y-rows rounded-lg border border-hairline bg-canvas p-menu">
      {items.map((t, i) => {
        const short = shortName(kind, t.name)
        const { text, shape, words, more } = readEffectNote(id, t.note, short)
        const isSelected = selected.includes(t.name)
        return (
          <button
            key={t.name}
            type="button"
            data-token={t.name}
            aria-pressed={isSelected}
            aria-label={`${short} ${t.value}`}
            onClick={(e) => !reorder.justDragged() && onSelect(t.name, isAdditive(e))}
            onDoubleClick={() => onRename(t.name)}
            {...reorder.grab(t.name)}
            className={`group relative flex w-full items-center gap-columns rounded-md px-board-row py-board-row-y text-left select-none ${reorder.moving(t.name) ? 'opacity-40' : ''} ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
          >
            {reorder.line(t.name, i)}
            <span className="w-56 shrink-0">
              <span data-name className="block type-label break-words">
                {short}
              </span>
              {/* 그림자는 겹마다 한 줄씩 적는다. 칸의 폭에서 아무 데서나 줄이 바뀌면 한 겹의 숫자들이 두 줄로 갈라져 읽기 어렵다. */}
              {id === 'shadow' ? (
                splitLayers(t.value).map((layer, k, list) => (
                  <span key={k} className="block type-code-sm break-words text-ink-faint">
                    {layer}
                    {k < list.length - 1 ? ',' : ''}
                  </span>
                ))
              ) : (
                <span className="block type-code-sm break-words text-ink-faint">{shownValue(id, t.value)}</span>
              )}
              {text && (
                <span className="mt-label block type-caption break-words text-ink-faint">
                  <Phrases text={text} />
                </span>
              )}
            </span>
            {/* 쓰임이 여럿인 값은 예시도 여럿이다. 위아래로 8px 띄워 쌓는다. */}
            <span className="block min-w-0 flex-1 space-y-blocks">
              {[{ shape, words }, ...more].map((e, k) => (
                <EffectSample key={k} shape={e.shape} value={t.value} around={around} words={e.words} />
              ))}
            </span>
            {/* 그림자 값은 길어서 이름표에 적지 않는다. */}
            {isSelected && selected.length === 1 && <SelectionLabel name={short} value={id === 'shadow' ? undefined : shownValue(id, t.value)} />}
          </button>
        )
      })}
    </div>
  )
}

/** 칸에 적는 숫자로 바꾼다. 0.06 → 6(%). */
const digitsOf = (n: number) => String(Math.round(n * 1000) / 1000)
const NUMBER = /^-?\d*\.?\d+$/

/** 그림자 한 겹의 칸들에 적는 중인 숫자. */
type LayerDraft = { x: string; y: string; blur: string; spread: string; alpha: string }
const draftOf = (l: ShadowLayer): LayerDraft => ({ x: digitsOf(l.x), y: digitsOf(l.y), blur: digitsOf(l.blur), spread: digitsOf(l.spread), alpha: l.alpha === null ? '' : digitsOf(l.alpha * 100) })

/**
 * 그림자를 겹마다 숫자로 고치는 칸들. 겹 하나는 가로, 세로, 흐림, 퍼짐, 진하기 다섯 칸이다.
 * 값을 글자로 통째로 적게 하면 "0 4px 16px rgb(0 0 0 / 0.08)"에서 어느 숫자가 무엇인지 외워야 하고, 쉼표 하나를 빠뜨려도 값이 깨진다.
 * 칸이 모두 숫자일 때만 저장한다. 적는 중에 비었거나 숫자가 아닌 칸이 있으면 저장하지 않고 그 칸에 빨간 테두리를 둔다.
 * 색을 rgb(…/진하기)가 아닌 꼴로 적은 겹은 진하기 칸 대신 색을 적힌 그대로 보여 준다(여기서 고치지 않는다).
 */
function ShadowFields({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [layers, setLayers] = useState(() => parseShadow(value) ?? [])
  const [drafts, setDrafts] = useState(() => layers.map(draftOf))
  // 밖에서 값이 바뀌면(되돌리기, 파일을 직접 고침) 칸을 그 값으로 다시 채운다. 여기서 방금 저장한 값이면 그대로 둔다.
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (value !== writeShadow(layers)) {
      const next = parseShadow(value) ?? []
      setLayers(next)
      setDrafts(next.map(draftOf))
    }
  }

  /** 칸들이 모두 숫자면 겹으로 읽는다. 하나라도 아니면 null. */
  const read = (base: ShadowLayer, d: LayerDraft): ShadowLayer | null => {
    const fields = [d.x, d.y, d.blur, d.spread, ...(base.alpha === null ? [] : [d.alpha])]
    if (!fields.every((s) => NUMBER.test(s))) return null
    const alpha = base.alpha === null ? null : Math.min(100, Math.max(0, Number(d.alpha))) / 100
    // 흐림은 음수가 될 수 없다.
    return { ...base, x: Number(d.x), y: Number(d.y), blur: Math.max(0, Number(d.blur)), spread: Number(d.spread), alpha }
  }

  function save(nextLayers: ShadowLayer[], nextDrafts: LayerDraft[]) {
    setDrafts(nextDrafts)
    const read_ = nextLayers.map((l, i) => read(l, nextDrafts[i]))
    if (read_.some((l) => l === null)) return
    const done = read_ as ShadowLayer[]
    setLayers(done)
    const written = writeShadow(done)
    setSeen(written)
    if (written !== value) onChange(written)
  }

  const patch = (i: number, key: keyof LayerDraft, digits: string) => save(layers, drafts.map((d, k) => (k === i ? { ...d, [key]: digits } : d)))

  const cell = (i: number, key: keyof LayerDraft, label: string, unit: string, negative = false) => (
    <Field label={label}>
      <UnitInput label={`겹 ${i + 1} ${label}`} digits={drafts[i][key]} unit={unit} negative={negative} invalid={!NUMBER.test(drafts[i][key])} onDigits={(digits) => patch(i, key, digits)} />
    </Field>
  )

  return (
    <div className="space-y-settings">
      {layers.map((l, i) => (
        <div key={i} data-layer={i}>
          {/* 겹이 하나뿐이면 지울 수 없다. 겹이 없는 그림자는 값이 아니다. */}
          <div className="mb-label flex h-8 items-center justify-between">
            <p className="type-label">겹 {i + 1}</p>
            {layers.length > 1 && (
              <button
                type="button"
                aria-label={`겹 ${i + 1} 지우기`}
                title="이 겹 지우기"
                onClick={() => {
                  const keep = (_: unknown, k: number) => k !== i
                  setLayers(layers.filter(keep))
                  save(layers.filter(keep), drafts.filter(keep))
                }}
                className={ICON_BUTTON}
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-field-row">
            {cell(i, 'x', '가로', 'px', true)}
            {cell(i, 'y', '세로', 'px', true)}
            {cell(i, 'blur', '흐림', 'px')}
            {cell(i, 'spread', '퍼짐', 'px', true)}
            {l.alpha === null ? (
              <Field label="색">
                <span className="flex h-8 items-center type-code break-all text-ink-soft">{l.color}</span>
              </Field>
            ) : (
              cell(i, 'alpha', '진하기', '%')
            )}
          </div>
        </div>
      ))}
      <Button
        variant="ghost"
        aria-label="겹 추가"
        onClick={() => {
          const more = nextLayer(layers)
          setLayers([...layers, more])
          save([...layers, more], [...drafts, draftOf(more)])
        }}
      >
        <Plus size={16} strokeWidth={1.5} />겹 추가
      </Button>
    </div>
  )
}

/** 숫자 하나로 된 값(투명도는 퍼센트, 흐림은 px)을 고치는 칸. 숫자일 때만 저장한다. */
function NumberField({ label, unit, value, toDigits, fromDigits, onChange }: { label: string; unit: string; value: string; toDigits: (value: string) => string; fromDigits: (digits: string) => string; onChange: (value: string) => void }) {
  const [digits, setDigits] = useState(() => toDigits(value))
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (!NUMBER.test(digits) || fromDigits(digits) !== value) setDigits(toDigits(value))
  }
  return (
    <UnitInput
      label={label}
      digits={digits}
      unit={unit}
      invalid={!NUMBER.test(digits)}
      onDigits={(next) => {
        setDigits(next)
        if (!NUMBER.test(next)) return
        const written = fromDigits(next)
        setSeen(written)
        if (written !== value) onChange(written)
      }}
    />
  )
}

/**
 * 효과 값 하나를 고치는 패널. 구역의 차례는 다른 패널과 같다: 이름, 값, 설명, 쓰이는 곳, 코드.
 * 예시는 여기서 고치지 않는다. 그 값이 화면 어디에 어떤 말로 쓰였는지는 페이지를 만든 AI가 파일의 주석에 적는다(파일 맨 위의 안내 참고).
 */
export function EffectInspector({
  token,
  kind,
  allNames,
  file,
  uses,
  onOpenComponent,
  onRename,
  onChange,
  onCopy,
}: {
  token: Token
  kind: Kind
  allNames: string[]
  file: string
  /** 이 값을 쓰는 컴포넌트와 그 자리들. */
  uses: { index: number; name: string; where: string[] }[]
  onOpenComponent: (index: number) => void
  onRename: (next: string) => void
  /** 값이나 주석(설명과 예시)을 바꾼다. */
  onChange: (patch: { value?: string; note?: string }) => void
  onCopy: (text: string) => void
}) {
  const id = kind.id as EffectKind
  const short = shortName(kind, token.name)
  const { text, picked, words, more } = readEffectNote(id, token.note, short)
  const [nameDraft, setNameDraft] = useState(short)
  const [nameError, setNameError] = useState<string | null>(null)
  const [textDraft, setTextDraft] = useState(text)
  const [rawDraft, setRawDraft] = useState(token.value)
  // 겹으로 읽을 수 있는 그림자인지. 읽을 수 없으면(none, var() 등) 글자로 고친다.
  const layered = id === 'shadow' && parseShadow(token.value) !== null

  function commitName() {
    const next = nameDraft.trim()
    setNameError(null)
    if (!next) return setNameError('이름을 입력해 주세요.')
    if (!SLUG.test(next)) return setNameError('영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.')
    if (next === short) return
    if (allNames.includes(kind.prefix + next)) return setNameError('같은 이름의 값이 이미 있어요.')
    onRename(kind.prefix + next)
  }

  function commitText() {
    // 같은 주석에 적혀 있는 예시(모양과 문구)는 그대로 둔다.
    if (textDraft.trim() !== text) onChange({ note: writeEffectNote(id, textDraft, picked, words, more) })
  }

  // 코드에서 쓰는 클래스. Tailwind가 --shadow-, --opacity-, --blur- 값마다 같은 이름의 클래스를 만든다.
  const className = `${id}-${short}`

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

      <Section title={kind.title}>
        {layered ? (
          <ShadowFields value={token.value} onChange={(value) => onChange({ value })} />
        ) : id === 'opacity' ? (
          <NumberField label="투명도" unit="%" value={token.value} toDigits={(v) => digitsOf(Number(v) * 100)} fromDigits={(d) => String(Math.min(100, Math.max(0, Number(d))) / 100)} onChange={(value) => onChange({ value })} />
        ) : id === 'blur' && /^\d*\.?\d+px$/.test(token.value) ? (
          <NumberField label="흐림" unit="px" value={token.value} toDigits={(v) => v.replace(/px$/, '')} fromDigits={(d) => `${Math.max(0, Number(d))}px`} onChange={(value) => onChange({ value })} />
        ) : (
          <input
            aria-label={kind.valueLabel}
            className={inputClass}
            value={rawDraft}
            onChange={(e) => setRawDraft(e.target.value)}
            onBlur={() => rawDraft.trim() && rawDraft.trim() !== token.value && onChange({ value: rawDraft.trim() })}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
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
                className="-ml-button-quiet-x flex h-8 max-w-full items-center rounded-md px-button-quiet-x type-label outline-selection hover:bg-hover focus-visible:outline-2"
              >
                <span className="truncate">{u.name}</span>
                <span className="ml-row-gap shrink-0 type-body text-ink-faint">{u.where.length}곳</span>
              </button>
              <p className="type-body text-ink-faint">{u.where.join(', ')}</p>
            </div>
          ))}
        </div>
      </FoldSection>

      <FoldSection title="코드" storageKey={CODE_OPEN}>
        <div className="space-y-blocks">
          <div>
            <p className="mb-label type-label text-ink-faint">쓰는 법</p>
            <div className="space-y-rows">
              {[
                { shown: className, label: '클래스 복사' },
                { shown: `var(${token.name})`, label: '변수 복사' },
              ].map((row) => (
                <span key={row.label} className="flex items-center gap-actions-tight">
                  <span className="min-w-0 flex-1">
                    <Chip>{row.shown}</Chip>
                  </span>
                  <button type="button" title={`${row.shown} 복사`} aria-label={row.label} onClick={() => onCopy(row.shown)} className={ICON_BUTTON}>
                    <Copy size={16} strokeWidth={1.5} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-label type-label text-ink-faint">저장된 값</p>
            <Chip>{token.value}</Chip>
          </div>
          <div>
            <p className="mb-label type-label text-ink-faint">저장 위치</p>
            <Chip>{file}</Chip>
          </div>
        </div>
      </FoldSection>
    </div>
  )
}
