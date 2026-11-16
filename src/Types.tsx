// 의미 글꼴: 글꼴 판의 재료 가운데 실제로 쓰는 조합(글꼴 종류 · 글자 크기 · 굵기)에 쓰임새의 이름을 붙여 모아 둔 판과, 그것을 만들고 고치는 양식.
// 한 줄에 조합 하나. 이름과 가리키는 값, 설명, 그 조합으로 적은 견본을 나란히 보여 준다.

import { useState, type CSSProperties } from 'react'
import { Copy } from 'lucide-react'
import type { Token } from './lib/api'
import { KINDS, SLUG, shortName, type Kind } from './lib/catalog'
import { shownFont } from './lib/fonts'
import { lookOf, trackOverride, writeType, type TypeLook, type TypeParts } from './lib/types'
import { CODE_OPEN, FoldSection, ICON_BUTTON, Section } from './Inspector'
import { HOVER, OUTLINE, SELECTED, SelectionLabel, isAdditive } from './TokenScreen'
import { Chip, Field, UnitInput, inputClass } from './ui'

const STYLE = KINDS.style
const FONT = KINDS.font
const SIZE = KINDS.size
const WEIGHT = KINDS.weight
const SAMPLE = '다람쥐 헌 쳇바퀴에 타고파 Aa 123'

/** 그 조합으로 글자를 그릴 때의 스타일. 없어진 값의 자리는 비워 두어 FF의 글자 모습을 따르게 한다. */
export function styleOf(look: TypeLook): CSSProperties {
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
    </>
  )
}

/** 실제로 그려지는 숫자. 28px / 36px / -0.015em · 600 */
const figures = (look: TypeLook) => [[look.size, look.line, look.track].filter(Boolean).join(' / '), look.weight].filter(Boolean).join(' · ')

/** 의미 글꼴의 목록. 줄마다 왼쪽에 이름, 가리키는 값, 설명이 있고 오른쪽에 그 조합으로 적은 견본이 있다. */
export function TypeList({
  items,
  all,
  selected,
  onSelect,
  onRename,
}: {
  items: Token[]
  /** 가리키는 값을 찾을 전체 값 목록. */
  all: Token[]
  selected: string[]
  onSelect: (name: string, additive: boolean) => void
  onRename: (name: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="space-y-1 rounded-lg border border-hairline bg-canvas p-1">
      {items.map((t) => {
        const short = shortName(STYLE, t.name)
        const look = lookOf(all, t.value, t.name)
        const isSelected = selected.includes(t.name)
        return (
          <button
            key={t.name}
            type="button"
            data-token={t.name}
            aria-pressed={isSelected}
            aria-label={short}
            onClick={(e) => onSelect(t.name, isAdditive(e))}
            onDoubleClick={() => onRename(t.name)}
            className={`group relative flex w-full items-center gap-4 rounded-md px-3 py-3 text-left select-none ${isSelected ? SELECTED : ''} ${HOVER} ${OUTLINE}`}
          >
            <span className="w-56 shrink-0">
              <span data-name className="block truncate text-sm text-ink-soft">
                {short}
              </span>
              <span className="block truncate font-mono text-xs leading-4 text-ink-faint">
                {look ? <Spec look={look} tokens={all} /> : <span className="text-danger">읽을 수 없는 값</span>}
              </span>
              {t.note && <span className="mt-1 block truncate text-xs leading-4 text-ink-faint">{t.note}</span>}
            </span>
            <span className="min-w-0 flex-1 overflow-hidden">
              {/* 이 안은 사용자의 글꼴을 보여 주는 미리보기라, FF 도구의 글자 규칙을 따르지 않는다. */}
              <span data-sample className="block truncate text-ink" style={look ? styleOf(look) : undefined}>
                {SAMPLE}
              </span>
            </span>
            {isSelected && selected.length === 1 && <SelectionLabel name={short} value={look ? figures(look) : undefined} />}
          </button>
        )
      })}
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
}: {
  label: string
  kind: Kind
  tokens: Token[]
  value: string
  /** 이름 옆에 적을 값(글꼴 이름, 28px, 600). */
  show: (t: Token) => string
  onChange: (name: string) => void
}) {
  const options = tokens.filter((t) => kind.matches(t.name))
  const missing = !options.some((t) => t.name === value)
  return (
    <Field label={label} error={missing ? '고른 값이 없어졌어요. 다시 골라 주세요.' : null}>
      <select aria-label={label} className={`${inputClass} min-w-0 ${missing ? 'border-danger' : ''}`} value={value} onChange={(e) => onChange(e.target.value)}>
        {missing && <option value={value}>{shortName(kind, value)} (없어짐)</option>}
        {options.map((t) => (
          <option key={t.name} value={t.name}>
            {shortName(kind, t.name)} · {show(t)}
          </option>
        ))}
      </select>
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
  const [noteDraft, setNoteDraft] = useState(token.note ?? '')
  const look = lookOf(tokens, token.value, token.name)
  const names = new Set(tokens.map((t) => t.name))
  // 줄 높이와 글자 사이는 글자 크기를 따른다. 이 조합만 다르게 하려면 직접 적는다. 비워 두면 크기의 값이 옅게 보이고 그것을 따른다.
  const get = (name: string) => tokens.find((t) => t.name === name)?.value ?? ''
  const [lineDraft, setLineDraft] = useState((look?.parts.line ?? '').replace(/px$/, ''))
  const [trackDraft, setTrackDraft] = useState((trackOverride(tokens, token.name) ?? '').replace(/em$/, ''))

  function commitName() {
    const next = nameDraft.trim()
    setNameError(null)
    if (!next) return setNameError('이름을 입력해 주세요.')
    if (!SLUG.test(next)) return setNameError('영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.')
    if (next === short) return
    if (names.has(STYLE.prefix + next)) return setNameError('같은 이름의 의미 글꼴이 이미 있어요.')
    onRename(STYLE.prefix + next)
  }

  function commitNote() {
    // 주석을 끝내는 기호와 줄바꿈은 파일을 깨뜨리므로 뺀다.
    const clean = noteDraft.replace(/\*\//g, '').replace(/\s+/g, ' ').trim()
    if (clean !== (token.note ?? '')) onChange({ note: clean })
  }

  const set = (patch: Partial<TypeParts>) => look && onChange({ value: writeType({ ...look.parts, ...patch }, names) })

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

      <Section title="조합">
        {look ? (
          <div className="space-y-2">
            {/* 이 안은 사용자의 글꼴을 보여 주는 미리보기다. 큰 글자도 잘리지 않고 줄을 바꿔 다 보인다. */}
            <div className="overflow-hidden rounded-md border border-hairline bg-canvas px-3 py-3">
              <p data-sample className="break-words text-ink" style={styleOf(look)}>
                {SAMPLE}
              </p>
            </div>
            <p className="font-mono text-xs leading-4 text-ink-faint">{figures(look)}</p>
            <PartField label="글꼴 종류" kind={FONT} tokens={tokens} value={look.parts.font} show={(t) => shownFont(t.value)} onChange={(font) => set({ font })} />
            <PartField label="글자 크기" kind={SIZE} tokens={tokens} value={look.parts.size} show={(t) => t.value} onChange={(size) => set({ size })} />
            <PartField label="굵기" kind={WEIGHT} tokens={tokens} value={look.parts.weight} show={(t) => t.value} onChange={(weight) => set({ weight })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="줄 높이">
                <UnitInput
                  label="줄 높이"
                  digits={lineDraft}
                  unit="px"
                  placeholder={get(`${look.parts.size}--line-height`).replace(/px$/, '')}
                  onDigits={(d) => {
                    setLineDraft(d)
                    if (!d) return set({ line: undefined })
                    if (/^\d*\.?\d+$/.test(d) && Number(d) > 0) set({ line: `${d}px` })
                  }}
                />
              </Field>
              <Field label="글자 사이">
                <UnitInput
                  label="글자 사이"
                  digits={trackDraft}
                  unit="em"
                  negative
                  placeholder={get(`${look.parts.size}--letter-spacing`).replace(/em$/, '') || '0'}
                  onDigits={(d) => {
                    setTrackDraft(d)
                    if (!d) return onTrack(null)
                    if (/^-?\d*\.?\d+$/.test(d)) onTrack(`${d}em`)
                  }}
                />
              </Field>
            </div>
          </div>
        ) : (
          <p className="text-sm text-danger">읽을 수 없는 값이에요. 파일에서 값을 고쳐 주세요.</p>
        )}
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

      <FoldSection title="코드" storageKey={CODE_OPEN}>
        <div className="space-y-2">
          <div>
            <p className="mb-1 text-sm font-[550] text-ink-faint">쓰는 법</p>
            <span className="flex items-center gap-1">
              <span className="min-w-0 flex-1">
                <Chip>{`font: var(${token.name})`}</Chip>
              </span>
              <button type="button" title={`font: var(${token.name}) 복사`} aria-label="코드 복사" onClick={() => onCopy(`font: var(${token.name});`)} className={ICON_BUTTON}>
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
                  <span className="ml-2 shrink-0 text-sm font-normal text-ink-faint">{u.where.length}곳</span>
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
